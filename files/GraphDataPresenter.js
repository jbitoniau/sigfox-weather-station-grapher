'use strict';

/*
	GraphDataPresenter
*/
function GraphDataPresenter() 
{	
}

GraphDataPresenter.update = function( canvas, graphData, graphDataWindow, graphOptions )
{
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	var context = canvas.getContext("2d");

	// Primary grid lines
	var textSize = 14; 
	context.strokeStyle = "#AAAAAA";
	context.font = textSize + "px sans-serif";
	context.fillStyle="#888888";
	GraphDataPresenter.drawLinesY( context, canvas, graphDataWindow, GraphDataPresenter.getLinesSpacing, GraphDataPresenter.getLinesText );
	GraphDataPresenter.drawLinesX( context, canvas, graphDataWindow, GraphDataPresenter.getLinesSpacing, GraphDataPresenter.getLinesText );

	// Secondary grid lines
	context.strokeStyle = "#DDDDDD";
	var getLinesSpacing2 = function( value0, value1, numMaxLines )
	{
		var spacing = GraphDataPresenter.getLinesSpacing( value0, value1, numMaxLines );
		spacing /= 2;
		return spacing;
	} 
	GraphDataPresenter.drawLinesY( context, canvas, graphDataWindow, getLinesSpacing2, null);
	GraphDataPresenter.drawLinesX( context, canvas, graphDataWindow, getLinesSpacing2, null);

	// Origin axes
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

/*	

// //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log
// /*var getBaseLog = function(base, value) {		
//     return Math.log(value) / Math.log(base);
// }
// var yspacing2 = Math.pow( 5, Math.floor( getBaseLog(5, dy) ) );   
// var k = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:0, y:c0.y+yspacing}, graphDataWindow );
// var k2 = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:0, y:c0.y+yspacing2}, graphDataWindow );
// var n1 = 1/k.y;
// var n2 = 1/k2.y;
// if ( Math.abs(n2-5) <= Math.abs(n1-5) )
// {
// 	yspacing = yspacing2;
// }
// var yspacingOriginal = yspacing;
// var k = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:0, y:c0.y+yspacing}, graphDataWindow );
// var n = 1/k.y;		// numlines in window
// console.log("n=" + n);
// if ( n<5 )
// {
// 	yspacing = yspacingOriginal /2;
// 	k = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:0, y:c0.y+yspacing}, graphDataWindow );
// 	n = 1/k.y;		// numlines in window

// 	if ( n<5 )
// 	{
// 		yspacing = yspacingOriginal /5;
// 		k = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:0, y:c0.y+yspacing}, graphDataWindow );
// 		n = 1/k.y;		// numlines in window
// 	}
// }


	var steps = [
		60,				// 1 minute
		10*60,			// 10 minutes
		60*60,			// 1 hour
		6*60*60,		// 6 hour
		12*60*60,		// half a day
		24*60*60,		// 1 day
		7*24*60*60,		// 1 week
		(365.25/12)*24*60*60, // An average month, taking into account leap years
		365.25*24*60*60 // An average month, taking into account leap years 
	];

	var xspacing = 0;
	for ( var i=0; i<steps.length; ++i )
	{
		var step = steps[i];
		var k = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:c0.x+step, y:0}, graphDataWindow );
		var n = 1/k.x;		// numlines in window
		if ( n<=5 )
		{
			xspacing = step;
			break;
		}
	}
	if ( xspacing===0 )
	{
		xspacing = steps[steps.length-1];
	}
*/

// In graph data unit
GraphDataPresenter.getLinesSpacing = function( value0, value1, numMaxLines )	
{
	var delta = value1 - value0;
	var spacing = Math.pow( 10, Math.floor( Math.log10(delta) ) );   
	return spacing;
};

GraphDataPresenter.getLinesText = function( value, spacing )
{
	return value;
};

GraphDataPresenter.drawLinesY = function( context, canvas, graphDataWindow, getLinesYSpacing, getLinesYText )
{
	if ( !getLinesYSpacing )
		return;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	
	var c0 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:0, y:0}, graphDataWindow );
	var c1 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:1, y:1}, graphDataWindow );
	var numMaxLines = 5;

	var yspacing = getLinesYSpacing( c0.y, c1.y, numMaxLines );		// Need to enfore numMaxLines
	var y0 = Math.floor( c0.y / yspacing ) * yspacing;
	var y1 = Math.floor( c1.y / yspacing ) * yspacing;
	for ( var y=y0; y<=y1; y+=yspacing )
	{
		context.beginPath();
		var windowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:0, y:y}, graphDataWindow );
		var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( windowPoint, canvas );
		context.lineTo(0, canvasPoint.y);
		context.lineTo(canvasWidth, canvasPoint.y);
		context.stroke();
		if ( getLinesYText )
		{
			var text = getLinesYText(y, yspacing);
			context.fillText(text, canvasWidth-context.measureText(text).width-5, canvasPoint.y-2);
		}
	}
}

GraphDataPresenter.drawLinesX = function( context, canvas, graphDataWindow, getLinesXSpacing, getLinesXText )
{
	if ( !getLinesXSpacing )
		return;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	
	var c0 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:0, y:0}, graphDataWindow );
	var c1 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:1, y:1}, graphDataWindow );
	var numMaxLines = 5;

	var xspacing = getLinesXSpacing( c0.x, c1.x, numMaxLines );		// Need to enfore numMaxLines
	var x0 = Math.floor( c0.x / xspacing ) * xspacing;
	var x1 = Math.floor( c1.x / xspacing ) * xspacing;
	for ( var x=x0; x<=x1; x+=xspacing )
	{
		context.beginPath();
		var windowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:x, y:0}, graphDataWindow );
		var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( windowPoint, canvas );
		context.lineTo(canvasPoint.x, 0);
		context.lineTo(canvasPoint.x, canvasHeight);
		context.stroke();
		if ( getLinesXText )
		{
			var text = getLinesXText(x);
			context.fillText(text, canvasPoint.x+2, canvasHeight-5);
		}
	}
}

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
