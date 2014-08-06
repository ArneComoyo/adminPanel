'use strict';
app.filter('mySearchFilter', function() {

	// ** Filter function **/
	return function(input, search) {
		
		// When there is nothing to filter on, return everything
		if (!search)
			return input;


		// This function checks if value contains searchString
		var contains = function(value, searchString) {
			if (typeof value === 'undefined') {
				// console.log('Err, undefined value');
				return false;
			}
			if (typeof value !== 'string') {
				if (typeof value === 'object') {
					// If object, give error
					console.log('Err: value is object! ', value);
					return false;
				} else {
					// Turn into string
					value = ''+value;
				}
			}
			if (value.toLowerCase().indexOf(searchString.toLowerCase()) > -1) {
				return true;
			}
		}


		// ** Define accept-function ** 
		//	(search-string or  -object?)
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
									var value = element.value;
									if (contains(value, search)) {
										return true;
									}
								}
							}
						}
					}
				}
				return false;
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
					var ok = false;
					if (search.hasOwnProperty(key) 
						&& search[key] !== '') {

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
								var value = element.value;
								if (contains(value, search [key])) {
									ok = true;
								}
							}
						}
					}
					if (!ok)
						return false;
				}
				return true;
			};

		} else {
			return input;
		} 
		// ** End define accept-function **
		

		// Return objects in array
		var array = [];
		angular.forEach(input, function(object) {
			if (accept(object)) {
				array.push(object);
			}
		});

		// console.log('Search on '+(typeof search)+' '+search+', '+array.length+' remaining');

		return array;
	};
});