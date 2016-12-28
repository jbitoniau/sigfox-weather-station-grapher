'use strict';

/*
	GraphDataPresenter
*/
function GraphDataPresenter() 
{	
}

GraphDataPresenter.render = function( canvas, graphData, graphDataWindow, graphOptions )
{
	if ( canvas.width!==canvas.clientWidth )
		canvas.width=canvas.clientWidth;
	if ( canvas.height!==canvas.clientHeight )
		canvas.height = canvas.clientHeight;

	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	var context = canvas.getContext("2d");

	graphOptions = graphOptions || {};
	var colors = graphOptions.colors || {};

	if ( graphOptions.clearCanvas )
	{
		context.fillStyle = colors.clear || "#FFFFFF"; 
		context.fillRect( 0, 0, canvasWidth, canvasHeight );
	}

	// Areas representing graph data and nothingness
	if ( graphOptions.drawDataRange )
	{
		context.fillStyle = colors.dataRange || "#EEEEEE";
		GraphDataPresenter.drawGraphDataRange( context, canvas, graphDataWindow, graphData );
	}

	// Areas representing missing data ranges
	if ( graphOptions.drawDataGaps && graphOptions.contiguityThreshold )
	{
		context.fillStyle = colors.dataGaps || "#FFEEEE"; 
		GraphDataPresenter.drawGraphDataGaps( context, canvas, graphDataWindow, graphData, graphOptions.contiguityThreshold );
	}

	// Secondary grid lines
	var numMaxLinesX = graphOptions.numMaxLinesX || 5;
	var numMaxLinesY = graphOptions.numMaxLinesY || 5;
	if ( graphOptions.getSecondaryLinesSpacingX )
	{
		context.strokeStyle = colors.secondaryLines || "#DDDDDD";
		GraphDataPresenter.drawLinesX( context, canvas, graphDataWindow, graphOptions.getSecondaryLinesSpacingX, null, numMaxLinesX );
	}
	if ( graphOptions.getSecondaryLinesSpacingY )
	{
		context.strokeStyle = colors.secondaryLines || "#DDDDDD";
		GraphDataPresenter.drawLinesY( context, canvas, graphDataWindow, graphOptions.getSecondaryLinesSpacingY, null, numMaxLinesY );
	}
	
	// Primary grid lines
	if ( graphOptions.getPrimaryLinesTextX || graphOptions.getPrimaryLinesTextY )
	{
		var textSize = graphOptions.textSize || 14;
		context.font = textSize + "px sans-serif";
		context.strokeStyle = colors.primaryLines || "#AAAAAA";
		context.fillStyle = colors.primaryLinesText || "#666666";
		if ( graphOptions.getPrimaryLinesSpacingX )
			GraphDataPresenter.drawLinesX( context, canvas, graphDataWindow, graphOptions.getPrimaryLinesSpacingX, graphOptions.getPrimaryLinesTextX, numMaxLinesX );
		if ( graphOptions.getPrimaryLinesSpacingY )
			GraphDataPresenter.drawLinesY( context, canvas, graphDataWindow, graphOptions.getPrimaryLinesSpacingY, graphOptions.getPrimaryLinesTextY, numMaxLinesY );
	}

	// Origin axes
	if ( graphOptions.drawOriginAxes )
	{
		context.strokeStyle = colors.axesLines || "#444444";
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
	}

	// Data 
	context.strokeStyle = colors.dataLine || "#222222";
	context.fillStyle = colors.dataPoint || "#222222";
	GraphDataPresenter.drawGraphData( context, canvas, graphDataWindow, graphData, graphOptions.yPropertyName, graphOptions.contiguityThreshold, graphOptions.points );
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

GraphDataPresenter.parseGraphData = function( graphData, contiguityThreshold, onContiguousDataRange, onMissingDataRange, i0, n )
{
	if ( i0===undefined )
		i0 = 0;
	if ( n===undefined )
		n = graphData.length-i0;
	if ( n<=0 )
		return;
	
	var i1 = i0+n-1;
	if ( i1>=graphData.length )
		i1 = graphData.length-1;

	// Special case with single data point 
	if ( i0===i1 )
	{
		if ( onContiguousDataRange )
			onContiguousDataRange( i0, i1 );
		return;
	}

	var i = i0;
	var i0dataOK = i;
	do
	{
		var x0 = graphData[i].x;
		var x1 = graphData[i+1].x;
		var d = x0-x1;
		if ( d>contiguityThreshold )
		{
			if ( onContiguousDataRange )
				onContiguousDataRange( i0dataOK, i );
			if ( onMissingDataRange )
				onMissingDataRange( i, i+1 );
			i0dataOK = i+1;
		}
		i++;
	}
	while ( i<i1 );

	if ( onContiguousDataRange )
		onContiguousDataRange( i0dataOK, i );
};

GraphDataPresenter.drawGraphDataGaps = function( context, canvas, graphDataWindow, graphData, contiguityThreshold )
{
	if ( !contiguityThreshold )
		return; 

	var r = GraphDataPresenter.getGraphDataVisibleRange( graphDataWindow, graphData );
	if ( r===null )
		return;

	var n = r.i1-r.i0+1;

	var onMissingDataRange = function(i0, i1)	
		{
			for ( var i=i0; i<=i1-1; i++ )
			{
				var x0 = graphData[i].x;
				var x1 = graphData[i+1].x;
				var d = x0-x1;
				if ( d>contiguityThreshold )
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

	GraphDataPresenter.parseGraphData( graphData, contiguityThreshold, null, onMissingDataRange, r.i0, n );
};

GraphDataPresenter.drawGraphData = function( context, canvas, graphDataWindow, graphData, graphDataYPropertyName, contiguityThreshold, pointsOptions  )
{
	if ( !graphDataYPropertyName )
		graphDataYPropertyName = "y";

	// Calculate the size of points based on their estimate number in the current graph data window
	var pointSize = 0;
	pointsOptions = pointsOptions || {};
	var dataPointXSpacing = pointsOptions.typicalDataPointXSpacing || contiguityThreshold;
	if ( dataPointXSpacing )
	{
		var numPoints = Math.trunc( graphDataWindow.width / dataPointXSpacing );
		var maxPointSize = pointsOptions.maxPointSize || 5;
		var maxNumPoints = pointsOptions.maxNumPoints || 300;		// Beyond this number, points won't be displayed
		if ( numPoints<maxNumPoints )
		{	
			pointSize = maxPointSize * ( (maxNumPoints-numPoints) / maxNumPoints);
		}
	}

	// Determine the start and end indices of graph data that are visible in current graph data window
	var r = GraphDataPresenter.getGraphDataVisibleRange( graphDataWindow, graphData );
	if ( r===null )
		return;
	var n = r.i1-r.i0+1;

	var drawData = function(i0, i1)	
		{
			context.beginPath();
			var graphDataPoint = { x:0, y:0 };
			for ( var i=i0; i<=i1; i++ )
			{
				graphDataPoint.x = graphData[i].x;
				graphDataPoint.y = graphData[i][graphDataYPropertyName];

				var windowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( graphDataPoint, graphDataWindow );
				var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( windowPoint, canvas );
				context.lineTo(canvasPoint.x, canvasPoint.y);
			}
			context.stroke();

			if ( pointSize>0 )
			{
				for ( var i=i0; i<=i1; i++ )
				{
					graphDataPoint.x = graphData[i].x;
					graphDataPoint.y = graphData[i][graphDataYPropertyName];
				
					var windowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( graphDataPoint, graphDataWindow );
					var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( windowPoint, canvas );
					context.fillRect(canvasPoint.x-pointSize/2, canvasPoint.y-pointSize/2, pointSize, pointSize);		
				}
			}
		};

	if ( contiguityThreshold )
	{
		GraphDataPresenter.parseGraphData( graphData, contiguityThreshold, drawData, null, r.i0, n );
	}
	else
	{
		drawData( r.i0, r.i1 );
	}
};

GraphDataPresenter.dateAsLocal = false;

GraphDataPresenter.timeSubdivisions = [
	{
		// 1 minute
		spacing: 60*1000, 			
		getText: function(value) { 
			return DateHelper.getFullTimeText( new Date(value), GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// 10 minutes
		spacing: 10*60*1000, 			
		getText: function(value) { 
			return DateHelper.getFullTimeText( new Date(value), GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// 1 hour
		spacing: 60*60*1000, 			
		getText: function(value) { 
			return DateHelper.getFullTimeText( new Date(value), GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// 6 hours
		spacing: 6*60*60*1000, 			
		getText: function(value) { 
			return DateHelper.getFullTimeText( new Date(value), GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// Half a day
		spacing: 12*60*60*1000, 			
		getText: function(value) { 
			return DateHelper.getDayText( new Date(value), true, GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// 1 day
		spacing: 24*60*60*1000, 			
		getText: function(value) { 
			return DateHelper.getDayText( new Date(value), false, GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// 2 days
		spacing: 2*24*60*60*1000, 			
		getText: function(value) { 
			return DateHelper.getDayText( new Date(value), false, GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// 1 week
		spacing: 7*24*60*60*1000, 			
		getText: function(value) { 
			return DateHelper.getWeekText( new Date(value), GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// An average month (taking into account leap years)
		spacing: 365.25/12*24*60*60*1000, 			
		getText: function(value) { 
			value += (365.25/12*24*60*60*1000)/2;			// See getYearText for explanation about this type of gross hack!				 
			return DateHelper.getMonthText( new Date(value), GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// 3 average months
		spacing: 3*365.25/12*24*60*60*1000, 			
		getText: function(value) { 
			return DateHelper.getMonthText( new Date(value), GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// Half an average year
		spacing: 6*365.25/12*24*60*60*1000, 			
		getText: function(value) { 
			return DateHelper.getMonthText( new Date(value), GraphDataPresenter.dateAsLocal );
		}
	},

	{
		// 1 average year
		spacing: 365.25*24*60*60*1000, 			
		getText: function(value) { 
			// We know this method will be used only for 1st of January time values,
			// but these values won't be exactly that because we define a year as an average 
			// number of seconds (which is wrong!). So we cheat to correct this by offsetting 
			// the value by half a year, so we're sure we'll be right in the middle of the proper year!
			value += (365.25*24*60*60*1000)/2;
			var date = new Date(value);
			return DateHelper.getFullYear( date, GraphDataPresenter.dateAsLocal );
		}
	}
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
	// Round the value to the nearest epsilon so a value with floating point inaccuracy doesn't 
	// result in a super long base-10 text representation (for eg: 23.599999999999998)
	var invEpsilon = 1e9;
	var v = Math.round(value * invEpsilon) / invEpsilon;
	return v;
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
};

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

GraphDataPresenter.graphDataPointToCanvasPoint = function( graphDataPoint, graphDataWindow, canvas )
{
	var graphWindowPoint = GraphDataPresenter.graphDataPointToGraphWindowPoint( graphDataPoint, graphDataWindow );
	var canvasPoint = GraphDataPresenter.graphWindowPointToCanvasPoint( graphWindowPoint, canvas );
	return canvasPoint;
};

GraphDataPresenter.canvasPointToGraphDataPoint = function( canvasPoint, canvas, graphDataWindow )
{
	var graphWindowPoint = GraphDataPresenter.canvasPointToGraphWindowPoint( canvasPoint, canvas );
	var graphDataPoint = GraphDataPresenter.graphWindowPointToGraphDataPoint( graphWindowPoint, graphDataWindow );
	return graphDataPoint;
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

/*
	Segment
*/
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

/*Segment.prototype.intersect = function( segment )
{
	return [];
};

Segment.prototype.unite = function( segment )
{
	return [];
};*/