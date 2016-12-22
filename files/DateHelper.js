'use strict';

function DateHelper()
{
}

// Date object stores time information natively as UTC
// It is when we ask it for seconds, hours, etc that we specify whether the result
// should be expressed as UTC or using the system's local time zone
DateHelper.getMilliseconds = function( date, asLocal )	// 0-999
{
	return asLocal ? date.getMilliseconds() : date.getUTCMilliseconds();
};

DateHelper.getSeconds = function( date, asLocal )	// 0-59
{
	return asLocal ? date.getSeconds() : date.getUTCSeconds();
};

DateHelper.getMinutes = function( date, asLocal )	// 0-59
{
	return asLocal ? date.getMinutes() : date.getUTCMinutes();
};

DateHelper.getHours = function( date, asLocal )		// 0-23
{
	return asLocal ? date.getHours() : date.getUTCHours();
};

DateHelper.getDate = function( date, asLocal )		// 1-31		// DAY OF MONTH
{
	return asLocal ? date.getDate() : date.getUTCDate();
};

DateHelper.getDay = function( date, asLocal )		// 0-6		// DAY OF WEEK
{
	return asLocal ? date.getDay() : date.getUTCDay();
};

DateHelper.getMonth = function( date, asLocal )		// 0-11
{
	return asLocal ? date.getMonth() : date.getUTCMonth();
};

DateHelper.getFullYear = function( date, asLocal )
{
	return asLocal ? date.getFullYear() : date.getUTCFullYear();
};

// http://www.epochconverter.com/weeknumbers
// http://techblog.procurios.nl/k/news/view/33796/14863/calculate-iso-8601-week-and-year-in-javascript.html
DateHelper.getWeekNumber = function( date, asLocal )
{
	var target = new Date(date.valueOf());
	var dayNr = (DateHelper.getDay(date, asLocal) + 6) % 7;
	target.setDate(DateHelper.getDate(target, asLocal) - dayNr + 3);
	var firstThursday = target.valueOf();
	target.setMonth(0, 1);
	if (DateHelper.getDay(target, asLocal) != 4) {  
		target.setMonth(0, 1 + ((4 - DateHelper.getDay(target, asLocal)) + 7) % 7);		
	}
	var n = 1 + Math.ceil((firstThursday - target) / 604800000);
	return n;
};

/*
	Date to text functions
*/
DateHelper.getMonthName = function( monthIndex )
{
	var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	return monthNames[monthIndex];
};

DateHelper.getShortMonthName = function( monthIndex )
{
	var shortMonthNames = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];
	return shortMonthNames[monthIndex];
};

DateHelper.getDayOfWeekName = function( dayIndex )	// 0-starting index
{
	var daysOfWeekNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
	return daysOfWeekNames[dayIndex];
};

DateHelper.getShortDayOfWeekName = function( dayIndex )
{
	var shortDaysOfWeekNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	return shortDaysOfWeekNames[dayIndex];
};

// http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
DateHelper.pad = function(n, width, z) 
{
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

DateHelper.getFullTimeText = function(date, asLocal)	// 13:49:05 20/12/2016		
{
	var text = 
		DateHelper.pad( DateHelper.getHours(date, asLocal), 2 ) + ':' + 
		DateHelper.pad( DateHelper.getMinutes(date, asLocal), 2 ) + '.' + 
		DateHelper.pad( DateHelper.getSeconds(date, asLocal), 2 ) + ' ' + 
		DateHelper.pad( DateHelper.getDate(date, asLocal), 2 ) + '/' + 
		DateHelper.pad( DateHelper.getMonth(date, asLocal)+1, 2 ) + '/' + 
		DateHelper.getFullYear(date, asLocal);
	return text;
};

DateHelper.getDayText = function(date, showPeriod, asLocal)		// Tuesday 20/12/2016 AM 
{
	var text = 
		DateHelper.getDayOfWeekName( DateHelper.getDay(date, asLocal) ) + ' ' +
		DateHelper.pad( DateHelper.getDate(date, asLocal), 2 ) + '/' + 
		DateHelper.pad( DateHelper.getMonth(date, asLocal)+1, 2 ) + '/' + 
		DateHelper.getFullYear(date, asLocal);
	
	if ( showPeriod )
	{
		if ( date.getUTCHours()<12 )		// https://en.wikipedia.org/wiki/12-hour_clock
			text += 'AM';
		else
			text += 'PM';
	}
	return text;
};

DateHelper.getWeekText = function(date, asLocal) 	// Dec. 2016 Week #50
{
	var text = 
		DateHelper.getShortMonthName( DateHelper.getMonth(date, asLocal) ) + '. ' + 
		DateHelper.getFullYear(date, asLocal) + ' Week #' + 
		DateHelper.getWeekNumber(date, asLocal);
	return text;
};

DateHelper.getMonthText = function(date, asLocal)	// December 2016				
{
	var text =
		DateHelper.getMonthName( DateHelper.getMonth(date, asLocal) ) + ' ' + 
		DateHelper.getFullYear(date, asLocal); 
	return text;
};
