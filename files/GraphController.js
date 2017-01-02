'use strict';

/*
	GraphController
*/
function GraphController( canvas, graphData, graphDataWindow, graphOptions ) 
{	
	this._canvas = canvas;
	this._graphData = graphData;
	this._graphDataWindow = graphDataWindow;
	this._graphOptions = graphOptions;

	this._autoscroll = false;

	this._onKeyDownHandler = this._onKeyDown.bind(this);
	this._onMouseDownHandler = this._onMouseDown.bind(this);
	this._onMouseMoveHandler = this._onMouseMove.bind(this);
	this._onMouseUpHandler = this._onMouseUp.bind(this);
	this._onWheelHandler = this._onWheel.bind(this);
	this._onTouchStartHandler = this._onTouchStart.bind(this);
	this._onTouchMoveHandler = this._onTouchMove.bind(this);
	this._onTouchEndHandler = this._onTouchEnd.bind(this);
	
	this._canvas.addEventListener( 'keydown', this._onKeyDownHandler );
	this._canvas.addEventListener( 'mousedown', this._onMouseDownHandler );
	this._canvas.addEventListener( 'mousemove', this._onMouseMoveHandler );
	this._canvas.addEventListener( 'mouseup', this._onMouseUpHandler );
	this._canvas.addEventListener( 'wheel', this._onWheelHandler );
	this._canvas.addEventListener( 'touchstart', this._onTouchStartHandler );
	this._canvas.addEventListener( 'touchmove', this._onTouchMoveHandler );
	this._canvas.addEventListener( 'touchend', this._onTouchEndHandler );

	this._mousePosition = null;	
	this._touches = [];		// An array of {x, y, id} objects. The order of the touches is chronological as they appear in touch start event

	this._onGraphDataWindowChange = null;	// This gets called whenever user interaction triggers a change to the graph data window
	this._onRendered = null;
}

GraphController.prototype.dispose = function()
{
	this._canvas.removeEventListener( 'keydown', this._onKeyDownHandler );
	this._canvas.removeEventListener( 'mousedown', this._onMouseDownHandler );
	this._canvas.removeEventListener( 'mousemove', this._onMouseMoveHandler );
	this._canvas.removeEventListener( 'mouseup', this._onMouseUpHandler );
	this._canvas.removeEventListener( 'wheel', this._onWheelHandler );
	this._canvas.removeEventListener( 'touchstart', this._onTouchStartHandler );
	this._canvas.removeEventListener( 'touchmove', this._onTouchMoveHandler );
	this._canvas.removeEventListener( 'touchend', this._onTouchEndHandler );
};

GraphController.prototype.render = function()
{
	GraphDataPresenter.render( this._canvas, this._graphData, this._graphDataWindow, this._graphOptions );
	
	if ( this._onRendered )
		this._onRendered();
};

// Update the graph data window to zoom by the given factors on x and y axes while preserving the graph data point
// at the given canvas point to that same canvas position
GraphController.prototype.zoom = function( canvasPoint, zoomFactorX, zoomFactorY )
{
	var graphDataPoint =  GraphDataPresenter.canvasPointToGraphDataPoint( canvasPoint, this._canvas, this._graphDataWindow );
	this._graphDataWindow.width *= zoomFactorX;
	this._graphDataWindow.height *= zoomFactorY;

	var graphDataPoint2 = GraphDataPresenter.canvasPointToGraphDataPoint( canvasPoint, this._canvas, this._graphDataWindow );
	this._graphDataWindow.x -= (graphDataPoint2.x - graphDataPoint.x);
	this._graphDataWindow.y -= (graphDataPoint2.y - graphDataPoint.y);
};

// Update the graph data window so the graph data point at "canvasPointFrom" pans to "canvasPointTo" position
GraphController.prototype.pan = function( canvasPointFrom, canvasPointTo )
{
	var graphPointFrom = GraphDataPresenter.canvasPointToGraphDataPoint( canvasPointFrom, this._canvas, this._graphDataWindow );
	var graphPointTo = GraphDataPresenter.canvasPointToGraphDataPoint( canvasPointTo, this._canvas, this._graphDataWindow );
	var dx = graphPointTo.x - graphPointFrom.x;
	var dy = graphPointTo.y - graphPointFrom.y;
	this._graphDataWindow.x -= dx;
	this._graphDataWindow.y -= dy;
};

// Update the graph data window to pan and zoom based on the movement of two canvas points. 
GraphController.prototype.panAndZoom = function( firstCanvasPointFrom, firstCanvasPointTo, secondCanvasPointFrom, secondCanvasPointTo  )
{
	var ptA0 = GraphDataPresenter.canvasPointToGraphDataPoint( firstCanvasPointFrom, this._canvas, this._graphDataWindow );
	var ptB0 = GraphDataPresenter.canvasPointToGraphDataPoint( secondCanvasPointFrom, this._canvas, this._graphDataWindow );
	
	this.pan( firstCanvasPointFrom, firstCanvasPointTo );

	var ptB1 = GraphDataPresenter.canvasPointToGraphDataPoint( secondCanvasPointTo, this._canvas, this._graphDataWindow );
	
	var m = 30;

	var zx = 1;
	if ( Math.abs(secondCanvasPointTo.x-firstCanvasPointTo.x)>=m )
		zx = (ptB0.x - ptA0.x) / (ptB1.x - ptA0.x);

	var zy = 1;
	if ( Math.abs(secondCanvasPointTo.y-firstCanvasPointTo.y)>=m )
		zy = (ptB0.y - ptA0.y) / (ptB1.y - ptA0.y);

	this.zoom( firstCanvasPointFrom, zx, zy );
};

GraphController.prototype._onKeyDown = function( event )
{
	var prevGraphDataWindow = GraphController._cloneGraphDataWindow( this._graphDataWindow );
	
	var canvasPointFrom = GraphDataPresenter.graphWindowPointToCanvasPoint( {x:0.5, y:0.5}, this._canvas );

	var windowUpdated = false;
	if ( event.keyCode>=37 && event.keyCode<=40 )
	{
		var k = 50;
		var dx = this._canvas.width / k;
		var dy = this._canvas.height / k;

		var canvasPointTo = { x:canvasPointFrom.x, y:canvasPointFrom.y };
		switch ( event.keyCode )
		{
			case 37: 
				canvasPointTo.x += dx;  // left arrow
				break;
			case 39: 
				canvasPointTo.x -= dx;  // right arrow
				break;
			case 38: 
				canvasPointTo.y += dy;  // up arrow
				break;
			case 40: 
				canvasPointTo.y -= dy;  // down arrow
				break;	
		}
		this.pan( canvasPointFrom, canvasPointTo );
		windowUpdated = true;
	}
	else if ( event.keyCode===187 )		// +/= 
	{
		if ( event.shiftKey )
			this.zoom( canvasPointFrom, 1, 0.9 );
		else
			this.zoom( canvasPointFrom, 0.9, 1 );
		windowUpdated = true;
	}
	else if ( event.keyCode===189 )		// -/_
	{
		if ( event.shiftKey )
			this.zoom( canvasPointFrom, 1, 1.1 );
		else
			this.zoom( canvasPointFrom, 1.1, 1 );
		windowUpdated = true;
	}

	if ( windowUpdated )
	{
		if ( this._onGraphDataWindowChange )
			this._onGraphDataWindowChange( prevGraphDataWindow );
		this.render();
	}
};

GraphController.prototype._onMouseDown = function( event )
{
	this._mousePosition = GraphController._getCanvasPointFromMouseEvent( event );
};

GraphController.prototype._onMouseMove = function( event )
{
	if ( !this._mousePosition )
		return;

	var prevGraphDataWindow = GraphController._cloneGraphDataWindow( this._graphDataWindow );
	
	var prevMousePosition = this._mousePosition;
	this._mousePosition = GraphController._getCanvasPointFromMouseEvent( event );

	this.pan( prevMousePosition, this._mousePosition );

	if ( this._onGraphDataWindowChange )
		this._onGraphDataWindowChange( prevGraphDataWindow );
	this.render();
};

GraphController.prototype._onMouseUp = function( event )
{
	this._mousePosition = null;
};

GraphController.prototype._onWheel = function( event )
{
	var prevGraphDataWindow = GraphController._cloneGraphDataWindow( this._graphDataWindow );
	
	var canvasPointFrom = GraphController._getCanvasPointFromMouseEvent( event );
	if ( event.ctrlKey )
	{
		var wheelDelta = 0;
		if ( Math.abs(event.deltaX)>Math.abs(event.deltaY) )
			wheelDelta = event.deltaX;
		else
			wheelDelta = event.deltaY;

		var zoomFactor = 1;
		if ( wheelDelta>0 )
			zoomFactor = 1.001;
		else
			zoomFactor = 0.999;
		
		for ( var i=0; i<Math.abs(wheelDelta); ++i )
		{
			if ( event.shiftKey )
				this.zoom( canvasPointFrom, 1, zoomFactor );
			else
				this.zoom( canvasPointFrom, zoomFactor, 1 );
		}
	}
	else
	{
		var k = 2000;
		var dx = this._canvas.width / k;
		var dy = this._canvas.height / k;
			
		var canvasPointTo = { x:canvasPointFrom.x, y:canvasPointFrom.y };
		canvasPointTo.x -= dx * event.deltaX;
		canvasPointTo.y -= dy * event.deltaY;
		this.pan( canvasPointFrom, canvasPointTo );
	}

	if ( this._onGraphDataWindowChange )
		this._onGraphDataWindowChange( prevGraphDataWindow );
	this.render();
	
	event.preventDefault();
	event.stopPropagation();
};

GraphController._getCanvasPointFromMouseEvent = function( event )
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

GraphController.prototype._onTouchStart = function( event )
{
	var changedTouches = GraphController._getTouchesFromEvent( event );
	for ( var id in changedTouches )
	{
		var index = GraphController._getTouchIndexById( this._touches, id );
		if ( index!==-1 )
			delete this._touches[index];	// If somehow we already had this touch in our array (this means we've missed a touch end), we removed it

		this._touches.push( changedTouches[id] );
	}

	event.preventDefault();		// Preventing default on touch events prevent the "pull to refresh" feature on Chrome Android
};

GraphController.prototype._onTouchMove = function( event )
{
	var prevGraphDataWindow = GraphController._cloneGraphDataWindow( this._graphDataWindow );
	
	// Make a copy of previous touches
	var prevTouches = GraphController._cloneTouches( this._touches );

	// Update current touches
	var changedTouches = GraphController._getTouchesFromEvent( event );
	for ( var id in changedTouches )
	{
		var index = GraphController._getTouchIndexById( this._touches, id );
		if ( index!==-1 )
			this._touches[index] = changedTouches[id];
	}

	if ( this._touches.length===1 )
	{
		this.pan( prevTouches[0], this._touches[0] );
	}
	else if ( this._touches.length===2 )
	{
		this.panAndZoom( prevTouches[0], this._touches[0], prevTouches[1], this._touches[1] );
	}
	
	if ( this._onGraphDataWindowChange )
		this._onGraphDataWindowChange( prevGraphDataWindow );
	this.render();
	
	event.preventDefault();
};

GraphController.prototype._onTouchEnd = function( event )
{
	var changedTouches = GraphController._getTouchesFromEvent( event );
	for ( var id in changedTouches )
	{
		var index = GraphController._getTouchIndexById( this._touches, id );
		if ( index!==-1 )
			this._touches.splice(index, 1);
	}

	event.preventDefault();
};

GraphController._cloneGraphDataWindow = function( graphDataWindow )
{
	var clonedGraphDataWindow = {
		x: graphDataWindow.x,
		y: graphDataWindow.y,
		width: graphDataWindow.width,
		height: graphDataWindow.height
	};
	return clonedGraphDataWindow;
};

GraphController._getTouchesFromEvent = function( event )
{
	var target = event.target || event.srcElement;
	var rect = target.getBoundingClientRect();
	var touches = {};
	for ( var i=0; i<event.changedTouches.length; i++ )
	{
		var touch = event.changedTouches[i];
		var id = touch.identifier;
		var offsetX = touch.clientX - rect.left;
		var offsetY = touch.clientY - rect.top;
		touches[id] = {x:offsetX, y:offsetY, id:id};
	}
	return touches;
};

GraphController._cloneTouches = function( touches )
{
	var clonedTouches = [];
	for ( var i=0; i<touches.length; ++i )
	{
		clonedTouches.push( {
			id: touches[i].id,
			x: touches[i].x,
			y: touches[i].y
		});
	}
	return clonedTouches;
};

GraphController._getTouchIndexById = function( touches, touchId )
{
	for ( var i=0; i<touches.length; ++i )
	{
		if ( touches[i].id.toString()===touchId.toString() )
			return i;
	}
	return -1;
};

