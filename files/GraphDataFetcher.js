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
	this._temperatureData = [];		// should be a public prop
	this._pressureData = [];
	this._humidityData = [];	
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

	/// ------------
				var messages = JSON.parse(response);
				if ( messages.data.length>0 )
				{
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

					var temperatureData = [];
			var pressureData = [];
			var humidityData = [];	
					for ( var i=0; i<messages.data.length; ++i  )
					{
						var message = messages.data[i];
						var x = message.time;
						var y = message.weatherData.temperature;
						if ( y>=-200 && y <=200 )
						{ 
							temperatureData.push( {x:x, y:y} );
						}
						else
						{
							temperatureData.push( {x:x, y:0} );	// Still add it to the array so detecting end of x data below properly works. We shouldn't put a zero here but remove the point completely
							console.warn("Invalid temperature data point (x:" + x + ", y:"+y);
						}

						y = message.weatherData.pressure;
						if ( y>=900 && y<=1200 )
						{
							pressureData.push( {x:x, y:y} );
						}
						else
						{
							pressureData.push( {x:x, y:0} );	
							console.warn("Invalid pressure data point (x:" + x + ", y:"+y);
						}

						y = message.weatherData.humidity;
						if ( y>=0 && y<=100 )
						{
							humidityData.push( {x:x, y:y} );
						}
						else
						{
							humidityData.push( {x:x, y:0} );	
							console.warn("Invalid humidity data point (x:" + x + ", y:"+y);
						}
					}

					// Combine graph data we've just fetched with existing data
					if ( temperatureData.length>0 )
					{
						var xmin = temperatureData[temperatureData.length-1].x;
						var xmax = temperatureData[0].x;

						if ( this._temperatureData.length===0 )
						{
							// http://stackoverflow.com/questions/16232915/copying-an-array-of-objects-into-another-array-in-javascript
							this._temperatureData.push.apply(this._temperatureData, temperatureData);
			this._pressureData.push.apply(this._pressureData, pressureData);
			this._humidityData.push.apply(this._humidityData, humidityData);
											
							this._xmin = xmin;
							this._xmax = xmax;
						}
						else
						{
							// Very naive and incomplete!!!
							for ( var i=0; i<temperatureData.length; i++ )
							{
								if ( temperatureData[i].x<this._xmin )
								{
									this._temperatureData.push( temperatureData[i] );
									this._pressureData.push( pressureData[i] );
									this._humidityData.push( humidityData[i] );
								}
								this._xmin = this._temperatureData[this._temperatureData.length-1].x;
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