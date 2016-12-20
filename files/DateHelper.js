'use strict';

function DateHelper()
{
}

DateHelper.getWeekNumber = function(date)
{
	// http://www.epochconverter.com/weeknumbers
	// http://techblog.procurios.nl/k/news/view/33796/14863/calculate-iso-8601-week-and-year-in-javascript.html
	var target  = new Date(date.valueOf());
	var dayNr   = (date.getDay() + 6) % 7;
	target.setDate(target.getDate() - dayNr + 3);
	var firstThursday = target.valueOf();
	target.setMonth(0, 1);
	if (target.getDay() != 4) {
		target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
	}
	var n = 1 + Math.ceil((firstThursday - target) / 604800000);
	return n;
};

DateHelper.getMonthName = function( utcMonthIndex )
{
	var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	return monthNames[utcMonthIndex];
};

DateHelper.getShortMonthName = function( utcMonthIndex )
{
	var shortMonthNames = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];
	return shortMonthNames[utcMonthIndex];
};

DateHelper.getDayOfWeekName = function( utcDayIndex )
{
	var daysOfWeekNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
	return daysOfWeekNames[utcDayIndex];
};

DateHelper.getShortDayOfWeekName = function( utcDayIndex )
{
	var shortDaysOfWeekNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	return shortDaysOfWeekNames[utcDayIndex];
};

// http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
DateHelper.pad = function(n, width, z) 
{
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

// 13:49:05 20/12/2016
DateHelper.getFullTimeText = function(date)		
{
	var hour = DateHelper.pad( date.getUTCHours(), 2 );
	var minute = DateHelper.pad( date.getUTCMinutes(), 2);
	var second = DateHelper.pad( date.getUTCSeconds(), 2);
	var day = DateHelper.pad( date.getUTCDate(), 2);			// UTC date starts at 1
	var month = DateHelper.pad( date.getUTCMonth()+1, 2);		// UTC month starts at 0 for January
	var text = hour + ':' + minute + '.' + second + ' ' + day + '/' + month + '/' +  date.getFullYear();
	return text;
};

// Tuesday 20/12/2016 AM 
DateHelper.getDayText = function(date, showPeriod)		
{
	var dayOfWeekName = DateHelper.getDayOfWeekName( date.getUTCDay() );
	var day = DateHelper.pad( date.getUTCDate(), 2);
	var month = DateHelper.pad( date.getUTCMonth()+1, 2);
	var period = '';		
	if ( date.getUTCHours()<12 )		// https://en.wikipedia.org/wiki/12-hour_clock
		period = 'AM';
	else
		period = 'PM';
	var text = dayOfWeekName + ' ' + day + '/' + month + '/' +  date.getFullYear();
	if ( showPeriod )
		text +=  ' ' + period;
	return text;
};

// Tuesday 20/12/2016 AM 
DateHelper.getDayWithPeriodText = function(date)		
{
	return DateHelper.getDayText(date, true);
};

// Dec. 2016 Week #50
DateHelper.getWeekText = function(date)				
{
	var week = DateHelper.getWeekNumber(date);
	var monthName = DateHelper.getShortMonthName( date.getUTCMonth() );
	var text = monthName + '. ' + date.getFullYear() + ' Week #' + week;
	return text;
};

// December 2016
DateHelper.getMonthText = function(date)				
{
	var monthName = DateHelper.getMonthName( date.getUTCMonth() );
	var text = monthName + ' ' + date.getFullYear();
	return text;
};
