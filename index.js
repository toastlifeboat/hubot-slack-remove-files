var fs = require('fs');
var path = require('path');

module.exports = function(robot) {
  var scriptsPath = path.resolve(__dirname, './src');
  var scripts = fs.readdirSync(scriptsPath);

  if(scripts.indexOf('index.js') > -1) {
    debug('loading hubot-slack-remove-files');
    robot.loadFile(scriptsPath, 'index.js');
  }
}