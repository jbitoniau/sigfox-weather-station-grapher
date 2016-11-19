'use strict';

var http = require('http');
var https = require('https');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');

var sigfoxBackendAuth = null;

function createHTMLErrorResponse( res, code, message )
{
	res.writeHead(code, {"Content-Type:": "text/html"});
	res.write(
		'<!DOCTYPE html>'+
		'<html>'+
		'    <head>'+
		'        <meta charset="utf-8" />'+
		'        <title>Error</title>'+
		'    </head>'+ 
		'    <body>'+
		'     	<p>' + message + '</p>'+
		'    </body>'+
		'</html>');
	res.end();
}

function forwardApiCall( path, res )
{
	console.log("Forwarding Sigfox REST api call: " + path);
	
	var options = {
		hostname: 'backend.sigfox.com',
		path: path,
		auth: sigfoxBackendAuth,
	};

	var callback = function(response) 
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
					res.writeHead(200, {"Content-Type:": "application/json"});
					res.write(str);
					res.end();
				});
		};

	var req = https.request(options, callback);

	req.on('error', 
		function(err) 
		{
			console.log("ERROR: " + err);
			createHTMLErrorResponse( res, 500, err );
		});

	req.end();
}

function serveFile( filename, res )
{
	console.log("Serving file: " + filename);
	fs.readFile(filename, 'utf8', 
		function(err, data) 
			{
		  		if ( err ) 
		  		{
		    		createHTMLErrorResponse( res, 500, err );
		  		}
		  		else
		  		{
		  			res.writeHead(200); //{"Content-Type:": "application/json"});	// The server should certainly provide content type based on file extension
					res.write(data);
					res.end();
				}
			});
}

var server = http.createServer( 
	function(req, res)
	{
		//console.log("HTTP request: " + req.url );

		var path = url.parse(req.url).pathname;
		if ( path.indexOf('/api/')===0 )
		{
			forwardApiCall( path, res );
		}
		else if ( path.indexOf('/files/')===0 )
		{
			var filename = path.substr(1);		// Remove the first '/'
			serveFile( filename, res );
		}
		else if ( path==='/')
		{
			fs.readFile('Tempmon.html', 'utf8', 
			function (err,data) 
			{
		  		if (err) {
		    		return console.error(err);
		  		}
		  		res.end(data);
			});
		}
		else if ( path==='/testurl')
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
		else if ( path==='/about')
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
		else if ( path==='/test')
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
			createHTMLErrorResponse( res, 404, "Page not found");
		}
	});


console.log("Starting server...");

/*const file = fs.createWriteStream('test.txt');
file.write('toto');
file.end('titi');*/

console.log("Loading credentials...");
fs.readFile('SigfoxBackendAuth.txt', 'utf8', 
	function (err,data) 
	{
		console.log("Credentials loaded");
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
