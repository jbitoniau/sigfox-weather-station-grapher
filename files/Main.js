'use strict';

function Main()
{
	var canvas = document.getElementById('graphCanvas');
	canvas.focus();

	var graphDataFetcher = new GraphDataFetcher('1D80C', 100);
	
	var graphData = graphDataFetcher._graphData;

	var initialWidth = 100*10*60*1000;		// About 100 SigFox message (each message is 10 minute appart)
	var initialX = new Date().getTime() - initialWidth*0.9;
	
	var graphDataWindow = {
		x: initialX,
		y: -4,
		width: initialWidth,
		height: 40
	};

	var graphOptions = {
		yPropertyName: 'temperature',
		clearCanvas: true,
		drawOriginAxes: true,
		drawDataRange: true,
		drawDataGaps: true,
		contiguityThreshold: 10.2*60*1000,		// A little bit more than 10 minutes
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
	};

	var calculateBestNumLines = function()
		{
			var w = canvas.clientWidth;
			var h = canvas.clientHeight;

			// Calculate a decent max number of grid lines along the x axis based 
			// on an average text/label width in pixels (itself calculated from font size)
			var averageCharWidth = graphOptions.textSize * 0.5;
			var maxTextWidth = averageCharWidth * 24 + 5;		// Include a few more pixels as a margin
			var numMaxLabelsX = Math.floor( w / maxTextWidth );
			if ( numMaxLabelsX<1 )
				numMaxLabelsX = 1;
			graphOptions.numMaxLinesX = numMaxLabelsX;

			// Based on the aspect ratio of the canvas and max number of lines on X,
			// we calculate a max number of linex on the Y axis so it looks balanced
			graphOptions.numMaxLinesY = Math.floor( h / maxTextWidth );
		};

	var calculateBestPointsOptions = function()
		{
			var w = canvas.clientWidth;
			graphOptions.points.maxNumPoints = Math.trunc( w * 0.3 );
		};

	calculateBestNumLines();
	calculateBestPointsOptions();

	var graphController = new GraphController( canvas, graphData, graphDataWindow, graphOptions );
	graphController.render();

	var graphDataType = 'temperature';

	var buttons = {
		'temperature' : document.getElementById('temperatureButton'),
		'humidity' : document.getElementById('humidityButton'),
		'pressure' : document.getElementById('pressureButton')
	};

	var graphDataWindows = {
		'temperature' : {
			x: 0,	
			y: -5,
			width: 100 * (10*60*1000),
			height: 40
		},
		'humidity' : {
			x: 0,	
			y: -5,
			width: 100 * (10*60*1000),
			height: 105
		},
		'pressure' : {
			x: 0,	
			y: 950,
			width: 100 * (10*60*1000),
			height: 150
		}
	};

	var onGraphDataTypeChanged = function(prevGraphDataType, nextGraphDataType)
	{
		graphDataWindows[prevGraphDataType].y = graphDataWindow.y;
		graphDataWindows[prevGraphDataType].height = graphDataWindow.height;

		graphDataWindow.y = graphDataWindows[nextGraphDataType].y;
		graphDataWindow.height = graphDataWindows[nextGraphDataType].height;

		graphOptions.yPropertyName = nextGraphDataType;
		graphController.render();
	};

	for ( var t in buttons )
	{
		var button = buttons[t];
		button.graphDataType = t;

		button.onclick = function( event ) 
			{	
				var b = event.target;
				if ( b.graphDataType===graphDataType )
					return;

				var prevGraphDataType = graphDataType;
				var prevButton = buttons[prevGraphDataType];
				prevButton.className = "roundedButton";
				
				b.className = "roundedButtonToggled";
				
				graphDataType = b.graphDataType;

				onGraphDataTypeChanged(prevGraphDataType, graphDataType);
			};
	}

	buttons[graphDataType].className = "roundedButtonToggled";
	graphOptions.yPropertyName = graphDataType;

	var fetchDataIfNeeded = function()
		{
			var xmin = graphDataFetcher._xmin;
			if ( xmin===null || graphDataWindow.x<xmin )
			{
				if ( !graphDataFetcher.isFetching() && !graphDataFetcher.xminFinalReached() )
				{		
					var promise = graphDataFetcher.fetchData( Math.floor(xmin/1000) )
						.then(
							function()
							{
								graphController.render();
								return fetchDataIfNeeded();
							})
						.catch(
							function( error )
							{
								alert( error.toString() );
							});

					return promise;
				}
			}
			return Promise.resolve();
		};

	graphController._onGraphDataWindowChange = function()
		{
			fetchDataIfNeeded();
		};

	graphController._onRendered = function()
		{
		};	

	window.addEventListener( "resize", function(event) 
		{	
			calculateBestNumLines();
			calculateBestPointsOptions();
			graphController.render();
		});

	fetchDataIfNeeded();
}
