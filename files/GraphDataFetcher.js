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
function GraphDataFetcher(deviceID, limit, firstFetchTimeMs)
{
	this._deviceID = deviceID;
	this._limit = limit;
	this._firstFetchTimeMs = firstFetchTimeMs;	// The first fetch request will use this 'beforeTime' if specified
	this._graphData = [];		// An array of {x:<epoch time in milliseconds>, temperature:<in celsius>, pressure:<in hPa>, humidity:<in percent>}
	this._xmin = null;			// The most ancient possible x value on the backend. There's no data available before that point. When it is null, we don't know it yet
	this._xminFinal = false;
	this._xmax = null;		// The most recent x value on the backend. There's no data available (yet!) after that point. When null, we don't know it, but we'll query it quickly on first fetch
	this._promiseInProgress = null;
}

GraphDataFetcher._messageIntervalMs = 10.2*60*1000;	// Theoritical interval in milliseconds between weather messages. In practise, it's slightly more

GraphDataFetcher.prototype.isFetching = function()
{
	return !!this._promiseInProgress;
};

GraphDataFetcher.prototype.getXMin = function()
{
	return this._xmin;
};

GraphDataFetcher.prototype.getXMax = function()
{
	return this._xmax;
};

GraphDataFetcher.prototype.canFetchDataForward = function()
{
	if ( !this.getXMax() )
		return true;

	var now = new Date().getTime();
	var expectedNumberOfMessagesReadyForFetch = Math.floor( (now - this.getXMax()) / GraphDataFetcher._messageIntervalMs );
	if ( expectedNumberOfMessagesReadyForFetch<=0 )
		return false;
	
	return true;
};

GraphDataFetcher.prototype.fetchDataForward = function()
{
	//console.log("fetchDataForward");
	if ( this.isFetching() )
		return null;

	if ( !this.canFetchDataForward() )			// JBM: to enable
		return null;

	var x = this.getXMax();
	if ( x===null )
		x = this._firstFetchTimeMs;

	x += GraphDataFetcher._messageIntervalMs * this._limit * 0.9;	// The 0.9 factor is to allow a bit of overlap between the messages we're requesting and the ones we've got already
		
	// We can't fetch data past the current time of the backend server (it'd reply with an error).
	// So any request for fetch data forward in the future is clamped to current time.
	// Because our UTS time now might be slightly different, we're cautious a little time from 
	// it so we should be safe
	var now = new Date().getTime() - GraphDataFetcher._messageIntervalMs/2;
	if ( x>now )
		x = now;		

	var beforeTimeInSeconds = Math.floor(x/1000);

	var uri = GraphDataFetcher._getUri( this._deviceID, this._limit, beforeTimeInSeconds );
	var promise = HttpRequest.request( uri, 'GET')
		.then(
			function( response )
			{
				var messages = JSON.parse(response);
				var newGraphData = GraphDataFetcher._getGraphDataFromSigfoxMessages( messages );
			
				// Remove from new graph data the data we've already got 
				if ( this._graphData.length>0 )
				{			
					var xmax = this._graphData[0].x;
					var newGraphData2 = [];
					for ( var i=newGraphData.length-1; i>=0; i-- )
					{
						if ( newGraphData[i].x>xmax )
							newGraphData2.unshift( newGraphData[i] );
					}
					newGraphData = newGraphData2;
				}

				// Insert new graph data in front of the data we've got 
				if ( newGraphData.length>0 )
				{
					for ( var i=newGraphData.length-1; i>=0; i-- )
						this._graphData.unshift( newGraphData[i] );	
				}
				
			/*	if ( !this._xmax && newGraphData.length>0 && now-newGraphData[0].x<GraphDataFetcher._messageIntervalMs ) 
				{
					this._xmax = newGraphData[0].x;
				}
				else*/
				{
					this._xmax = x;
				}

				if ( !this._xmin )
				{
					if ( newGraphData.length>0 )
						this._xmin = newGraphData[newGraphData.length-1].x;		// newGraphData and this._graphData should be the same as this should be the first fetch
					else
						this._xmin = this._xmax;
				}

				this._promiseInProgress = null;

				return Promise.resolve(newGraphData);
			}.bind(this))
		.catch(
			function( error )
			{
				this._promiseInProgress = null;
				throw error;
			}.bind(this));

	this._promiseInProgress = promise;
	return promise;
};

GraphDataFetcher.prototype.canFetchDataBackward = function()
{
	// Once we've identified the final x min, we know there's nothing more to fetch ever
	//return this.getXMin();
	return !this._xminFinal;
};

GraphDataFetcher.prototype.fetchDataBackward = function()
{
	//console.log("fetchDataBackward");
	if ( this.isFetching() )
		return null;

	if ( !this.canFetchDataBackward() )
		return null;

	var x = this.getXMin();
	if ( x===null )
	{ 
		if ( this._firstFetchTimeMs )
		{	
			x = this._firstFetchTimeMs;
		}
		else
		{
			x = new Date().getTime();
		}
	}

	var beforeTimeInSeconds = Math.floor(x/1000);

	var uri = GraphDataFetcher._getUri( this._deviceID, this._limit, beforeTimeInSeconds );
	var promise = HttpRequest.request( uri, 'GET')
		.then(
			function( response )
			{
				var messages = JSON.parse(response);
				var newGraphData = GraphDataFetcher._getGraphDataFromSigfoxMessages( messages );

				// Remove from new graph data the data we've already got 
				if ( this._graphData.length>0 )
				{			
					var xmin = this._graphData[this._graphData.length-1].x;
					var newGraphData2 = [];
					for ( var i=0; i<newGraphData.length; ++i )
					{
						if ( newGraphData[i].x<xmin )
							newGraphData2.push( newGraphData[i] );
					}
					newGraphData = newGraphData2;
				}

				// Push new graph data at the end of the data we've got 
				if ( newGraphData.length>0 )
				{
					for ( var i=0; i<newGraphData.length; ++i )
						this._graphData.push( newGraphData[i] );	
				}
				
				if ( newGraphData.length>0 )
				{
					this._xmin = newGraphData[newGraphData.length-1].x;
				}
				else
				{
					this._xmin = x;		
					this._xminFinal = true;
				}
					
				if ( !this._xmax )
				{
					this._xmax = x;
				}

				this._promiseInProgress = null;

				return Promise.resolve(newGraphData);
			}.bind(this))
		.catch(
			function( error )
			{
				this._promiseInProgress = null;
				throw error;
			}.bind(this));

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
