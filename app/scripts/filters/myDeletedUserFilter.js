'use strict';
app.filter('myDeletedUserFilter', function() {

	return function(input, type) {

		if (type !== 'user')
			return input;


		var accept = function(object) {
			/*
			 * Reject if both:
			 *   1) object has a 'deactivated' parameter
			 *   2) deactivated is 'true'
			 */	
			if (!!object.deactivated && object.deactivated[0].value == 'true') {
				return false;
			} else {
				return true;
			}
		};

		var array = [];

		for (var i = 0; i < input.length; i++) {
			if (accept( input[i] )) {
				array.push(input[i]);
			}
		}

		// console.log('Deleted users removed. '+array.length+' remaining');

		return array;
	};
});