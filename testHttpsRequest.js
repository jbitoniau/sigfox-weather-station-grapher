var https = require('https');

// https://nodejs.org/api/https.html#https_https_request_options_callback

var options = {
  hostname: 'backend.sigfox.com',
  path: '/api/devices/yyyyyyyy/messages',
  auth: xxxxxxxxxx
};

callback = function(response) {
  console.log('statusCode:', response.statusCode);
  console.log('headers:', response.headers);
  var str = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    console.log(str);
  });
}

https.request(options, callback).end();
