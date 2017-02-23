var express = require('express'),
  router = express.Router(),
  Article = require('../models/article');
var uuidV4 = require('uuid/v4');
var gcm = require('node-gcm');
var sender = new gcm.Sender('AAAAwHckatg:APA91bGSPVowZZcaDU-6ENfwhfa6IlWsY2BTYR1vr66my-FGoc-9hWrDO03EmYtFSoi2Q5PIAMfZF2MJ7usZLKl4i_bVrLamRkb4KAfnoxeF7kIIMrrAxizuRVqgSOsXBk7-knS6x3Uw');

module.exports = function(app) {
  app.use('/', router);
};

router.get('/', function(req, res, next) {
  var articles = [new Article(), new Article()];
  res.render('index', {
    title: 'Generator-Express MVC',
    articles: articles
  });
});

var currentScheduleDataArray = [];

router.get('/schedule/:id', function(req, res, next) {
  var data = currentScheduleDataArray[req.params.id];

  if (data) {
    res.json(data);
  } else {
    res.sendStatus(404);
  }
});

router.post('/schedule', function(req, res, next) {
  // Prepare a message to be sent

  var dataId = uuidV4();
  currentScheduleDataArray[dataId] = req.body;

  var message = new gcm.Message({
    data: {
      "schedule_data_id": dataId
    }
  });

  sender.send(message, {
    "to": "/topics/schedule"
  }, function(err, response) {
    if (err) {
      console.error(err);
      res.sendStatus(404);
      return;
    }

    console.log(response);
    res.json({"schedule_data_id": dataId});
  });

});

router.get('/open_app', function(req, res, next) {
  var pkgName = req.query.pkg_name || "";

  var intentUri = req.query.intent_uri || "";

  console.log(pkgName);

  // Prepare a message to be sent
  var message = new gcm.Message({
    data: {
      "action": "open_app",
      "pkg_name": pkgName,
      "uri": intentUri
    }
  });

  sender.send(message, {
    "to": "/topics/open_app"
  }, function(err, response) {
    if (err) {
      console.error(err);
      res.sendStatus(404);
      return;
    }

    console.log(response);
    res.sendStatus(201);
  });

});

router.get('/close_app', function(req, res, next) {

  // Prepare a message to be sent
  var message = new gcm.Message({
    data: {
      "action": "close_app"
    }
  });

  sender.send(message, {
    "to": "/topics/open_app"
  }, function(err, response) {
    if (err) {
      console.error(err);
      res.sendStatus(404);
      return;
    }

    console.log(response);
    res.sendStatus(201);
  });

});
