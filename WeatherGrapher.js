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

function forwardApiCall( path, query, res )
{
	var options = {
		hostname: 'backend.sigfox.com',
		path: path + '?' + query,
		auth: sigfoxBackendAuth
	};

	console.log("Forwarding Sigfox REST api call: " + options.hostname + options.path );
	
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
		var query = url.parse(req.url).query; 
		if ( path.indexOf('/api/')===0 )
		{
			forwardApiCall( path, query, res );
		}
		else if ( path.indexOf('/files/')===0 )
		{
			var filename = path.substr(1);		// Remove the first '/'
			serveFile( filename, res );
		}
		else if ( path.indexOf('/devices/')===0 )
		{
			serveFile( 'WeatherGrapher.html', res );
		}
		else
		{
			createHTMLErrorResponse( res, 404, "Page not found");
		}
	});

function Main()
{
	console.log("Starting server...");
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
	server.listen(8080);
}

Main();

