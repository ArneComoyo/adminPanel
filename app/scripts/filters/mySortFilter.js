'use strict';
app.filter('mySortFilter', function() {

	// ** Filter function **/
	return function(input, predicate, reverse) {

		var sortFunction = function(a, b) {

			var pa = a[predicate];
			var pb = b[predicate];

			// if properties are undefined, use that to sort
			var undefA = typeof pa === 'undefined';
			var undefB = typeof pb === 'undefined';

			if (undefA && undefB) {
				return 0;
			} else if (undefA) {
				// always put undefined at the end of the list (regardless of reverse)
				return 1;
			} else if (undefB) {
				// always put undefined at the end of the list (regardless of reverse)
				return -1;

			} else {
				// it not, try to sort by length (number of elements in property)
				var aLen = pa.length;
				var bLen = pb.length;

				var 	diff = aLen - bLen;

				// if equal number of elements, sort by value of first element (i.e. string value of user.name)
				if (diff === 0) {
					try {
						var paVal = (!!pa[0].unixTime) ? pa[0].unixTime : pa[0].value;
						var pbVal = (!!pb[0].unixTime) ? pb[0].unixTime : pb[0].value;

						diff = paVal > pbVal
						? 1
						: -1;
					} catch (err) {
						console.log('Sort error: ', err, 'params: ', a, pa, b, pb);
					}
				}

				return (reverse)
				? -diff
				: diff;
			}
		};

		// Move to array (instead of object)
		var array = [];
		angular.forEach(input, function(object) {
			array.push(object);
		});
		// console.log('Sort: '+array.length+' remaining');

		// Sort array
		return array.sort(sortFunction);
	};
});