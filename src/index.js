var Slack = require("slack-node");
var moment = require("moment");
var async = require("async");
var CronJob = require('cron').CronJob;

module.exports = function(robot) {

  // TOKEN BOT
  var tokenBot = "BOT_TOKEN";
  var slackBot = new Slack(tokenBot);

  // TOKEN TEAM
  var tokens = [
    "TOKEN_TEAM_MEMBER_1",
    "TOKEN_TEAM_MEMBER_2",
    "TOKEN_TEAM_MEMBER_3"
  ];

  var CHAT_ROOM = "CHAT_ROOM";
  var BOT_DELETED_FILES_MESSAGE = "BOT_DELETED_FILES_MESSAGE";
  var DAYS = 30;
  
  // IT STARTS AT 1st OF EVERY MONTH
  new CronJob('00 00 11 01 * *', function(){
    
    // ONCE EVERY "TOT" DAYS
    var interval = moment().add(-(DAYS), 'days').unix();
    var pages = 0;

    // FOR EVERY TOKEN OF THE TEAM
    async.each(tokens, function(token, callback) {

      slack = new Slack(token);

      async.waterfall([
        function(callback) {
          // FIND THE NUMBER OF PAGES (FILES ARE PAGINATED)
          slack.api("files.list", { ts_to: interval }, function(err, response) {
            var pages = response.paging.pages;
            console.log("Pages: " + pages);
            callback(null, pages);
          });
        },
        function(pages, callback) {    

          console.log("Token: " + token);

          // FOR EVERY PAGE
          async.times(pages, function(n, next) {
            slack.api("files.list", { page: n + 1, ts_to: interval }, function(err, response) {

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

  robot.router.get('/', function(req, res) {
    var now = new Date();
    res.send(now);
  });

}