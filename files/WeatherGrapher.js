'use strict';

/*
	WeatherGrapher
*/	
function WeatherGrapher( canvas, deviceID, initialDate, autoscroll )
{
	var now = new Date();
	if ( !initialDate )
	{
		initialDate = now;
	}
	this._autoscroll = autoscroll || false;

	var initialWidth = 200 * GraphDataFetcher._messageIntervalMs;
	var initialX = initialDate.getTime() - (initialWidth/2);

	// The object that knows how to get data from SigFox backend
	this._graphDataFetcher = new GraphDataFetcher(deviceID, 100, initialX+initialWidth/2);

	// The type of graph data currently being displayed
	this._graphDataType = 'temperature';

	// The graph data window used to render the graph
	this._graphDataWindow = {
		x: initialX,
		y: -5,
		width: initialWidth,
		height: 40
	};

	// The backed-up graph data windows for each type of data
	this._graphDataWindows = {
		'temperature' : {
			x: initialX,	
			y: -5,
			width: initialWidth,
			height: 40
		},
		'humidity' : {
			x: initialX,	
			y: -10,
			width: initialWidth,
			height: 120
		},
		'pressure' : {
			x: initialX,	
			y: 950,
			width: initialWidth,
			height: 150							// When height is perfectly 100, I've got flickering on the Y lines
		}
	};

	// The graph option used for rendering
	this._graphOptions = {
		yPropertyName: this._graphDataType,
		clearCanvas: true,
		drawOriginAxes: true,
		drawDataRange: true,
		drawDataGaps: true,
		contiguityThreshold: GraphDataFetcher._messageIntervalMs,		
		textSize: 12,
		numMaxLinesX: 5,
		numMaxLinesY: 5,
		getPrimaryLinesTextX: GraphDataPresenter.getLinesTextForTime, 
		getPrimaryLinesSpacingX: GraphDataPresenter.getPrimaryLinesSpacingForTime,
		getSecondaryLinesSpacingX: GraphDataPresenter.getSecondaryLinesSpacingForTime,
		getPrimaryLinesTextY: GraphDataPresenter.getLinesText,
		getPrimaryLinesSpacingY: GraphDataPresenter.getLinesSpacing,
		getSecondaryLinesSpacingY: GraphDataPresenter.getSecondaryLinesSpacing,
		points: {
			//typicalDataPointXSpacing: 10*60*1000,		// No need if we provide a contiguityThreshold
			maxPointSize: 5,
			maxNumPoints: 500,
		}
		/*colors: {
			clear:'#FFFFFF',
			dataRange: "#EEEEEE",
			dataGaps: "#EEEEEE",
			axesLines: "#AA6666",
			primaryLinesText: '#AA6666',
			primaryLines: '#FFAAAA',
			secondaryLines: '#FFDDDD',
			dataLine: "#884444",
			dataPoint: "#884444",
		},*/
	};

	// The graph controller is responsible for rendering the graph and handling input events to navigate in it
	this._graphController = new GraphController( canvas, this._graphDataFetcher._graphData, this._graphDataWindow, this._graphOptions );

	// When the user navigates in the graph (i.e. changes the graph data window), we need to check whether more data needs to be fetched
	this._graphController._onGraphDataWindowChange = this._onGraphDataWindowChange.bind(this);
	this._graphController._onRendered = this._onRendered.bind(this);
	
	// Whenever the window resizes, we need to recalculate a few graph options to adjust to the new size
	window.addEventListener( "resize", this._onResize.bind(this) );

	this._onGraphDataTypeChanged = null;
	this._onAutoscrollChanged = null;

	this._forwardFetchTimeout = null;
	this._onFetch = null;			// fun( state )		// with state 'started', 'ok', 'error'

	// Initialize for current size
	this._onResize();

	// Start fetching
	this._fetchData();

	// Attempt fetching data on a regular basis (this won't necessarily trigger a request to the backend)
	this._forwardFetchInterval = setInterval( 
		function()
		{
			this._fetchData();
		}.bind(this),
		10 * 1000 );	
}

WeatherGrapher.prototype.setGraphDataType = function( graphDataType )
{
	if ( graphDataType===this._graphDataType )
		return;

	this._graphDataWindows[this._graphDataType].y = this._graphDataWindow.y;
	this._graphDataWindows[this._graphDataType].height = this._graphDataWindow.height;

	var prevGraphDataType = this._graphDataType;
	this._graphDataType = graphDataType;

	this._graphDataWindow.y = this._graphDataWindows[this._graphDataType].y;
	this._graphDataWindow.height = this._graphDataWindows[this._graphDataType].height;

	this._graphOptions.yPropertyName = this._graphDataType;
	this._graphController.render();

	if ( this._onGraphDataTypeChanged )
		this._onGraphDataTypeChanged( prevGraphDataType, this._graphDataType );
};

WeatherGrapher.prototype.setAutoscroll = function( autoscroll )
{
	if ( this._autoscroll===autoscroll )
		return;

	this._autoscroll = autoscroll;

	if ( this._autoscroll )
	{
		this._scrollToLatestData();
		this._graphController.render();
		this._fetchData();
	}

	if ( this._onAutoscrollChanged )
		this._onAutoscrollChanged();
};

WeatherGrapher.prototype.getAutoscroll = function()
{
	return this._autoscroll;
};

// Change the x position of the graph data window to show the latest data points.
// This method doesn't affect the other graph data window properties.
WeatherGrapher.prototype._scrollToLatestData = function()
{
	var graphData = this._graphDataFetcher._graphData;
	if ( graphData.length===0 )
		return;

	var latestDataPoint = graphData[0];
	this._graphDataWindow.x = latestDataPoint.x - this._graphDataWindow.width;
};

WeatherGrapher.prototype._fetchData = function()
{
	var promise = null;
	if ( this._autoscroll )
		promise = this._fetchDataForAutoscroll();
	else
		promise = this._fetchDataToFillGraphDataWindow();

	if ( promise )
	{
		if ( this._onFetch )
			this._onFetch('started');

		promise = promise
			.then(	
				function()
				{
					if ( this._autoscroll )
						this._scrollToLatestData();
					this._graphController.render();

					if ( this._onFetch )
						this._onFetch('ok');

					var nextPromise = this._fetchData();
					if ( !nextPromise )
						return Promise.resolve();
					return nextPromise;
				}.bind(this))
			.catch(
				function( error )
				{
					if ( this._onFetch )
						this._onFetch('error');
				}.bind(this));
	}
	return promise;
};

WeatherGrapher.prototype._fetchDataForAutoscroll = function()
{
	var promise = null;
	if ( this._graphDataFetcher.canFetchDataForward() ) 
	{
		promise = this._graphDataFetcher.fetchDataForward();
	}
	else
	{
		// If we start near in autoscroll mode near now-time and zoomed out significantly, 
		// we need to complete the window once forward fetching is done
		promise = this._fetchDataToFillGraphDataWindow();
	}
	return promise;
};

WeatherGrapher.prototype._fetchDataToFillGraphDataWindow = function()
{
	var promise = null;
	if ( !this._graphDataFetcher.getXMax() ||
		 this._graphDataWindow.x+this._graphDataWindow.width>this._graphDataFetcher.getXMax() )
	{
		promise = this._graphDataFetcher.fetchDataForward();
	}
	
	if ( !promise && this._graphDataWindow.x<this._graphDataFetcher.getXMin() )
	{	
		promise = this._graphDataFetcher.fetchDataBackward();
	}
	return promise;
};

WeatherGrapher.prototype._onGraphDataWindowChange = function( prevGraphDataWindow )
{
	if ( this.getAutoscroll() )
	{
		if ( this._graphDataWindow.x!==prevGraphDataWindow.x )
		{
			this.setAutoscroll( false );
		}
	}

	this._fetchData();
};

WeatherGrapher.prototype._onRendered = function()
{
	var canvas = this._graphController._canvas;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	var context = canvas.getContext("2d");

	//this._graphDataWindow 
	context.strokeStyle = "#FF4444";
	context.fillStyle = "rgba(0,0,20,0.3)";
	var xmax = this._graphDataFetcher.getXMax();
	if ( xmax!==null )
	{	
		var pt = GraphDataPresenter.graphDataPointToCanvasPoint( {x:xmax, y:0}, this._graphDataWindow, canvas );
		context.fillRect( pt.x, 0, 2, canvasHeight);	
	}

	var xmin = this._graphDataFetcher.getXMin();
	if ( xmin!==null )
	{	
		var pt = GraphDataPresenter.graphDataPointToCanvasPoint( {x:xmin, y:0}, this._graphDataWindow, canvas );
		context.fillRect( pt.x, 0, 2, canvasHeight);	
	}
};	

WeatherGrapher.prototype._onResize = function( event )
{
	this._updateLinesOptions();
	this._updatePointsOptions();
	this._graphController.render();
};

WeatherGrapher.prototype._updateLinesOptions = function()		 
{
	var canvas = this._graphController._canvas;
	var width = canvas.clientWidth;
	var height = canvas.clientHeight;

	var textSize = this._graphOptions.textSize;
	
	// Calculate a decent max number of grid lines along the x axis based 
	// on an average text/label width in pixels (itself calculated from font size)
	var averageCharWidth = textSize * 0.5;
	var maxTextWidth = averageCharWidth * 22 + 4;		// Include a few more pixels as a margin
	var numMaxLinesX = Math.floor( width / maxTextWidth );
	if ( numMaxLinesX<1 )
		numMaxLinesX = 1;
	
	// Based on the aspect ratio of the canvas and max number of lines on X,
	// we calculate a max number of linex on the Y axis so it looks balanced
	var numMaxLinesY = Math.floor( height / (maxTextWidth*0.7) );		// We can fit more y-lines than x-lines hence the 0.7 factor

	this._graphOptions.numMaxLinesX = numMaxLinesX;
	this._graphOptions.numMaxLinesY = numMaxLinesY;
};

WeatherGrapher.prototype._updatePointsOptions = function()
{
	var canvas = this._graphController._canvas;
	var width = canvas.clientWidth;
	this._graphOptions.points.maxNumPoints = Math.trunc( width * 0.3 );
};
