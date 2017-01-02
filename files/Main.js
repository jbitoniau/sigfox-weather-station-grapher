'use strict';

/*
	Main

	Start the grapher using the device specified in the URL and the optional starting date string.
	Here is an example URL for device id '2A88E' using 24th of December 2016 as a starting date:
	www.serverxyz.com/devices/2A88E?date=12/24/2016
*/	
function Main()
{
	var deviceID = window.location.pathname.substr( ('/devices/').length );

	var autoscroll = true;
	var date = null;
	var dateString = getQueryVariable('date');
	if ( dateString )
	{
		var epochTime = Date.parse(dateString);
		if ( !isNaN(epochTime) )
		{
			autoscroll = false;
			date = new Date(epochTime);
		}
		else
		{
			window.location.search=null;
		}
	}
	var canvas = document.getElementById('graphCanvas');
	canvas.focus();
	
	var weatherGrapher = new WeatherGrapher( canvas, deviceID, date, autoscroll );

	var buttons = {
		'temperature' : document.getElementById('temperatureButton'),
		'humidity' : document.getElementById('humidityButton'),
		'pressure' : document.getElementById('pressureButton')
	};

	for ( var graphDataType in buttons )
	{
		var button = buttons[graphDataType];
		button.graphDataType = graphDataType;
		button.onclick = function( event ) 
			{	
				var graphDataType = event.target.graphDataType;
				weatherGrapher.setGraphDataType(graphDataType);
			};
	}

	buttons[weatherGrapher._graphDataType].className = "roundedButtonToggled";

	weatherGrapher._onGraphDataTypeChanged = function( prevGraphDataType, graphDataType )
		{
			var prevButton = buttons[prevGraphDataType];
			prevButton.className = "roundedButton";
			
			var button = buttons[graphDataType];
			button.className = "roundedButtonToggled";
		};


	var autoscrollButton = document.getElementById('autoscrollButton');
	autoscrollButton.onclick = function( event ) 
		{	
			var autoscroll = !weatherGrapher.getAutoscroll();
			weatherGrapher.setAutoscroll(autoscroll);
		};
	weatherGrapher._onAutoscrollChanged = function()
		{
			var autoscroll = weatherGrapher.getAutoscroll();
			if ( autoscroll )
				autoscrollButton.className = "roundedButtonToggled";
			else
				autoscrollButton.className = "roundedButton";
		};
	weatherGrapher._onAutoscrollChanged();


	var fetchIndicator = document.getElementById('fetchIndicator');
	var fetchIndicatorRemove = function()
		{
			fetchIndicator.style.backgroundColor = 'transparent';
			fetchIndicator.className = null;
		};
	var fetchIndicatorRemoveTimeout = null;
	weatherGrapher._onFetch = function( state )
		{
			var color = null;
			switch ( state )
			{
				case 'started': 
					if ( fetchIndicatorRemoveTimeout ){
						clearTimeout(fetchIndicatorRemoveTimeout);
						fetchIndicatorRemoveTimeout = null;
					}
					fetchIndicator.style.backgroundColor = 'grey';
					fetchIndicator.className = 'blink';
					break;
				case 'ok': 
					fetchIndicator.style.backgroundColor = 'green';
					fetchIndicator.className = null;
					fetchIndicatorRemoveTimeout = setTimeout( fetchIndicatorRemove, 1000 );
					break;
				case 'error': 
					fetchIndicator.style.backgroundColor = 'red';
					fetchIndicator.className = null;
					fetchIndicatorRemoveTimeout = setTimeout( fetchIndicatorRemove, 3000 );
					break;
			}
		};
}

// https://davidwalsh.name/query-string-javascript (in comment section)
function getQueryVariable(variable) 
{
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) 
	{
		var pair = vars[i].split("=");
		if(pair[0] == variable)
		{
			return pair[1];
		}
	}
	return(false);
}
