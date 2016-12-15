'use strict';

function Main()
{
	var canvas = document.getElementById('graphCanvas');
	canvas.focus();

	var graphDataFetcher = new GraphDataFetcher('1D80C', 100);
	var graphData = graphDataFetcher._graphData;

	var graphDataWindow = {
		x: 0,		// 1st of January 1970! 
		y: -5,
		width: 100 * (10*60),
		height: 60
	};

	var graphOptions = {
		getPrimaryLinesTextX: GraphDataPresenter.getLinesTextForTime, 
		getPrimaryLinesSpacingX: GraphDataPresenter.getPrimaryLinesSpacingForTime,
		getSecondaryLinesSpacingX: GraphDataPresenter.getSecondaryLinesSpacingForTime,
		
		getPrimaryLinesTextY: GraphDataPresenter.getLinesText,
		getPrimaryLinesSpacingY: GraphDataPresenter.getLinesSpacing,
		getSecondaryLinesSpacingY: GraphDataPresenter.getSecondaryLinesSpacing,
	};

	var graphController = new GraphController( canvas, graphData, graphDataWindow, graphOptions );
	graphController.update();

	var zoomInButton = document.getElementById('graphZoomInButton');
	zoomInButton.onclick = 
		function( event ) 
		{
			graphController.zoom( 0.8, null, 'x' );
			graphController.update();
		};

	var zoomOutButton = document.getElementById('graphZoomOutButton');
	zoomOutButton.onclick = 
		function( event ) 
		{
			graphController.zoom( 1.2, null, 'x' );
			graphController.update();
		};

	var promise = graphDataFetcher.fetchData()
		.then(
			function()
			{
				// Move graph window to last data point if there's any data at all
				if ( graphData.length>0 )
				{
					graphDataWindow.x = graphData[0].x - 90 *10*60;
				}
				graphController.update();
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
								graphController.update();
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
}
