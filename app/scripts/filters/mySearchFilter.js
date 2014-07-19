'use strict';
app.filter('mySearchFilter', function() {

	// ** Filter function **/
	return function(input, search) {

		if (typeof search === 'string') {
			// Search all properties for match to the search
			var accept = function(object) {
				for (var key in object) {
					if (object.hasOwnProperty(key)) {
						var property = object[key];

						if (key !== 'id') {
							// exclude the id property
							for (var propKey in property) {
								if (property.hasOwnProperty(propKey)) {
									/*
									Example:
									object is a group
									property is members, e.g. a list of users
									element is a single user
									element.value is the displayed value, here the user name
									*/
									var string = property[propKey].value;
									if (string.indexOf(search) > -1) {
										return true;
									}
								}
							}
						}
					}
				}
			};

		} else if (typeof search === 'object') {
			// Search specified properties for match
			/*
			Example:
			search = {
				name: 'Arne'.
				age: '26'
			}
			would only accept users named Arne aged 26 years old.
			Any number of properties (larger than 1) may be given.
			*/
			var accept = function(object) {
				// TODO
				return true;
			};
		} else {
			console.log(typeof search, search);
		}

		// Return objects in array
		console.log('searching...');
		var array = [];
		console.log(input);
		angular.forEach(input, function(object) {
			if (accept(object)) {
				array.push(object);
			}
		});
		console.log('...done');


		return array;
	};
});