'use strict';

/*
	GraphDataPresenter
*/
function GraphDataPresenter() 
{	
}

GraphDataPresenter.update = function( canvas, graphData, graphDataWindow )
{
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	var context = canvas.getContext("2d");
	
	// Grid lines
	var textSize = 14; 
	context.strokeStyle = "#CCCCCC";
	context.font = textSize + "px sans-serif";
	context.fillStyle="#CCCCCC";
	var c0 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:0, y:0}, graphDataWindow );
	var c1 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:1, y:1}, graphDataWindow );
	
	var dy = c1.y - c0.y;
	var yspacing = Math.pow( 10, Math.floor( Math.log10(dy) ) );   // in graph data unit
	var y0 = Math.floor( c0.y / yspacing ) * yspacing;
	var y1 = Math.floor( c1.y / yspacing ) * yspacing;
	var yToString = graphDataWindow.yToString;
	for ( var y=y0; y<=y1; y+=yspacing )
	{
		context.beginPath();
		var windowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:0, y:y}, graphDataWindow );
		var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( windowPoint, canvas );
		context.lineTo(0, canvasPoint.y);
		context.lineTo(canvasWidth, canvasPoint.y);
		context.stroke();
		var text = y;
		if ( yToString )
			text = yToString(y);
		context.fillText(text, canvasWidth-context.measureText(text).width-5, canvasPoint.y-5);
	}

	var dx = c1.x - c0.x;
	var xspacing = Math.pow( 10, Math.floor( Math.log10(dx) ) );   // in graph data unit
	var x0 = Math.floor( c0.x / xspacing ) * xspacing;
	var x1 = Math.floor( c1.x / xspacing ) * xspacing;
	var xToString = graphDataWindow.xToString;
	for ( var x=x0; x<=x1; x+=xspacing )
	{
		context.beginPath();
		var windowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:x, y:0}, graphDataWindow );
		var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( windowPoint, canvas );
		context.lineTo(canvasPoint.x, 0);
		context.lineTo(canvasPoint.x, canvasHeight);
		context.stroke();
		var text = x;
		if ( xToString )
			text = xToString(x);
		context.fillText(text, canvasPoint.x+5, textSize+2);
	}

	// Axes
	context.strokeStyle="#222222";
	var originwp = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:0, y:0}, graphDataWindow );
	var origincp = GraphDataPresenter.graphWindowPointToCanvasPoint( originwp, canvas );
	if ( originwp.y>=0 && originwp.y<=1 )
	{
		context.beginPath();	
		context.lineTo( 0, origincp.y );			
		context.lineTo( canvasWidth, origincp.y );	
		context.stroke();
	}
	if ( originwp.x>=0 && originwp.x<=1 )
	{
		context.beginPath();	
		context.lineTo( origincp.x, 0 );			
		context.lineTo( origincp.x, canvasHeight );	
		context.stroke();
	}
	
	// Data 
	context.beginPath();
	context.strokeStyle="#666666";
	context.fillStyle="#444444";
	for ( var i=0; i<graphData.length; i++ )
	{
		var windowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( graphData[i], graphDataWindow );
		if ( GraphDataPresenter.isInUnitSquare(windowPoint) )
		{
			var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( windowPoint, canvas );
			context.lineTo(canvasPoint.x, canvasPoint.y);
			context.fillRect(canvasPoint.x-2, canvasPoint.y-2, 4, 4);
		}
	}
	context.stroke();
};

GraphDataPresenter.isInUnitSquare = function( point )
{
	if ( point.x<0 || point.y<0 || point.x>=1 || point.y>=1 )
		return false;
	return true;
};

GraphDataPresenter.graphDataPointToGraphWindowPoint = function( graphDataPoint, graphDataWindow )
{
	var x2 = (graphDataPoint.x - graphDataWindow.x) / graphDataWindow.width;
	var y2 = (graphDataPoint.y - graphDataWindow.y) / graphDataWindow.height;
	return {x:x2, y:y2};
};

GraphDataPresenter.graphWindowPointToCanvasPoint = function( graphWindowPoint, canvas, roundToInteger )
{
	var x2 = graphWindowPoint.x * canvas.width;
	var y2 = (1-graphWindowPoint.y) * canvas.height;
	if ( /*roundToInteger===undefined ||*/ roundToInteger )
	{
		x2 = Math.round(x2);
		y2 = Math.round(y2);
	}
	return {x:x2, y:y2};
};

GraphDataPresenter.canvasPointToGraphWindowPoint = function( canvasPoint, canvas )
{
	var x2 = canvasPoint.x / canvas.width;
	var y2 = (canvas.height-canvasPoint.y) / canvas.height;
	return {x:x2, y:y2};
};

GraphDataPresenter.graphWindowPointToGraphDataPoint = function( graphWindowPoint, graphDataWindow )
{
	var x2 = (graphWindowPoint.x * graphDataWindow.width) + graphDataWindow.x;
	var y2 = (graphWindowPoint.y * graphDataWindow.height) + graphDataWindow.y;
	return {x:x2, y:y2};
};
