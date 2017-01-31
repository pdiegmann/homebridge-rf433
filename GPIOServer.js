var exec = require('child_process').exec;
var path = require('path');
var url = require('url') ;
var asyncQueue = require('async').queue;

var port = 8672;

process.argv.forEach(function (val, index, array) {
  if (val.indexOf("port=") == 0) {
    port = parseInt(val.split("=")[1]);
  }
});

const requestQueue = asyncQueue(function(task, callback) {
  var request = task.request;
  var response = task.response;

  var queryObject = url.parse(request.url,true).query;

  var execPath = queryObject.execPath;
  var pin = queryObject.pin;
  var systemCode = queryObject.systemCode;
  var unitCode = queryObject.unitCode;
  var powerState = queryObject.powerState == "true";

  exec([execPath,
    "--pin", pin,
    systemCode,
    unitCode,
    (powerState ? '1' : '0')
  ].join(' '), function (error, stdout, stderr) {
    setTimeout(function() {
      callback();
      error = error || stderr;
      if(error) {
        response.statusCode = 500;
        response.end("Something went wrong 3: " + error);
      } else {
        response.end();
      }
    }, 250);
  });
});

const http = require('http')

const requestHandler = (request, response) => {
  requestQueue.push({ request, response });
}

const server = http.createServer(requestHandler);
server.listen(port, (error) => {
  if (error) {
    return console.log('something went wrong 1: ', error);
  }

  console.log(`server is listening on ${port}`);
});
