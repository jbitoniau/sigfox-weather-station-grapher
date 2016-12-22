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
function GraphDataFetcher(deviceID, limit, firstFetchBeforeTimeMs)
{
	this._deviceID = deviceID;
	this._limit = limit;
	this._firstFetchBeforeTimeMs = firstFetchBeforeTimeMs;	// The first fetch request will use this 'beforeTime' if specified
	this._graphData = [];		// An array of {x:<epoch time in milliseconds>, temperature:<in celsius>, pressure:<in hPa>, humidity:<in percent>}
	this._xmin = null;			// In milliseconds
	this._xmax = null;
	this._xminFinalReached = false;
	this._promiseInProgress = null;
}

GraphDataFetcher._messageIntervalMs = 10*60*1000;	// Theoritical interval in milliseconds between weather messages. In practise, it's slightly more

GraphDataFetcher.prototype.isFetching = function()
{
	return !!this._promiseInProgress;
};

GraphDataFetcher.prototype.xminFinalReached = function()
{
	return this._xminFinalReached;
};

GraphDataFetcher.prototype.fetchDataForward = function()
{
	if ( this.isFetching() )
		return Promise.reject();

	var lastTimeMs = null;
	if ( this._xmax )
	{	
		lastTimeMs = this._xmax;
	}
	else if ( this._firstFetchBeforeTimeMs )
	{	
		lastTimeMs = this._firstFetchBeforeTimeMs;
	}

	var beforeTimeInSeconds = null;
	if ( lastTimeMs )
	{
		var beforeTimeMs = lastTimeMs + (GraphDataFetcher._messageIntervalMs*1.02) * (this._limit * 0.9);	// The 0.9 factor is to allow a bit of overlap between the messages we're requesting and the ones we've got already
		beforeTimeInSeconds = Math.floor( beforeTimeMs / 1000 );
	}

	var uri = GraphDataFetcher._getUri( this._deviceID, this._limit, beforeTimeInSeconds );
	var promise = HttpRequest.request( uri, 'GET')
		.then(
			function( response )
			{
				var messages = JSON.parse(response);
				var graphData = GraphDataFetcher._getGraphDataFromSigfoxMessages( messages );
			
				if ( graphData.length>0 )
				{
					if ( this._graphData.length===0 )
					{
						this._graphData.push.apply(this._graphData, graphData); 
						this._xmin = graphData[graphData.length-1].x;
						this._xmax = graphData[0].x;
					}
					else
					{
						for ( var i=graphData.length-1; i>=0; i-- )
						{
							if ( graphData[i].x>this._xmax )
								this._graphData.splice( 0, 0, graphData[i] );	// This is not efficient but will do for such small number of entries!
						}
						this._xmax = beforeTimeInSeconds*1000; ///this._graphData[0].x;
					}
				}
				else
				{
					// What to do?
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

GraphDataFetcher.prototype.fetchDataBackward = function()
{
	if ( this.isFetching() )
		return Promise.reject( new Error("GraphDataFetcher is already fetching data") );

	if ( this.xminFinalReached() )
		return Promise.reject( new Error("GraphDataFetcher has reached the end of data") );

	var lastTimeMs = null;
	if ( this._xmin )
	{	
		lastTimeMs = this._xmin;
	}
	else if ( this._firstFetchBeforeTimeMs )
	{	
		lastTimeMs = this._firstFetchBeforeTimeMs;
	}

	var beforeTimeInSeconds = null;
	if ( lastTimeMs )
	{
		beforeTimeInSeconds = Math.floor( lastTimeMs / 1000 );
	}

	var uri = GraphDataFetcher._getUri( this._deviceID, this._limit, beforeTimeInSeconds );
	var promise = HttpRequest.request( uri, 'GET')
		.then(
			function( response )
			{
				var messages = JSON.parse(response);
				var graphData = GraphDataFetcher._getGraphDataFromSigfoxMessages( messages );
			
				if ( graphData.length>0 )
				{
					if ( this._graphData.length===0 )
					{
						this._graphData.push.apply(this._graphData, graphData); // http://stackoverflow.com/questions/16232915/copying-an-array-of-objects-into-another-array-in-javascript
						this._xmin = graphData[graphData.length-1].x;
						this._xmax = graphData[0].x;
					}
					else
					{
						for ( var i=0; i<graphData.length; i++ )
						{
							if ( graphData[i].x<this._xmin )
								this._graphData.push( graphData[i] );
						}
						this._xmin = this._graphData[this._graphData.length-1].x;
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

GraphDataFetcher._getGraphDataFromSigfoxMessages = function( messages )
{
	var graphData = [];
	for ( var i=0; i<messages.data.length; ++i  )
	{
		var message = messages.data[i];
		var uint8Array = GraphDataFetcher._createUint8ArrayFromMessageString( message.data );
		var weatherData = GraphDataFetcher._getWeatherDataFromUint8Array( uint8Array );
		
		// Sigfox message timestamp is a UTC/GMT time expressed in seconds since Unix Epoch (1st of January 1970)
		// Graph data x axis is in milliseconds
		var x = message.time * 1000;	
		if ( weatherData.temperature<-100 || weatherData.temperature>100 )
		{ 
			console.warn("Invalid temperature: " + weatherData.temperature + " at time " + new Date(x) );
			weatherData.temperature = 0;
		}

		if ( weatherData.humidity<0 || weatherData.humidity>100 )
		{ 
			console.warn("Invalid humidity: " + weatherData.humidity + " at time " + new Date(x) );
			weatherData.humidity = 0;
		}

		if ( weatherData.pressure<900 || weatherData.pressure>1200 )
		{ 
			console.warn("Invalid pressure: " + weatherData.pressure + " at time " + new Date(x) );
			weatherData.pressure = 0;
		}

		graphData.push( 
			{
				x: x,
				temperature: weatherData.temperature,
				humidity: weatherData.humidity,
				pressure: weatherData.pressure,
				message: message  					// We keep track of the raw message in the graph data
			});
	}

	return graphData;
};

GraphDataFetcher._getUri = function( deviceID, limit, beforeTimeInSeconds )
{
	var uri = '/api/devices/' + deviceID + '/messages?limit=' + limit;
	if ( beforeTimeInSeconds!==null && beforeTimeInSeconds!==undefined )
	{
		uri += '&before=' + beforeTimeInSeconds;
	}
	return uri;
};

GraphDataFetcher._createUint8ArrayFromMessageString = function( messageString )
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

GraphDataFetcher._getWeatherDataFromUint8Array = function( uint8Array )
{
	var dataView = new DataView(uint8Array.buffer);
	var weatherData = {
		pressure: dataView.getUint32(0),		
		temperature: dataView.getFloat32(4),
		humidity: dataView.getUint32(8)
	};
	return weatherData;
};
