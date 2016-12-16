'use strict';


function Segment( x0, x1 )
{
	this.x0 = x0<=x1 ? x0 : x1;
	this.x1 = x0<=x1 ? x1 : x0;

	if ( x1<x0 )
		console.warn( "segment x0 and x1 ordering is wrong");
}

Segment.prototype.clone = function()
{
	return new Segment( this.x0, this.x1 );
};

Segment.prototype.subtract = function( otherSegment )
{
	if ( otherSegment.x1<this.x0 || otherSegment.x0>this.x1 )
	{
		// Other segment is outside of this one, on its left or its right
		return [this.clone()];
	}

	var segments = [];
	if ( otherSegment.x0>this.x0 )
	{
		segments.push( new Segment(this.x0, otherSegment.x0) );
	}

	if ( otherSegment.x1<this.x1 )
	{
		segments.push( new Segment(otherSegment.x1, this.x1) );
	}
	return segments;
};

Segment.prototype.intersect = function( segment )
{
	return [];
};

Segment.prototype.unite = function( segment )
{
	return [];
};

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

	// Areas representing graph data and nothingness
	context.fillStyle = '#EEEEFF';
	GraphDataPresenter.drawGraphDataRange( context, canvas, graphDataWindow, graphData );

	// Areas representing missing data ranges
	context.fillStyle = '#FFEEEE';
	var threshold = 12 * 60;
	GraphDataPresenter.drawGraphDataGaps( context, canvas, graphDataWindow, graphData, threshold );

	// Secondary grid lines
	context.strokeStyle = "#DDDDDD";
	GraphDataPresenter.drawLinesX( context, canvas, graphDataWindow, graphOptions.getSecondaryLinesSpacingX, null, 7 );
	GraphDataPresenter.drawLinesY( context, canvas, graphDataWindow, graphOptions.getSecondaryLinesSpacingY, null, 5 );
	
	// Primary grid lines
	var textSize = 14; 
	context.strokeStyle = "#AAAAAA";
	context.font = textSize + "px sans-serif";
	context.fillStyle="#888888";
	GraphDataPresenter.drawLinesX( context, canvas, graphDataWindow, graphOptions.getPrimaryLinesSpacingX, graphOptions.getPrimaryLinesTextX, 7 );
	GraphDataPresenter.drawLinesY( context, canvas, graphDataWindow, graphOptions.getPrimaryLinesSpacingY, graphOptions.getPrimaryLinesTextY, 5 );
	
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
	context.strokeStyle="#666666";
	context.fillStyle="#444444";
	GraphDataPresenter.drawGraphData( context, canvas, graphDataWindow, graphData );
};

GraphDataPresenter.drawGraphDataRange = function( context, canvas, graphDataWindow, graphData )
{
	if ( graphData.length===0 )
	{
		context.fillRect( 0, 0, canvas.width, canvas.height );
		return;
	}

	// All these x values are in graph data window space
	var dataPointMinX = graphData[graphData.length-1];
	var dataPointMaxX = graphData[0];
	var dataMinX = GraphDataPresenter.graphDataPointToGraphWindowPoint( dataPointMinX, graphDataWindow ).x;			
	var dataMaxX = GraphDataPresenter.graphDataPointToGraphWindowPoint( dataPointMaxX, graphDataWindow ).x;			
	var dataSeg = new Segment(dataMinX, dataMaxX);

	var winSeg = new Segment(0, 1);

	var outerSegs = winSeg.subtract(dataSeg);
	for ( var i=0; i<outerSegs.length; ++i )
	{
		var seg = outerSegs[i];
		var pt0 = GraphDataPresenter.graphWindowPointToCanvasPoint( {x:seg.x0, y:0}, canvas );
		var pt1 = GraphDataPresenter.graphWindowPointToCanvasPoint( {x:seg.x1, y:1}, canvas );
		context.fillRect( pt0.x, pt0.y, pt1.x-pt0.x, pt1.y-pt0.y );
	}
};

// Returns {i0, i1} or null
GraphDataPresenter.getGraphDataVisibleRange = function( graphDataWindow, graphData )
{
	if ( graphData.length===0 )
		return null;

	var xw0 = graphDataWindow.x;
	var xw1 = graphDataWindow.x + graphDataWindow.width;

	var i0 = null;		// Lower bound (i.e. smallest index) of the graph data range to display
	var i = 0;
	while ( i<graphData.length )
	{
		if ( graphData[i].x<xw1 )
		{
			i0 = i;
			break;
		}
		i++;
	}
	if ( i0===null )
		return null;

	var i1 = null;		// Higher bound
	i = graphData.length-1;
	while ( i>=0 )
	{
		if ( graphData[i].x>xw0 )
		{
			i1 = i;
			break;
		}
		i--;
	}
	if ( i1===null )
		return null;

	if ( i0!==0 )
		i0--;
	if ( i1!==graphData.length-1 )
		i1++;

	return {i0:i0, i1:i1};
};

GraphDataPresenter.drawGraphDataGaps = function( context, canvas, graphDataWindow, graphData, threshold )
{
	var r = GraphDataPresenter.getGraphDataVisibleRange( graphDataWindow, graphData );
	if ( r===null )
		return;
	var i0 = r.i0;
	var i1 = r.i1;
	
	for ( var i=i0; i<=i1-1; i++ )
	{
		var x0 = graphData[i].x;
		var x1 = graphData[i+1].x;
		var d = x0-x1;
		if ( d>threshold )
		{
			var wp0 = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:x1, y:0}, graphDataWindow );
			var cp0 = GraphDataPresenter.graphWindowPointToCanvasPoint( {x:wp0.x, y:1}, canvas );
			var wp1 = GraphDataPresenter.graphDataPointToGraphWindowPoint( {x:x0, y:0}, graphDataWindow );
			var cp1 = GraphDataPresenter.graphWindowPointToCanvasPoint( {x:wp1.x, y:0}, canvas );
			
			var w = cp1.x-cp0.x;
			var h = cp1.y-cp0.y;
			context.fillRect(cp0.x, cp0.y, w, h );
		}
	}
};

GraphDataPresenter.drawGraphData = function( context, canvas, graphDataWindow, graphData )
{
	var r = GraphDataPresenter.getGraphDataVisibleRange( graphDataWindow, graphData );
	if ( r===null )
		return;
	var i0 = r.i0;
	var i1 = r.i1;

	context.beginPath();
	for ( var i=i0; i<=i1; i++ )
	{
		var windowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( graphData[i], graphDataWindow );
		var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( windowPoint, canvas );
		context.lineTo(canvasPoint.x, canvasPoint.y);
	}
	context.stroke();

	var pointSize = 0;
	var n = i1-i0+1;
	if ( n<100 )
		pointSize = 4;
	else if ( n<200 )
		pointSize = 2;

	if ( pointSize>0 )
	{
		for ( var i=i0; i<=i1; i++ )
		{
			var windowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( graphData[i], graphDataWindow );
			var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( windowPoint, canvas );
			context.fillRect(canvasPoint.x-pointSize/2, canvasPoint.y-pointSize/2, pointSize, pointSize);		
		}
	}
};

///  http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
GraphDataPresenter.pad = function(n, width, z) 
{
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

GraphDataPresenter.getFullTimeText = function(value)
{
	var pad = GraphDataPresenter.pad;
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

GraphDataPresenter.getDayText = function(value, showPeriod)
{
	var daysOfWeekNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
	var pad = GraphDataPresenter.pad;
	var numMilliseconds = value * 1000;
	var date = new Date(numMilliseconds);
	var dayOfWeek = daysOfWeekNames[date.getUTCDay()];
	var day = pad( date.getUTCDate(), 2);
	var month = pad( date.getUTCMonth()+1, 2);
	var year = pad( date.getFullYear(), 4);
	var period = '';		
	if ( date.getUTCHours()<12 )		// https://en.wikipedia.org/wiki/12-hour_clock
		period = 'AM';
	else
		period = 'PM';
	var text = dayOfWeek + ' ' + day + '/' + month + '/' + year;
	if ( showPeriod )
		text +=  ' ' + period;
	return text;
};

GraphDataPresenter.getDayWithPeriodText = function(value)
{
	return GraphDataPresenter.getDayText(value, true);
};

GraphDataPresenter.getMonthText = function(value)
{
	// See getYearText for this gross hack!
	value += (365.25/12*24*60*60) / 2;						 
	var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	var pad = GraphDataPresenter.pad;
	var numMilliseconds = value * 1000;
	var date = new Date(numMilliseconds);
	var month = monthNames[date.getUTCMonth()];
	var year = pad( date.getFullYear(), 4);
	var text = month + ' ' + year;
	return text;
};

GraphDataPresenter.getYearText = function(value)
{	
	// We know this method will be used only for 1st of January time values,
	// but these values won't be exactly that because we define a year as an average number of seconds (which is wrong!)
	// So we cheat to correct this by offsetting the value by half a year, so we're sure we'll be right in the middle of the proper year!
	value += (365.25*24*60*60) / 2;						 
	var pad = GraphDataPresenter.pad;
	var numMilliseconds = value * 1000;	
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

GraphDataPresenter.timeSubdivisions = [
	{ spacing:60, getText:GraphDataPresenter.getFullTimeText },					// 1 minute
	{ spacing:10*60, getText:GraphDataPresenter.getFullTimeText },				// 10 minutes
	{ spacing:60*60, getText:GraphDataPresenter.getFullTimeText },				// 1 hour
	{ spacing:6*60*60, getText:GraphDataPresenter.getFullTimeText },			// 6 hour
	{ spacing:12*60*60, getText:GraphDataPresenter.getDayWithPeriodText },		// half a day
	{ spacing:24*60*60, getText:GraphDataPresenter.getDayText },				// half a day
	{ spacing:7*24*60*60, getText:GraphDataPresenter.getDayText },				// 1 week
	{ spacing:365.25/12*24*60*60, getText:GraphDataPresenter.getMonthText }, 	// An average month, taking into account leap years
	{ spacing:365.25*24*60*60, getText:GraphDataPresenter.getYearText }			// An average year, taking into account leap years 
];

GraphDataPresenter.getBestTimeSubdivisionIndex = function( valueRange, numMaxLines )	
{
	for ( var i=0; i<GraphDataPresenter.timeSubdivisions.length; ++i )
	{
		var subdiv = GraphDataPresenter.timeSubdivisions[i];
		var numLines = valueRange/subdiv.spacing;
		if ( numLines<=numMaxLines )
		{
			return i;
		}
	}
	return null;
};

GraphDataPresenter.getPrimaryLinesSpacingForTime = function( value0, value1, numMaxLines )	
{
	var valueRange = value1 - value0;
	var subdivIndex = GraphDataPresenter.getBestTimeSubdivisionIndex( valueRange, numMaxLines );
	if ( subdivIndex===null )
		return null;
	var spacing = GraphDataPresenter.timeSubdivisions[subdivIndex].spacing;
	return spacing;
};

GraphDataPresenter.getSecondaryLinesSpacingForTime = function( value0, value1, numMaxLines )	
{
	var valueRange = value1 - value0;
	var subdivIndex = GraphDataPresenter.getBestTimeSubdivisionIndex( valueRange, numMaxLines );
	if ( subdivIndex===null )
		return null;
	
	subdivIndex--;
	if ( subdivIndex<0 )
		return null;

	var spacing = GraphDataPresenter.timeSubdivisions[subdivIndex].spacing;
	return spacing;
};

GraphDataPresenter.getLinesTextForTime = function( value, spacing )
{	
	for ( var i=0; i<GraphDataPresenter.timeSubdivisions.length; ++i )
	{
		var subdiv = GraphDataPresenter.timeSubdivisions[i];
		if ( subdiv.spacing === spacing )
		{
			var getText = subdiv.getText;
			var text = getText( value );
			return text;
		}
	}
	return null;
};

GraphDataPresenter.getBestPowerOfTenSubdivision = function( valueRange, numMaxLines, subdivs )	
{
	numMaxLines = Math.floor(numMaxLines);
	if ( numMaxLines<=0 )
		return null;

	// Find the power of 10 subdivision that produces a number of lines right under the maximum allowed
	var p = Math.floor( Math.log10(valueRange) );
	var spacing = Math.pow( 10, p );
	var numLines = Math.floor(valueRange/spacing);
	while ( numLines<=numMaxLines )
	{
		p--;
		spacing = Math.pow( 10, p );
		numLines = Math.floor(valueRange/spacing);
	}

	while ( numLines>numMaxLines )
	{
		p++;
		spacing = Math.pow( 10, p );
		numLines = Math.floor(valueRange/spacing);
	}

	// Go through the alternative subdivisions of power of 10 and and check whether there's one 
	// that gives a larger number of lines but still without exceeding the maximum
	var subdivIndex  = null;
	for ( var i=0; i<subdivs.length; i++ )
	{
		spacing = Math.pow( 10, p ) * subdivs[i];
		var numLines = Math.floor(valueRange/spacing);
		if ( numLines<=numMaxLines )
		{
			subdivIndex = i;
		}
		else
		{
			break;
		}
	}

	var result = {
		powerOfTen: p,
		subdivIndex: subdivIndex
	};

	return result;
};

GraphDataPresenter.getLinesSpacing = function( value0, value1, numMaxLines )
{
	var valueRange = value1-value0;
	var subdivs = [0.5, 0.2];			// Must be <1 and >0.1 (as dividing by 10 is taken care of above)
	var r = GraphDataPresenter.getBestPowerOfTenSubdivision( valueRange, numMaxLines, subdivs );

	var subDiv = 1;
	if ( r.subdivIndex!==null )
		subDiv = subdivs[r.subdivIndex];
	var spacing = Math.pow( 10, r.powerOfTen ) * subDiv;
	return spacing;
};

GraphDataPresenter.getSecondaryLinesSpacing = function( value0, value1, numMaxLines )
{
	var valueRange = value1-value0;
	var subdivs = [0.5, 0.2];			// Must be <1 and >0.1 (as dividing by 10 is taken care of above)
	var r = GraphDataPresenter.getBestPowerOfTenSubdivision( valueRange, numMaxLines, subdivs );
		
	// This works pretty well as secondary lines are always a nice power of 10
	var p = r.powerOfTen - 1;
	var spacing = Math.pow( 10, p );

	// This is an alternative version, a bit more complicated and not that nice
	/*var p = r.powerOfTen;
	var si = r.subdivIndex;
	if ( si===null )
	{
		si = 0;
	}
	else 
	{
		si++;
		if ( si===subdivs.length ) 
		{
			si = null
			p--;
		}
	}

	var subDiv = 1;
	if ( si!==null )
		subDiv = subdivs[si];
	var spacing = Math.pow( 10, p ) * subDiv;*/

	return spacing;
};

GraphDataPresenter.getLinesText = function( value, spacing )
{
	return value;
};

GraphDataPresenter.drawLinesY = function( context, canvas, graphDataWindow, getLinesSpacing, getLinesText, numMaxLines )
{
	if ( !getLinesSpacing )
		return;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	
	var c0 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:0, y:0}, graphDataWindow );
	var c1 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:1, y:1}, graphDataWindow );

	var yspacing = getLinesSpacing( c0.y, c1.y, numMaxLines );		// Need to enfore numMaxLines
	if ( !yspacing )
		return;

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
			if ( text )
			{
				context.fillText(text, canvasWidth-context.measureText(text).width-5, canvasPoint.y-2);
			}
		}
	}
}

GraphDataPresenter.drawLinesX = function( context, canvas, graphDataWindow, getLinesSpacing, getLinesText, numMaxLines )
{
	if ( !getLinesSpacing )
		return;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	
	var c0 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:0, y:0}, graphDataWindow );
	var c1 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:1, y:1}, graphDataWindow );

	var xspacing = getLinesSpacing( c0.x, c1.x, numMaxLines );		// Need to enfore numMaxLines
	if ( !xspacing )
		return;
	
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
			if ( text )
			{
				context.fillText(text, canvasPoint.x+2, canvasHeight-5);
			}
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
