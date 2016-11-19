'use strict';

/*
	GraphController
*/
function GraphController( canvas, graphData, graphDataWindow ) 
{	
	this._canvas = canvas;
	this._graphData = graphData;
	this._graphDataWindow = graphDataWindow;

	this._onKeyDownHandler = this._onKeyDown.bind(this);
	this._onMouseDownHandler = this._onMouseDown.bind(this);
	this._onMouseMoveHandler = this._onMouseMove.bind(this);
	this._onMouseUpHandler = this._onMouseUp.bind(this);
	this._onWheelHandler = this._onWheel.bind(this);

	this._canvas.addEventListener( 'keydown', this._onKeyDownHandler );
	this._canvas.addEventListener( 'mousedown', this._onMouseDownHandler );
	this._canvas.addEventListener( 'mousemove', this._onMouseMoveHandler );
	this._canvas.addEventListener( 'mouseup', this._onMouseUpHandler );
	this._canvas.addEventListener( 'wheel', this._onWheelHandler );
	
	this._lastCanvasPoint = null;
}

GraphController.prototype.dispose = function()
{
	this._canvas.removeEventListener( 'keydown', this._onKeyDownHandler );
	this._canvas.removeEventListener( 'mousedown', this._onMouseDownHandler );
	this._canvas.removeEventListener( 'mousemove', this._onMouseMoveHandler );
	this._canvas.removeEventListener( 'mouseup', this._onMouseUpHandler );
	this._canvas.removeEventListener( 'wheel', this._onWheelHandler );
};

GraphController.prototype.update = function()
{
	GraphDataPresenter.update( this._canvas, this._graphData, this._graphDataWindow );
};

GraphController._getCanvasPointFromEvent = function( event )
{
	// The mouse position in the event happening on the canvas is relative to the whole document,
	// not the canvas. The "offset" properties is what we want, but it's not consistantly available 
	// on all browsers, so we calculate it here. See http://www.jacklmoore.com/notes/mouse-position/
	var target = event.target || event.srcElement;
	var rect = target.getBoundingClientRect();
	var offsetX = event.clientX - rect.left;
	var offsetY = event.clientY - rect.top;
	return {x:offsetX, y:offsetY};
};

GraphController.prototype._onKeyDown = function( event )
{
	var c0 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:0, y:0}, this._graphDataWindow );
	var c1 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:1, y:1}, this._graphDataWindow );
	var s = 0.1;
	var dx = (c1.x - c0.x) * s;
	var dy = (c1.y - c0.y) * s;

	if ( event.keyCode===37 )				// left arrow
	{
		this._graphDataWindow.x -= dx;
	}
	else if ( event.keyCode===39 )			// right arrow
	{
		this._graphDataWindow.x += dx;
	}
	else if ( event.keyCode===38 )			// up arrow
	{
		this._graphDataWindow.y += dy;
	}
	else if ( event.keyCode===40 )			// down arrow
	{
		this._graphDataWindow.y -= dy;
	}
	else if ( event.keyCode===187 ||		// +/=
			  event.keyCode===189 )			// -/_
	{
		var zoomFactor = 1;
		var k = 0.1;
		if ( event.keyCode===187 )
		{	
			zoomFactor -= k;
		}
		else if ( event.keyCode===189 )
		{
			zoomFactor += k;
		}

		var graphDataPoint = {x:0.5, y:0.5};
		graphDataPoint = GraphDataPresenter.graphWindowPointToGraphDataPoint( graphDataPoint, this._graphDataWindow );

		this._graphDataWindow.width *= zoomFactor;
		this._graphDataWindow.height *= zoomFactor;

		var graphDataPoint2 = {x:0.5, y:0.5};
		graphDataPoint2 = GraphDataPresenter.graphWindowPointToGraphDataPoint( graphDataPoint2, this._graphDataWindow );

		this._graphDataWindow.x -= (graphDataPoint2.x - graphDataPoint.x);
		this._graphDataWindow.y -= (graphDataPoint2.y - graphDataPoint.y);
	}
	else if ( event.keyCode===189 )			// -/_
	{
		this._graphDataWindow.width *= 1.1;
		this._graphDataWindow.height *= 1.1;
	}

	this.update();
};

GraphController.prototype._onMouseDown = function( event )
{
	this._lastCanvasPoint = GraphController._getCanvasPointFromEvent( event );
};

GraphController.prototype._onMouseMove = function( event )
{
	if ( !this._lastCanvasPoint )
		return;

	var canvasPoint = GraphController._getCanvasPointFromEvent( event );

	var graphDataPoint = GraphDataPresenter.canvasPointToGraphWindowPoint( canvasPoint, this._canvas );
	graphDataPoint = GraphDataPresenter.graphWindowPointToGraphDataPoint( graphDataPoint, this._graphDataWindow );

	var lastGraphDataPoint = GraphDataPresenter.canvasPointToGraphWindowPoint( this._lastCanvasPoint, this._canvas );
	lastGraphDataPoint = GraphDataPresenter.graphWindowPointToGraphDataPoint( lastGraphDataPoint, this._graphDataWindow );

	var deltaX = graphDataPoint.x - lastGraphDataPoint.x;
	var deltaY = graphDataPoint.y - lastGraphDataPoint.y;
	this._graphDataWindow.x -= deltaX;
	this._graphDataWindow.y -= deltaY;

	this._lastCanvasPoint = canvasPoint;

	this.update();
};

GraphController.prototype._onMouseUp = function( event )
{
	this._lastCanvasPoint = null;
};

GraphController.prototype._onWheel = function( event )
{
	if ( event.ctrlKey )
	{
		var wheelDelta = 0;
		if ( Math.abs(event.deltaX)>Math.abs(event.deltaY) )
		{
			wheelDelta = event.deltaX;
		}
		else
		{
			wheelDelta = event.deltaY;
		}

		var canvasPoint = GraphController._getCanvasPointFromEvent( event );
	
		var	graphDataPoint = GraphDataPresenter.canvasPointToGraphWindowPoint( canvasPoint, this._canvas );
		graphDataPoint = GraphDataPresenter.graphWindowPointToGraphDataPoint( graphDataPoint, this._graphDataWindow );
		
		var zoomFactor = 1.0;
		var k = 0.001
		if ( wheelDelta>0 )
		{	
			zoomFactor += k;
		}
		else
		{
			zoomFactor -= k;
		}
		for ( var i=0; i<Math.abs(wheelDelta); ++i )
		{
			this._graphDataWindow.width *= zoomFactor;
			this._graphDataWindow.height *= zoomFactor;
		}

		var graphDataPoint2 = GraphDataPresenter.canvasPointToGraphWindowPoint( canvasPoint, this._canvas );
		graphDataPoint2 = GraphDataPresenter.graphWindowPointToGraphDataPoint( graphDataPoint2, this._graphDataWindow );
		this._graphDataWindow.x -= (graphDataPoint2.x - graphDataPoint.x);
		this._graphDataWindow.y -= (graphDataPoint2.y - graphDataPoint.y);
	}
	else
	{
		var c0 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:0, y:0}, this._graphDataWindow );
		var c1 = GraphDataPresenter.graphWindowPointToGraphDataPoint( {x:1, y:1}, this._graphDataWindow );
		var s = 0.001;					// Decent factor for OSX, might differ for other platform/browser 
		var dx = event.deltaX * (c1.x - c0.x) * s;
		var dy = event.deltaY * (c1.y - c0.y) * s;
		this._graphDataWindow.x += dx;	// Proper sign for OSX, might differ for other platform/browser 
		this._graphDataWindow.y -= dy;
	}

	this.update();
	
	event.preventDefault();
};