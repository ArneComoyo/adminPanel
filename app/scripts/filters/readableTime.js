'use strict';

app.filter('readableTime', function () {
	return function (unixTime) {
		var date = new Date(unixTime);
	    var day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	    var string = day[date.getDay()] + ' ' + date.getDate() + '.' + date.getMonth() + '.' + date.getFullYear() + ' ';

	    if(date.getHours() < 10) string += '0';
	    string += date.getHours() + ':';
	    if(date.getMinutes() < 10) string += '0';
	    string += date.getMinutes();

	    return  string;
	}
});