var Slack = require("slack-node");
var moment = require("moment");
var async = require("async");
var CronJob = require('cron').CronJob;

module.exports = function(robot) {

  var CHAT_ROOM = "CHAT_ROOM";
  var BOT_WARNING_MESSAGE = "BOT_WARNING_MESSAGE";
  var BOT_DELETED_FILES_MESSAGE = "BOT_DELETED_FILES_MESSAGE";
  var DAYS = 30;
  var TYPES = "images";

  var CLIENT_ID = "CLIENT_ID";
  var CLIENT_SECRET = "CLIENT_SECRET";

  // TOKEN BOT
  var tokenBot = "BOT_TOKEN";
  var slackBot = new Slack(tokenBot);

  // TOKEN TEAM
  var tokens = [
    "TOKEN_TEAM_MEMBER_1",
    "TOKEN_TEAM_MEMBER_2",
    "TOKEN_TEAM_MEMBER_3"
  ];

  // YOU ARE WARNED AN HOUR BEFORE
  new CronJob('00 00 10 01 * *', function(){
    slackBot.api("chat.postMessage", { 
      channel: CHAT_ROOM, 
      text: BOT_WARNING_MESSAGE, 
      as_user: true
    }, function(err, response) {
      console.log("Users warned.");
    });
  });
  
  // IT STARTS AT 1st OF EVERY MONTH
  new CronJob('00 00 11 01 * *', function(){
    
    // ONCE EVERY "TOT" DAYS
    var interval = moment().add(-(DAYS), 'days').unix();
    var pages = 0;

    // FOR EVERY TOKEN OF THE TEAM
    async.each(tokens, function(token, callback) {

      slack = new Slack(token);
      console.log(slack);

      async.waterfall([
        function(callback) {
          // IT FINDS THE NUMBER OF PAGES (FILES ARE PAGINATED)
          slack.api("files.list", { ts_to: interval, types: TYPES }, function(err, response) {
            var pages = response.paging.pages;
            console.log("Token: " + token);
            console.log("Pages: " + pages);
            callback(null, pages);
          });
        },
        function(pages, callback) { 
          // FOR EVERY PAGE
          async.times(pages, function(n, next) {
            slack.api("files.list", { page: n + 1, ts_to: interval, types: TYPES }, function(err, response) {

              // FOR EVERY FILE FOUND
              async.each(response.files, function(element, callback) {

                console.log("TIMESTAMP: " + element.timestamp);
                console.log("URL: " + element.url + "\n");

                slack.api("files.delete", { file: element.id } , function(err, response) {
                  console.log(response);
                  callback(null);
                });

              }, function(err) {
                callback();
              });                
            });
          }, function(err, files) {
            callback();
          });             
        }
      ], function (err, result) {
        callback();   
      });

    }, function(err) {

      if(err) {
        console.log('Error in a token.');
      } else {

        slackBot.api("chat.postMessage", { 
          channel: CHAT_ROOM, 
          text: BOT_DELETED_FILES_MESSAGE, 
          as_user: true
        }, function(err, response) {
          console.log("Files deleted.");
        });
      }
    });     

  }, null, true, "Europe/London");

  // GO TO / AND CREATE THE TOKEN
  robot.router.get('/', function(req, res) {
    res.send('<a href="https://slack.com/oauth/authorize?scope=files:write:user,files:read&client_id=' + CLIENT_ID + '"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"></a>');
  });

  // YOU CAN SEE YOUR TOKEN AT /callback 
  robot.router.get('/callback', function(req, res) {
    var code = req.query.code;

    request.post({
      url: "https://slack.com/api/oauth.access",
      form: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code: code }
    }, function(error, response, body){
      var body = JSON.parse(body);
      res.send("Token: " + body.access_token);
    });

  });

}
