var http = require('http');

//The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
var options = {
  host: 'localhost',
  port: 8080,
  path: '/about'
};

callback = function(response) {
  console.log("got a response");
  var str = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
    console.log("chunk");
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    console.log("END:" + str);
  });
}

http.request(options, callback).end();
