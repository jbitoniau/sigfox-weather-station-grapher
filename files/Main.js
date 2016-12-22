'use strict';

function Main()
{
	var deviceID = window.location.pathname.substr( ('/devices/').length );

	var canvas = document.getElementById('graphCanvas');
	canvas.focus();

	var startDate = new Date( Date.parse("November 14, 2016, 16:14:00") );

	var tempmon = new Tempmon( canvas, deviceID, startDate );

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
				tempmon.setGraphDataType(graphDataType);
			};
	}

	buttons[tempmon._graphDataType].className = "roundedButtonToggled";

	tempmon._onGraphDataTypeChanged = function( prevGraphDataType, graphDataType )
		{
			var prevButton = buttons[prevGraphDataType];
			prevButton.className = "roundedButton";
			
			var button = buttons[graphDataType];
			button.className = "roundedButtonToggled";
		};
}
