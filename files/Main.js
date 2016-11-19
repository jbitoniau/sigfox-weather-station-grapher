'use strict';

function Main()
{
	var canvas = document.getElementById('graphCanvas');
	canvas.focus();
					
	var graphData = [];
	var graphDataWindow = {
		x: -20,		
		y: -5,
		width: 500,
		height: 50 
	};

	var graphController = new GraphController( canvas, graphData, graphDataWindow );
	graphController.update();

	var zoomInButton = document.getElementById('graphZoomInButton');
	zoomInButton.onclick = 
		function( event ) 
		{
			graphController.zoom( 0.8 );
			graphController.update();
		};

	var zoomOutButton = document.getElementById('graphZoomOutButton');
	zoomOutButton.onclick = 
		function( event ) 
		{
			graphController.zoom( 1.2 );
			graphController.update();
		};

	HttpRequest.request( '/api/devices/1D80C/messages', 'GET')
		.then(
			function( response )
			{
				var createUint8ArrayFromMessageString = function( messageString )
					{
						// http://stackoverflow.com/questions/1597709/convert-a-string-with-a-hex-representation-of-an-ieee-754-double-into-javascript
						var messageLengthInBytes = 12;
						var buffer = new ArrayBuffer(messageLengthInBytes);
						var uint8Array = new Uint8Array( buffer );
						for ( var i=0; i<messageLengthInBytes; i++ )
						{
							var byteAsHex = messageString.substr( i*2, 2 );
							var byte = parseInt( byteAsHex, 16 );
							uint8Array[i] = byte;
						}
						return uint8Array;
					};

				var getWeatherDataFromUint8Array = function( uint8Array )
					{
						var dataView = new DataView(uint8Array.buffer);
						var weatherData = {
							pressure: dataView.getUint32(0),		
							temperature: dataView.getFloat32(4),
							humidity: dataView.getUint32(8)
						};
						return weatherData;
					};


				var messages = JSON.parse(response);
				for ( var i=0; i<messages.data.length; ++i  )
				{
					var message = messages.data[i];
					var numSecondsSinceEpoch = message.time;
					var date = new Date( numSecondsSinceEpoch * 1000 );
					var weatherData = getWeatherDataFromUint8Array( createUint8ArrayFromMessageString( message.data ) );

					// Store decoded data directly in the response object
					message.weatherData = weatherData;
					message.date = date;
				}

				// Test displaying the data. We convert time in minutes and rebase it ot the first value (of the first page for now)
				var t0 = messages.data[0].time;
				for ( var i=0; i<messages.data.length; ++i  )
				{
					var message = messages.data[i];
					graphData.push( {x:(message.time-t0) / 60, y:message.weatherData.temperature} );
				}
				
				graphController
			})
		.catch(
			function( error )
			{
				alert( error.toString() );
			});
}
