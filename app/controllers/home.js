var express = require('express'),
  router = express.Router(),
  Article = require('../models/article');
var uuidV4 = require('uuid/v4');
var gcm = require('node-gcm');
var sender = new gcm.Sender('AAAAwHckatg:APA91bGSPVowZZcaDU-6ENfwhfa6IlWsY2BTYR1vr66my-FGoc-9hWrDO03EmYtFSoi2Q5PIAMfZF2MJ7usZLKl4i_bVrLamRkb4KAfnoxeF7kIIMrrAxizuRVqgSOsXBk7-knS6x3Uw');

var youtubeApi = require("youtube-api");
var moment = require('moment');

youtubeApi.authenticate({type: "key", key: "AIzaSyBkwJDlJRbB7Q5TnIo-Jx2UCM5pldWKS40"});

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

router.post('/sendImgUrl', function(req, res, next) {
  // Prepare a message to be sent

  var imgUrl = req.query.img_url ;

  var message = new gcm.Message({
    data: {
      "img_url": imgUrl
    }
  });

  sender.send(message, {
    "to": "/topics/img"
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

router.get('/youtube_detail', function(req, res, next) {

  var youtube_url = req.query.video_url;
  var youtube_id = youtube_id_parser(youtube_url);

  if (youtube_url || youtube_id) {
    youtubeApi.videos.list({
      part: 'contentDetails,snippet',
      "id": youtube_id
    }, function(err, data) {

      console.log(data.items);

      if (err) {
        next(err);
      } else {
        var firstItem = data.items[0];

        if (firstItem) {
          var durationString = firstItem.contentDetails.duration;

          var title = firstItem.snippet.title;

          var duration = moment.duration(durationString).asMilliseconds();

          console.log(duration);
          console.log(title);

          res.json({
            "url": youtube_url,
            "id": youtube_id,
            "title": title,
            "duration": duration
          });

        } else {
          res.status(500).send({error: 'video not found'});
        }
      }

    });

  } else {
    res.status(500).send({error: 'video url is empty or not correct'});
  }

});

function youtube_id_parser(url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
  var match = url.match(regExp);
  return (match && match[7].length == 11)
    ? match[7]
    : false;
}
