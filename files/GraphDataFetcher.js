'use strict';

/*
	GraphDataFetcher

	This class knows how to fetch data from the SIGFOX backend.
	Whenever data is fetched, it is added to the encapsulated graphData array.

	It could in theory fetch data in any order (using any random beforeTime) 
	and still maintain graphData properly, but for now it kind of assumes that
	fetchData is called from most recent time to further and further away back
	in time.
*/
function GraphDataFetcher(deviceID, limit)
{
	this._deviceID = deviceID;
	this._limit = limit;
	this._graphData = [];		// An array of {x:<epoch time in sec>, temperature:<in celsius>, pressure:<in hPa>, humidity:<in percent>}
	this._xmin = null;
	this._xminFinalReached = false;
	this._xmax = null;
	this._promiseInProgress = null;
}

GraphDataFetcher.prototype.isFetching = function()
{
	return !!this._promiseInProgress;
};

GraphDataFetcher.prototype.xminFinalReached = function()
{
	return this._xminFinalReached;
};

GraphDataFetcher.prototype.fetchData = function( beforeTime )
{
	if ( this.isFetching() )
		return Promise.reject();

	if ( this._xminFinalReached )
	{
		if ( beforeTime<=this._xmin )
			return Promise.reject();
	}

	var uri = '/api/devices/' + this._deviceID + '/messages?limit=' + this._limit;
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

				var messages = JSON.parse(response);
				if ( messages.data.length>0 )
				{
					var newGraphData = [];
				
					for ( var i=0; i<messages.data.length; ++i  )
					{
						var message = messages.data[i];
						//var numSecondsSinceEpoch = message.time;
						//var date = new Date( numSecondsSinceEpoch * 1000 );
						var weatherData = getWeatherDataFromUint8Array( createUint8ArrayFromMessageString( message.data ) );

						var x = message.time;
						if ( weatherData.temperature<-100 || weatherData.temperature>100 )
						{ 
							console.warn("Invalid temperature: " + weatherData.temperature + " at time " + x );
							weatherData.temperature = 0;
						}

						if ( weatherData.humidity<0 || weatherData.humidity>100 )
						{ 
							console.warn("Invalid humidity: " + weatherData.humidity + " at time " + x );
							weatherData.humidity = 0;
						}

						if ( weatherData.pressure<900 || weatherData.pressure>1200 )
						{ 
							console.warn("Invalid pressure: " + weatherData.pressure + " at time " + x );
							weatherData.pressure = 0;
						}

						newGraphData.push( 
							{
								x: x,
								temperature: weatherData.temperature,
								humidity: weatherData.humidity,
								pressure: weatherData.pressure,
								message: message  					// We keep track of the raw message in the graph data
							});
					}

					// Combine graph data we've just fetched with existing data
					if ( newGraphData.length>0 )
					{
						var xmin = newGraphData[newGraphData.length-1].x;
						var xmax = newGraphData[0].x;

						if ( this._graphData.length===0 )
						{
							// http://stackoverflow.com/questions/16232915/copying-an-array-of-objects-into-another-array-in-javascript
							this._graphData.push.apply(this._graphData, newGraphData);
							this._xmin = xmin;
							this._xmax = xmax;
						}
						else
						{
							// Very naive and incomplete!!!
							for ( var i=0; i<newGraphData.length; i++ )
							{
								if ( newGraphData[i].x<this._xmin )
								{
									this._graphData.push( newGraphData[i] );
								}
								this._xmin = this._graphData[this._graphData.length-1].x;
							}
						}
					}
				}
				else
				{
					this._xminFinalReached = true;
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