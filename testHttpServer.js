var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');

function getMessagesFromBackEnd( res )
{
	res.writeHead(200, {"Content-Type:": "application/json"});
	res.write(
		'{ ' +
		'	"name" : "john", ' +
		' 	"age" : 33' +
		'} ' );
}

var server = http.createServer( 
	function(req, res)
	{
		console.log("request: " + req.url );

		var page = url.parse(req.url).pathname;
		console.log("page: " + page );
		
		if ( page==='/')
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
		}
		else if ( page==='/api')
		{
			res.writeHead(200, {"Content-Type:": "application/json"});
			res.write(
				'{ ' +
				'	"name" : "john", ' +
				' 	"age" : 42 ' +
				'} ' );
		}
		else if ( page==='/api/messages')
		{
			getMessagesFromBackEnd( res );
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
		}
		
    	res.end();
	});


console.log("starting...");
const file = fs.createWriteStream('test.txt');
file.write('toto');
file.end('titi');

server.on('close', 
	function()
	{
		console.log("closing server...");
	});

server.listen(8080);
//server.close();
