'use strict';
app.filter('mySearchFilter', function() {

	// ** Filter function **/
	return function(input, search) {
		
		// When there is nothing to filter on, return everything
		if (!search)
			return input;

		if (typeof search === 'string') {
			// Search all properties for match to the search
			var accept = function(object) {
				for (var key in object) {
					if (object.hasOwnProperty(key) && key !== '$$hashKey') {
						var property = object[key];

						if (key !== 'id') {
							for (var propKey in property) {
								// exclude the id property
								if (property.hasOwnProperty(propKey)) {
									/*
									Example:
									object is a group
									property is members (of the group), e.g. a list of users
									element is a single user
									element.value is the displayed value, here the user name
									*/
									var element = property[propKey];
									var string = element.value;
									if (typeof string === 'undefined') {
										console.log(key, object, propKey, element);
									} else if (typeof string !== 'string') {
										console.log('Err: not a string! ', string, ' in ', element, propKey, property, object);
									}
									else if (string.toLowerCase().indexOf(search.toLowerCase()) > -1) {
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
				for (var key in search) {
					if (search.hasOwnProperty(key) 
						//&& typeof search[key] === 'string'
						&& search[key] !== '') {

						// console.log('Searching on ', key, ' ', search[key]);

						var property = object[key];

						for (var propKey in property) {
							// exclude the id property
							if (property.hasOwnProperty(propKey)) {
								/*
								Example:
								object is a group
								property is members (of the group), e.g. a list of users
								element is a single user
								element.value is the displayed value, here the user name
								*/
								var element = property[propKey];
								var string = element.value;
								if (typeof string === 'undefined') {
									console.log(key, object, propKey, element);
								} else if (typeof string !== 'string') {
									console.log('Err: not a string! ', string, ' in ', element, propKey, property, object);
								}
								else if (string.toLowerCase().indexOf(search[key].toLowerCase()) > -1) {
									return true;
								}
							}
						}
					}
				}
			};
		} else {
			var accept = function(object) {
				return true;
			};
		}
		
		// Return objects in array
		var array = [];
		angular.forEach(input, function(object) {
			if (accept(object)) {
				array.push(object);
			}
		});

		// console.log('Order: '+array.length+' remaining');

		return array;
	};
});