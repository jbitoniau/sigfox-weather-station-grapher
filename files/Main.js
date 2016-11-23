'use strict';

function GraphDataFetcher(graphData)
{
	this._graphData = [];		// should be a public prop
	this._xmin = null;
	this._xmax = null;
	this._promiseInProgress = null;
}

GraphDataFetcher.prototype.fetchData = function( beforeTime )
{
	if ( this._promiseInProgress )
	{
		console.log("Fetching already in progress...");
		return Promise.reject();
	}

	var limit = 10;
	var uri = '/api/devices/1D80C/messages?limit=' + limit;
	if ( beforeTime!==null && beforeTime!==undefined )
	{
		uri += '&before=' + beforeTime;
	}

	var promise = HttpRequest.request( uri, 'GET')
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

	/// ------------
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
	/// ------------

				var graphData = [];
				for ( var i=0; i<messages.data.length; ++i  )
				{
					var message = messages.data[i];
					graphData.push( {x:message.time, y:message.weatherData.temperature} );
				}

				// Combine graph data we've just fetched with existing data
				if ( graphData.length>0 )
				{
					var xmin = graphData[graphData.length-1].x;
					var xmax = graphData[0].x;

					if ( this._graphData.length===0 )
					{
						// http://stackoverflow.com/questions/16232915/copying-an-array-of-objects-into-another-array-in-javascript
						this._graphData.push.apply(this._graphData, graphData);
						this._xmin = xmin;
						this._xmax = xmax;
					}
					else
					{
						// Very naive and incomplete!!!
						for ( var i=0; i<graphData.length; i++ )
						{
							if ( graphData[i].x<this._xmin )
							{
								this._graphData.push( graphData[i] );
							}
							this._xmin = this._graphData[this._graphData.length-1].x;
						}
					}
				}

				this._promiseInProgress = null;

				return Promise.resolve();
			}.bind(this))
		.catch(
			function( error )
			{
				this._promiseInProgress = null;
				throw error;
			});

	this._promiseInProgress = promise;
	return promise;
};

function Main()
{
	var graphDataFetcher = new GraphDataFetcher();
	
	var canvas = document.getElementById('graphCanvas');
	canvas.focus();

	var graphData = graphDataFetcher._graphData;

	var graphDataWindow = {
		x: 0,		// 1st of January 1970! 
		y: -5,
		width: 10 * (10*60),
		height: 60,
		xToString: 
			function(x)
			{
				var numMilliseconds = x * 1000;
				var date = new Date(numMilliseconds);
				var text = date.getHours() + ':' + date.getMinutes() + ' ' + date.getDate() + '/' + date.getMonth();
				return text;
			}
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

	var promise = graphDataFetcher.fetchData()
		.then(
			function()
			{
				if ( graphData.length>0 )
				{
					graphDataWindow.x = graphData[0].x - 5 *10*60;
				}
				graphController.update();
			})
		.catch(
			function( error )
			{
				alert( error.toString() );
			});

	graphController._onGraphDataWindowChange = function()
		{
			var xminData = graphDataFetcher._xmin;
			if ( xminData===null )
				return;

			var xminWindow = graphDataWindow.x + graphDataWindow.width/2;
			if ( xminWindow<xminData )
			{
				console.log('need loading');	
				if ( !graphDataFetcher._promiseInProgress )
				{		
					graphDataFetcher.fetchData(xminData).then(
						function()
						{
							graphController.update();
						})
					.catch(
						function( error )
						{
							alert( error.toString() );
						});
				}
			}
		};


}
