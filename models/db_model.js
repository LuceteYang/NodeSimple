var config = require('../config.json');
var pg = require('pg');
var pool = new pg.Pool(config.db_config);

exports.noticeList = function (data, callback) {
    pool.connect(function (err, client, done) {
        if (err) {
            done();
            winston.error("noticeList connect", err);
            callback(err);
        } else {
            var sql = 'select n.id_num as "notice-id-num", n.title as "title", to_char(n.written_date_time, \'YYYY.MM.DD,HH24:MI\') as "written-date-time" from notice n ';
            var data1 = [];
            if (data != 0) {
                data1.push(data);
                sql += "where n.id_num<$1 ";
            }
            sql += 'order by n.id_num desc limit 10';
            client.query(sql, data1, function (err, result) {
                done();
                if (err) {
                    winston.error("noticeList sql", err);
                    callback(err);
                } else {
                    callback(null, {"notice-list": result.rows});
                }
            });
        }
    });
};