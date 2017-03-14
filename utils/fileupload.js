var fs = require('fs');
var easyimage = require('easyimage');
var config = require('../config.json');
var async = require('async');
var AWS = require('aws-sdk');
AWS.config.region = config.aws_config_wenwo.region;
AWS.config.accessKeyId = config.aws_config_wenwo.accessKeyId;
AWS.config.secretAccessKey = config.aws_config_wenwo.secretAccessKey;

var uploadDir = __dirname + '/../upload';

if (!fs.existsSync(uploadDir)) {
        console.log('fileupload upload 폴더 없음!');
    process.exit();
}

var S3 = new AWS.S3();
var bucketName = config.aws_config_wenwo.bucketName;


//Image
function uploadImageAndThumbnail(file, uploadInfo, callback) {

    var fileUrl = {};

    var timestamp = new Date().getTime();

    var fileName = uploadInfo.id + timestamp;
    var type = uploadInfo.type;
    if (!file) {
        callback("error", "사진 파일없음");
    } else {
        var contentType = file.type;
        var filePath = file.path;
        //winston.error('filePath',filePath);
        //winston.error('contentType',contentType);
        var readStream = fs.createReadStream(file.path);

        async.waterfall([
            // step1. 원본이미지 올리기, 이미지 경로 call보내기
            function (waterfall_callback) {
                //contentType -image, audio 여부 확인 후 s3경로 설정
                var itemKey = type + '/Image/' + fileName;
                var params = {
                    Bucket: bucketName,
                    Key: itemKey,
                    ACL: 'public-read',
                    Body: readStream,
                    ContentType: contentType
                }

                S3.putObject(params, function (err, data) {
                    if (err) {
                        winston.error('S3 Putobject Error', err);
                        //return res.json({code:200,msg:'s3 update err', result:{}});
                        waterfall_callback(err);
                    } else {
                        var Q_fileUrl = S3.endpoint.href + bucketName + '/' + itemKey;
                        fileUrl.url = Q_fileUrl;
                        waterfall_callback(null, fileUrl);
                    }
                });

            },
            // step2. 썸네일 만들기, 올리기/ 경로
            function (fileUrl, callback) {

                var th_fileName = fileName + '_th'; // 썸네일 파일명
                var th_filePath = uploadDir + '/' + th_fileName;
                //winston.error('filePaht',filePath);
                //winston.error('th_filePath',th_filePath);
                var thumb_width;
                var thumb_height;
                switch (uploadInfo.code) {
                    case 0:
                        thumb_width = 144;
                        thumb_height = 144;
                        break;
                    case 1:
                        thumb_width = 394;
                        thumb_height = 295.5;
                        break;
                    case 2:
                        thumb_width = 828;
                        thumb_height = 100000000000;
                        break;
                    case 3:
                        thumb_width = 828;
                        thumb_height = 414;
                        break;
                }

                easyimage.resize({
                    src: filePath,
                    dst: th_filePath,
                    width: thumb_width,
                    height: thumb_height
                }).then(function (image) {
                    var th_itemKey = type + '/Image/' + th_fileName;
                    var th_readStream = fs.createReadStream(th_filePath);

                    var params = {
                        Bucket: bucketName,
                        Key: th_itemKey,
                        ACL: 'public-read',
                        Body: th_readStream,
                        ContentType: contentType
                    };

                    S3.putObject(params, function (err, data) {
                        if (err) {
                            winston.error('S3 Putobject Error', err);
                            callback(err);
                        } else {
                            var Q_th_fileUrl = S3.endpoint.href + bucketName + '/' + th_itemKey;
                            //winston.error('th_fileUrl ', Q_th_fileUrl);
                            fileUrl.thurl = Q_th_fileUrl;
                            //winston.error('fileUrl?', fileUrl);
                            fs.unlinkSync(filePath);
                            fs.unlinkSync(th_filePath);
                            callback();
                        }
                    });
                }, function (err) {
                    winston.error('err', err);
                });
            }, function (err) {
                if (err) {
                    //winston.error('uploadImageAndThumbnail err',err);
                }
                //winston.error('uploadImageAndThumbnail success?');
                callback(null, fileUrl);
            }
        ]);
    }
}

//질문 이미지2개까지 올릴수잇는함수
function questionImageupload(files, uploadInfo, callback) {
    var fileurl = {};
    var file_image1 = files.image0;
    var file_imgge2 = files.image1;
    uploadImageAndThumbnail(file_image1, uploadInfo, function (err, result) {
        if (err) {
            winston.error('upload error', err);
            callback(err, result);
        } else {
            fileurl.pictureurl = result.url;
            fileurl.pictureurlth = result.thurl;
            if (file_imgge2 != undefined) {
                uploadImageAndThumbnail(file_imgge2, uploadInfo, function (err, result1) {
                    if (err) {
                        winston.error('upload error', err);
                        callback(err, result1);
                    } else {
                        fileurl.type = 12;
                        fileurl.pictureurl1 = result1.url;
                        fileurl.pictureurlth1 = result1.thurl;
                        callback(null, fileurl);
                    }
                })
            } else {
                fileurl.type = 11;
                callback(null, fileurl);
            }
        }
    })
}
