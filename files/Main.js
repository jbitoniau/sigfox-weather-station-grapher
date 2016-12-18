'use strict';

function Main()
{
	var canvas = document.getElementById('graphCanvas');
	canvas.focus();
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	var graphDataFetcher = new GraphDataFetcher('1D80C', 100);
	var graphData = graphDataFetcher._temperatureData;
var pressureData = graphDataFetcher._pressureData;
var humidityData = graphDataFetcher._humidityData;

	var graphDataWindow = {
		x: 0,		// 1st of January 1970! 
	y: -5,
//		y: 950,
		width: 100 * (10*60),
//		height: 150
			height: 40
	};

	var graphOptions = {
		clearCanvas: true,
		drawOriginAxes: true,
		drawDataRange: true,
		drawDataGaps: true,
		contiguityThreshold: 10.2 * 60,
			
		clearColor:'#FFFFFF',
		dataRangeColor: "#EEEEEE",
		dataGapsColor: "#EEEEEE",
		axesLinesColor: "#AA6666",
		primaryLinesTextColor: '#AA6666',
		primaryLinesColor: '#FFAAAA',
		secondaryLinesColor: '#FFDDDD',
		dataLineColor: "#884444",
		dataPointColor: "#884444",

		getPrimaryLinesTextX: GraphDataPresenter.getLinesTextForTime, 
		getPrimaryLinesSpacingX: GraphDataPresenter.getPrimaryLinesSpacingForTime,
		getSecondaryLinesSpacingX: GraphDataPresenter.getSecondaryLinesSpacingForTime,
		getPrimaryLinesTextY: GraphDataPresenter.getLinesText,
		getPrimaryLinesSpacingY: GraphDataPresenter.getLinesSpacing,
		//getSecondaryLinesSpacingY: GraphDataPresenter.getSecondaryLinesSpacing
	};

	var graphController = new GraphController( canvas, graphData, graphDataWindow, graphOptions );
	//graphController.render();

	/*var zoomInButton = document.getElementById('graphZoomInButton');
	zoomInButton.onclick = 
		function( event ) 
		{
			graphController.zoom( 0.8, null, 'x' );
			graphController.render();
		};

	var zoomOutButton = document.getElementById('graphZoomOutButton');
	zoomOutButton.onclick = 
		function( event ) 
		{
			graphController.zoom( 1.2, null, 'x' );
			graphController.render();
		};*/

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
			var graphDataWindow2 = {
					x: graphDataWindow.x,
					y: 950, 
					width: graphDataWindow.width,
					height: 150
				};

			var graphOptions2 = {
				clearCanvas: false,
				drawOriginAxes: false,
				drawDataRange: false,
				drawDataGaps: false,
				contiguityThreshold: 10.2* 60,
				
				axesLinesColor: "#66AA66",
				primaryLinesTextColor: '#66AA66',
				primaryLinesColor: '#AAFFAA',
				secondaryLinesColor: '#DDFFDD',
				dataLineColor: "#448844",
				dataPointColor: "#448844",

				getPrimaryLinesTextY: GraphDataPresenter.getLinesText,
				getPrimaryLinesSpacingY: GraphDataPresenter.getLinesSpacing,
				//getSecondaryLinesSpacingY: GraphDataPresenter.getSecondaryLinesSpacing
			};
			GraphDataPresenter.render( canvas, pressureData, graphDataWindow2, graphOptions2 );

			var graphDataWindow3 = {
				x: graphDataWindow.x,
				y: 0, 
				width: graphDataWindow.width,
				height: 100
			};

			var graphOptions3 = {
				clearCanvas: false,
				drawOriginAxes: false,
				drawDataRange: false,
				drawDataGaps: false,
				contiguityThreshold: 10.2* 60,

				axesLinesColor: "#6666AA",
				primaryLinesTextColor: '#6666AA',
				primaryLinesColor: '#AAAAFF',
				secondaryLinesColor: '#DDDDFF',
				dataLineColor: "#444488",
				dataPointColor: "#444488",

				getPrimaryLinesTextY: GraphDataPresenter.getLinesText,
				getPrimaryLinesSpacingY: GraphDataPresenter.getLinesSpacing,
				//getSecondaryLinesSpacingY: GraphDataPresenter.getSecondaryLinesSpacing
			};
			GraphDataPresenter.render( canvas, humidityData, graphDataWindow3, graphOptions3 );
		};	
}
