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

	// Secondary grid lines
	context.strokeStyle = "#DDDDDD";
	var getLinesSpacing2 = function( value0, value1, numMaxLines )
	{
		var spacing = GraphDataPresenter.getLinesSpacing( value0, value1, numMaxLines );
		spacing /= 2;
		return spacing;
	} 
	//GraphDataPresenter.drawLinesY( context, canvas, graphDataWindow, getLinesSpacing2, null);
	GraphDataPresenter.drawLinesX( context, canvas, graphDataWindow, GraphDataPresenter.getSecondaryLinesSpacingForTime, null);

	// Primary grid lines
	var textSize = 14; 
	context.strokeStyle = "#AAAAAA";
	context.font = textSize + "px sans-serif";
	context.fillStyle="#888888";
	GraphDataPresenter.drawLinesY( context, canvas, graphDataWindow, GraphDataPresenter.getLinesSpacing, GraphDataPresenter.getLinesText );
	GraphDataPresenter.drawLinesX( context, canvas, graphDataWindow, GraphDataPresenter.getPrimaryLinesSpacingForTime, GraphDataPresenter.getLinesTextForTime );

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

GraphDataPresenter.getPrimaryLinesSpacingForTime = function( value0, value1, numMaxLines )	
{
	var steps = [
		60,						// 1 minute
		10*60,					// 10 minutes
		60*60,					// 1 hour
		6*60*60,				// 6 hour
		12*60*60,				// half a day
		24*60*60,				// 1 day
		7*24*60*60,				// 1 week
		(365.25/12)*24*60*60, 	// An average month, taking into account leap years
		365.25*24*60*60			// An average month, taking into account leap years 
	];

	var delta = value1 - value0;
	var spacing = null;
	for ( var i=0; i<steps.length; ++i )
	{
		spacing = steps[i];
		var numLines = delta/spacing;
		if ( numLines<=numMaxLines )
		{
			break;
		}
	}
	return spacing;
};

GraphDataPresenter.getSecondaryLinesSpacingForTime = function( value0, value1, numMaxLines )	
{
	var spacing = GraphDataPresenter.getPrimaryLinesSpacingForTime( value0, value1, numMaxLines );
	var steps = [
		60,						// 1 minute
		10*60,					// 10 minutes
		60*60,					// 1 hour
		6*60*60,				// 6 hour
		12*60*60,				// half a day
		24*60*60,				// 1 day
		7*24*60*60,				// 1 week
		(365.25/12)*24*60*60, 	// An average month, taking into account leap years
		365.25*24*60*60			// An average month, taking into account leap years 
	];

	var i = steps.indexOf( spacing );
	if ( i===-1 )
		return null;
	if ( i===0 )
		return null;
	return steps[i-1];
};

GraphDataPresenter.getLinesTextForTime = function( value, spacing )
{	
	///  http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
	var pad = function(n, width, z) {
		z = z || '0';
		n = n + '';
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	};

	var fullTimeText = function(value)
		{
			var numMilliseconds = value * 1000;
			var date = new Date(numMilliseconds);
			
			var hour = pad( date.getUTCHours(), 2 );
			var minute = pad( date.getUTCMinutes(), 2);
			var second = pad( date.getUTCSeconds(), 2);

			var day = pad( date.getUTCDate(), 2);			// UTC date starts at 1
			var month = pad( date.getUTCMonth()+1, 2);		// UTC month starts at 0 for January
			var year = pad( date.getFullYear(), 4);

			var text = hour + ':' + minute + '.' + second + ' ' + day + '/' + month + '/' + year;
			return text;
		};

var daysOfWeekNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
		
	var dayText = function(value, showPeriod)
		{
			var numMilliseconds = value * 1000;
			var date = new Date(numMilliseconds);
			
			var dayOfWeek = daysOfWeekNames[date.getUTCDay()];
			var day = pad( date.getUTCDate(), 2);			// UTC date starts at 1
			var month = pad( date.getUTCMonth()+1, 2);		// UTC month starts at 0 for January
			var year = pad( date.getFullYear(), 4);

			var period = '';		
			if ( date.getUTCHours()<12 )		// https://en.wikipedia.org/wiki/12-hour_clock
				period = 'AM';
			else
				period = 'PM';

			var text = dayOfWeek + ' ' + day + '/' + month + '/' + year;
			if ( showPeriod )
			{
				text +=  ' ' + period;
			}
			return text;
		};

	var dayTextWithPeriod =  function(value)
		{
			return dayText(value, true);
		};

var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

	var monthText = function(value)
		{
			var numMilliseconds = value * 1000; //+ (15 * 24 * 3600);		// Move to middle of month be sure to get the right month name (because we use an average duration for months)
			var date = new Date(numMilliseconds);
			var month = monthNames[date.getUTCMonth()];
			var year = pad( date.getFullYear(), 4);
			var text = month + ' ' + year;
			return text;
		};

	var yearText = function(value)
		{
			var numMilliseconds = value * 1000 + (15 * 24 * 3600);		// Move to middle of month be sure to get the right month name (because we use an average duration for months)
			var date = new Date(numMilliseconds);
			var text = pad( date.getFullYear(), 4);
			return text;
		};

// // http://www.epochconverter.com/weeknumbers
//http://techblog.procurios.nl/k/news/view/33796/14863/calculate-iso-8601-week-and-year-in-javascript.html
// Date.prototype.getWeek = function () {
//     var target  = new Date(this.valueOf());
//     var dayNr   = (this.getDay() + 6) % 7;
//     target.setDate(target.getDate() - dayNr + 3);
//     var firstThursday = target.valueOf();
//     target.setMonth(0, 1);
//     if (target.getDay() != 4) {
//         target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
//     }
//     return 1 + Math.ceil((firstThursday - target) / 604800000);
// }

	var spacings = [
		{spacing:60, getText:fullTimeText},						// 1 minute
		{spacing:10*60, getText:fullTimeText},					// 10 minutes
		{spacing:60*60, getText:fullTimeText},					// 1 hour
		{spacing:6*60*60, getText:fullTimeText},				// 6 hour
		{spacing:12*60*60, getText:dayTextWithPeriod},			// half a day
		{spacing:24*60*60, getText:dayText},					// 1 day
		{spacing:7*24*60*60, getText:dayText},					// 1 week
		{spacing:(365.25/12)*24*60*60, getText:monthText}, 		// An average month, taking into account leap years
		{spacing:365.25*24*60*60, getText:yearText}				// An average year, taking into account leap years 
	];

	for ( var i=0; i<spacings.length; ++i )
	{
		if ( spacings[i].spacing===spacing )
		{
			var func = spacings[i].getText;
			var text = func(value);
			return text;
		}
	}
	return null;
};


// In graph data unit
GraphDataPresenter.getLinesSpacing = function( value0, value1, numMaxLines )	
{
	numMaxLines = Math.floor(numMaxLines);
	if ( numMaxLines<=0 )
		return null;

	var delta = value1 - value0;

	var p = Math.floor( Math.log10(delta) );
	var spacing = Math.pow( 10, p );
	var numLines = Math.floor(delta/spacing);

	var subdivs = [1, 2, 5];
	if ( numLines>numMaxLines )
	{
		// There are more lines than maximum allowed, we increase the spacing until we comply with maximum
		while ( true )
		{
			for ( var i=0; i<subdivs.length; i++ )
			{
				spacing = Math.pow( 10, p ) * subdivs[i];
				numLines = Math.floor(delta/spacing);
				if ( numLines<numMaxLines )
				{
					return spacing;
				}
			}
			p++;
		}
	}
	else
	{
		// There are more lines than maximum allowed, but there could there be a smaller spacing bring 
		// us closer to maximum without exceeding it. We try decreasing spacing until getting past the maximum
		while ( true )
		{
			for ( var i=0; i<subdivs.length; i++ )
			{
				var spacingToTest = Math.pow( 10, p ) / subdivs[i];
				numLines = Math.floor(delta/spacingToTest);
				if ( numLines>=numMaxLines )
				{
					return spacing;
				}
				else
				{
					spacing = spacingToTest;
				}
			}
			p--;
		}
	}
	return spacing;
};

GraphDataPresenter.getLinesText = function( value, spacing )
{
	return value;
};

GraphDataPresenter.drawLinesY = function( context, canvas, graphDataWindow, getLinesSpacing, getLinesText )
{
	if ( !getLinesSpacing )
		return;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	
	var c0 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:0, y:0}, graphDataWindow );
	var c1 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:1, y:1}, graphDataWindow );
	var numMaxLines = 5;

	var yspacing = getLinesSpacing( c0.y, c1.y, numMaxLines );		// Need to enfore numMaxLines
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
		if ( getLinesText )
		{
			var text = getLinesText(y, yspacing);
			context.fillText(text, canvasWidth-context.measureText(text).width-5, canvasPoint.y-2);
		}
	}
}

GraphDataPresenter.drawLinesX = function( context, canvas, graphDataWindow, getLinesSpacing, getLinesText )
{
	if ( !getLinesSpacing )
		return;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	
	var c0 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:0, y:0}, graphDataWindow );
	var c1 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:1, y:1}, graphDataWindow );
	var numMaxLines = 5;

	var xspacing = getLinesSpacing( c0.x, c1.x, numMaxLines );		// Need to enfore numMaxLines
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
		if ( getLinesText )
		{
			var text = getLinesText(x, xspacing);
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
