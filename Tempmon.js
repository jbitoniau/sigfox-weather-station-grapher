var http = require('http');
var https = require('https');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');

var sigfoxBackendAuth = null;

function forwardApiCall( apiPath, res )
{
	var options = {
		hostname: 'backend.sigfox.com',
		path: apiPath,
		auth: sigfoxBackendAuth,
	};

	callback = function(response) 
	{
		//console.log('statusCode:', response.statusCode);
		//console.log('headers:', response.headers);
		var str = '';
		response.on('data', function (chunk) 
			{
				str += chunk;
			});	

		response.on('end', 
			function() 
			{
				//console.log(str);
				res.writeHead(200, {"Content-Type:": "application/json"});
				res.write(str);
				res.end();
			});
	}
	https.request(options, callback).end();
}

var server = http.createServer( 
	function(req, res)
	{
		console.log("request: " + req.url );

		var page = url.parse(req.url).pathname;
		console.log("page: " + page );
		
		if ( page.indexOf('/api/')===0 )
		{
			forwardApiCall( page, res );
		}
		else if ( page==='/')
		{
			res.writeHead(200, {"Content-Type:": "text/html"});

			var q = url.parse(req.url).query;
			var params = querystring.parse(q);

			res.write(
				'<!DOCTYPE html>'+
				'<html>'+
				'    <head>'+
				'        <meta charset="utf-8" />'+
				'        <title>Ma page Node.js !</title>'+
				'    </head>'+ 
				'    <body>'+
				'     	<p>Voici un paragraphe <strong>HTML</strong> !</p>'+
				'     	<p>the query string: ' + q + '</p>');

			for ( var key in params )
			{
				res.write( 
				'     	<p>' + key + ' = ' + params[key] + '</p>' 
				);
			}

			res.write(
				'    </body>'+
				'</html>');
			res.end();
		}
		else if ( page==='/about')
		{
			res.writeHead(200, {"Content-Type:": "text/html"});
			res.write(
				'<!DOCTYPE html>'+
				'<html>'+
				'    <head>'+
				'        <meta charset="utf-8" />'+
				'        <title>Ma page Node.js !</title>'+
				'    </head>'+ 
				'    <body>'+
				'     	<p style="background-color:#ff00ff">About!</p>'+
				'    </body>'+
				'</html>');
			res.end();
		}
		else if ( page==='/test')
		{
			res.writeHead(200, {"Content-Type:": "application/json"});
			res.write(
				'{ ' +
				'	"name" : "john", ' +
				' 	"age" : 42 ' +
				'} ' );
			res.end();
		}
		else
		{
			res.writeHead(404, {"Content-Type:": "text/html"});
			res.write(
				'<!DOCTYPE html>'+
				'<html>'+
				'    <head>'+
				'        <meta charset="utf-8" />'+
				'        <title>Ma page Node.js !</title>'+
				'    </head>'+ 
				'    <body>'+
				'     	<p>:-( Page not found</p>'+
				'    </body>'+
				'</html>');
			res.end();
		}
	});


console.log("Starting server...");

/*const file = fs.createWriteStream('test.txt');
file.write('toto');
file.end('titi');*/

fs.readFile('SigfoxBackendAuth.txt', 'utf8', 
	function (err,data) 
	{
  		if (err) {
    		return console.error(err);
  		}
  		sigfoxBackendAuth = data;
	});


server.on('close', 
	function()
	{
		console.log("Closing server...");
	});

server.listen(8080);
//server.close();
