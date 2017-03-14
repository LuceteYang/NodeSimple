var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

    app.get('/get', function (req, res) {
        console.log(req.query.postId);
        res.json({"https": "success"})
    });

    app.post('/post', function (req, res) {
        console.log(req.body.postId);
        res.json({"https": "success"})
    });

    app.get('/header', function (req, res) {
    	res.json({"https": "success"})
    });

    app.post('/form', function (req, res) {
    	res.json({"https": "success"})
    });

module.exports = router;
