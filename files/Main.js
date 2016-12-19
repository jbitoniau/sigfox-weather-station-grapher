'use strict';

function Main()
{
	var canvas = document.getElementById('graphCanvas');
	canvas.focus();

	var graphDataFetcher = new GraphDataFetcher('1D80C', 100);
	
	var graphData = graphDataFetcher._graphData;

	var graphDataWindow = {
		x: 0,
		y: -5,
		width: 100 * (10*60),
		height: 40
	};

	var graphOptions = {
		yPropertyName: 'temperature',
		clearCanvas: true,
		drawOriginAxes: true,
		drawDataRange: true,
		drawDataGaps: true,
		contiguityThreshold: 10.2 * 60,
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
		getPrimaryLinesTextX: GraphDataPresenter.getLinesTextForTime, 
		getPrimaryLinesSpacingX: GraphDataPresenter.getPrimaryLinesSpacingForTime,
		getSecondaryLinesSpacingX: GraphDataPresenter.getSecondaryLinesSpacingForTime,
		getPrimaryLinesTextY: GraphDataPresenter.getLinesText,
		getPrimaryLinesSpacingY: GraphDataPresenter.getLinesSpacing,
		getSecondaryLinesSpacingY: GraphDataPresenter.getSecondaryLinesSpacing
	};

	var graphController = new GraphController( canvas, graphData, graphDataWindow, graphOptions );

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
			width: 100 * (10*60),
			height: 40
		},
		'humidity' : {
			x: 0,	
			y: -5,
			width: 100 * (10*60),
			height: 105
		},
		'pressure' : {
			x: 0,	
			y: 950,
			width: 100 * (10*60),
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

	var promise = graphDataFetcher.fetchData()
		.then(
			function()
			{
				// Move graph window to last data point if there's any data at all
				if ( graphData.length>0 )
				{
					graphDataWindow.x = graphData[0].x - 90 *10*60;
				}
				graphController.render();
			})
		.catch(
			function( error )
			{
				alert( error.toString() );
			});

	var fetchDataIfNeeded = function()
		{
			var xminData = graphDataFetcher._xmin;
			if ( xminData===null )
				return Promise.resolve();

			if ( graphDataWindow.x<xminData )
			{
				if ( !graphDataFetcher.isFetching() && !graphDataFetcher.xminFinalReached() )
				{		
					var promise = graphDataFetcher.fetchData(xminData)
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
			graphController.render();
		});
}
