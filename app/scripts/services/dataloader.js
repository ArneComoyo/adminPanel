'use strict';
app.factory('DataLoader', function (FIREBASE_URL, Library, $filter) {
	var dataType = '';	// private variable

	var loader = {};	// return object
	var buffer = {};

	// FUNCTIONS
	/* ~constructor~ */
	var createDataStructure = function() {
		return {
			objects: {},

			keys: {
				show: [],
				hide: []
			},
			formattedKeys: {
				show: {},
				hide: {}
			},
		};
	};

	/* Primary function */
	loader.get = function(type, id) {
		if (!buffer[type]) {
			loader.load(type, id);

		} else {
			// Stuff is already loaded
			loader.swap(type, id);
		}
	};

	/* Intendet to be called from primary function */
	loader.swap = function(type, id) {
		console.log('swap');
		var data = createDataStructure();
		loader.data = data;

		data.keys = buffer[type].keys;
		data.formattedKeys = buffer[type].formattedKeys;

		if (!id) {
			data.objects = buffer[type].objects;

		} else {
			data.objects = {};
			data.objects[id] = buffer[type].objects[id];
		}
	};

	/* Intendet to be called from primary function */
	loader.load = function(type, id) {
		console.log('load');
		var refAll = new Firebase(FIREBASE_URL+type);
		var refOne = new Firebase(FIREBASE_URL+type+'/'+id);
		var refShowKeys = new Firebase(Library.urlOfKeys(type)+'/show');
		var refHideKeys = new Firebase(Library.urlOfKeys(type)+'/hide');

		// create new data = loader.data
		var data = createDataStructure();
		loader.data = data;


		// This function contains sub-functions, that can acces the scope of this function 
		// containing values specific to the object that is formatted.
		var formatObject = function(original, formatted, id) {

			var parentId = id;
			var objectType = type;

			// Finds correct firebase reference.
			// Used when an object property is a reference to another object in firebase.
			var getRef = function(type, id) {
				if (Library.isNested(type))
					return type+'/'+parentId+'/'+id;
				else
					return type+'/'+id;
			};

			// Inserts object containing a readable value, and a reference to the object (in firebase)
			// Used when an object property contains a list of references to other objects.
			var insertFormattedReference = function(element, type, id, concatOption, parts) {
				var ref = getRef(type, id);
				var url = FIREBASE_URL+getRef(type, id);
				var primary = Library.primaryPropertyOf(type);

				var setValue = function(value) {
					if (!concatOption) {
						element.value = value;

					} else {
						parts[concatOption] = value;
						var prepend = (typeof parts['prepend'] === undefined) ? '' : parts['prepend'];
						var append = (typeof parts['append'] === undefined) ? '' : parts['append'];
						element.value = prepend+': "'+append+'"';
					}
				};

				new Firebase(url).on('value', function(snap) {
					var val = snap.val();

					if (!val) {
						// No data found at url location

						// Use id as display value
						setValue(id);
					} else {
						// Found data

						// ref ... (concatOption is used for double reference -> don't link to either)
						if (!concatOption) 
							element.ref = ref;

						// ... and value
						var value = 
								(!val[primary])
								? id
								: val[primary];
						setValue(value);
					}
				});
			};
			var formatElement = function(propertyName, key, value, element)  {

				if (Library.hasKeyValuePairs(propertyName)) {
					var keyType = Library.typeOf(propertyName);
					var valType = Library.secondaryTypeOf(propertyName);
					var parts = {};
					insertFormattedReference(element, keyType, key, 'prepend', parts);
					insertFormattedReference(element, valType, value, 'append', parts);

					// Add reference if the key-value is contained in a different structure (e.g. rsvp)
					var refType = Library.remoteTypeOf(propertyName);
					if (typeof refType !== 'undefined') {
						element.ref = getRef(refType, key);
					}
				} else {
					var type = Library.typeOf(propertyName);
					insertFormattedReference(element, type, key);
				}
			};

			// Formats a property of a parent object, containing references to other objects.
			// Inserts the formatted references into an array which is provided.
			// Used when an object property contains a list of references to other objects.
			var formatToArray = function(propertyName, property, array) {
				var index = 0;
				angular.forEach(property, function(value, key){
					var object = { value: '' };
					array[index++] = object;
					formatElement(propertyName, key, value, object);
				});
			};

			var dateFormat = 'MMM d yyyy, H:mm';
			var formatProperty = function(formatted, propertyName, property) {
				if (!property)
					return;
				var object = { value: '' };
				var array = [object];
				formatted[propertyName] = array;

				if (typeof property === 'object') {
					// assume property is an object that contains key value pairs
					formatToArray(propertyName, property, array);

				} else {
					// property is a primitive

					if (typeof property === 'string') {
						if (Library.hasReference(propertyName)) {
							formatElement(propertyName, property, undefined, object);
						} else {
							object.value = property;
						}

					} else if (typeof property === 'number') {
						if (propertyName === 'when' || propertyName === 'timeStamp' || propertyName === 'lastLogin') {
							object.value = $filter('date')(property, dateFormat);
							object.unixTime = property;

						} else {
							object.value = property;
						}

					} else if (typeof property === 'boolean') {
						object.value = property;

					} else {
						object.value = ' [TYPE ERROR] ('+(typeof property)+') : '+property;

					}

					if (propertyName === Library.primaryPropertyOf(type)) {
						// This property is the primary property (i.e. 'name' for user)
						// put a ref on the object
						object.ref = type+'/'+id;
					}
				}
			};
			// var formatElementToArray = function(propertyName, key, value, array, index)  {
			// 	array[index] = { value: ''};

			// 	if (Library.hasKeyValuePairs(propertyName)) {
			// 		var keyType = Library.typeOf(propertyName);
			// 		var valType = Library.secondaryTypeOf(propertyName);
			// 		insertFormattedReference(array[index], keyType, key, 'prepend');
			// 		insertFormattedReference(array[index], valType, value, 'append');

			// 		// Add reference if the key-value is contained in a different structure (e.g. rsvp)
			// 		var refType = Library.remoteTypeOf(propertyName);
			// 		if (typeof refType !== 'undefined') {
			// 			array[index].ref = getRef(refType, key);
			// 		}
			// 	} else {
			// 		var type = Library.typeOf(propertyName);
			// 		insertFormattedReference(array[index], type, key);
			// 	}
			// };

			// // Formats a property of a parent object, containing references to other objects.
			// // Inserts the formatted references into an array which is provided.
			// // Used when an object property contains a list of references to other objects.
			// var formatToArray = function(propertyName, property, array) {
			// 	var index = 0;
			// 	angular.forEach(property, function(value, key){
			// 		formatElementToArray(propertyName, key, value, array, index++);
			// 	});
			// };

			// var dateFormat = 'MMM d yyyy, H:mm';
			// var formatProperty = function(formatted, propertyName, property) {
			// 	if (!property)
			// 		return;
			// 	var object = { value: '' };
			// 	var array = [object];
			// 	formatted[propertyName] = array;

			// 	if (typeof property === 'object') {
			// 		// assume property is an object that contains key value pairs
			// 		formatToArray(propertyName, property, array);

			// 	} else {
			// 		// property is a primitive

			// 		if (typeof property === 'string') {
			// 			if (Library.hasReference(propertyName)) {
			// 				formatElementToArray(propertyName, property, undefined, array, 0);
			// 			} else {
			// 				object.value = property;
			// 			}

			// 		} else if (typeof property === 'number') {
			// 			if (propertyName === 'when' || propertyName === 'timeStamp' || propertyName === 'lastLogin') {
			// 				object.value = $filter('date')(property, dateFormat);
			// 				object.unixTime = property;

			// 			} else {
			// 				object.value = property;
			// 			}

			// 		} else if (typeof property === 'boolean') {
			// 			object.value = property;

			// 		} else {
			// 			object.value = ' [TYPE ERROR] ('+(typeof property)+') : '+property;

			// 		}

			// 		if (propertyName === Library.primaryPropertyOf(type)) {
			// 			// This property is the primary property (i.e. 'name' for user)
			// 			// put a ref on the object
			// 			object.ref = type+'/'+id;
			// 		}
			// 	}
			// };

			// Format and add properties found on the original object
			angular.forEach(original, function(property, propertyName){
				if (data.keys.show.indexOf(propertyName) > -1) {
					formatProperty(formatted, propertyName, property);
				}
			});

			// Add remote properties, e.g. chatroom has messages stored in 'message', not within $chatroom
			var addRemoteProperties = function() {
				var remoteProperties = Library.remoteProperties(type);
				if (!!remoteProperties) {
					for (var i = 0; i < remoteProperties.length; i++) {
						var propertyName = remoteProperties[i];

						if (data.keys.show.indexOf(propertyName) > -1) {
							var remoteType = Library.remoteTypeOf(propertyName);

							var ref = new Firebase(FIREBASE_URL+remoteType+'/'+id);
							ref.on('value', function(snap) {
								var property = snap.val();
								formatProperty(formatted, propertyName, property);
							});
						}
					}
				}
			} ();
			var addGeneratedProperties = function() {
				if (type === 'chatroom') {
					var genProp = 'name';
					if (data.keys.show.indexOf(genProp) > -1) {
						formatted[genProp] = [{
							value: 'Chatroom: ',
							ref: type+'/'+id
						}];
						var hasMembers = false;
						if (!!original.gid) {
							hasMembers = true;
							var url2 = FIREBASE_URL+'group/'+Object.keys(original.gid)[0]+'/name';
							var grref = new Firebase(url2);
							grref.on('value', function(snap) {
								formatted[genProp][0].value += '{'+snap.val()+'}';
							});
						}
						if (!!original.uid) {
							hasMembers = true;
							var keys = Object.keys(original.uid);
							var read = 0;
							for (var i = 0; i < keys.length; i++) {
								var uid = keys[i];
								var memref = new Firebase(FIREBASE_URL+'user/'+uid+'/name');
								memref.on('value', function(snap) {
									var append = (++read < keys.length)
													? ', '
													: '.';
									formatted[genProp][0].value += snap.val()+append;
								});
							}
						}
						if (!hasMembers) {
							formatted[genProp][0].value += 'No members!';
						}
					}
				}
			} ();

		};

		var loadSingleObject = function() {
			refOne.on('value', function(snap) {
				var object = snap.val();
				var formatted = { id: id };
				data.objects[id] = formatted;

				formatObject(object, formatted, id);
			});
		};

		var loadEveryObject = function() {
			// When we load every object, we save them to buffer.
			// We do not want to buffer when loading only one, 
			// because then we will be swapping incorrectly later.
			buffer[type] = data;

			refAll.on('value', function(snap) {
				angular.forEach(snap.val(), function(object, id) {
					var formatted = { id: id };
					data.objects[id] = formatted;

					formatObject(object, formatted, id);
				});
			});
		};

		var loadObjects = function() {
			if (typeof id !== 'undefined') {
				loadSingleObject();

			} else {
				loadEveryObject();
			}
		};

		var getKeysAndLoadObjects = function(snap) {

			var syncAdminPanelProperties = function() {
				console.log('Sync keys from differend firebase');
				// TODO use to 
				var getRef = new Firebase('https://staging-grouper.firebaseio.com/adminPanel/');
				var setRef = new Firebase('https://interns-grouper.firebaseio.com/adminPanel/');
				getRef.on('value', function(snap) {
					var val = snap.val();
					setRef.set(val);
				});
			};

			// Subfunction for generating keys
			// Used when keys are not already generated and stored in firebse
			var generateKeysFromData = function () {
				// WARNING: only enable these 3 lines when syncing between firebases.
				// syncAdminPanelProperties();
				// loadObjects();
				// return;

				console.log('Generate keys from data');
				refAll.on('value', function(snap) {
					data.keys.show = [];
					var all = snap.val();
					if (Library.isNested(type)) {
						// nested structure
						angular.forEach(all, function(room) {
							angular.forEach(room, function(message) {
									angular.forEach(message, function(value, key) {
										if (data.keys.show.indexOf(key) === -1) {
											data.keys.show.push(key);
											data.formattedKeys.show[key] = Library.readableKey(key);
										}
									});
							});
						});

					} else {
						// regular structure
						angular.forEach(all, function(object, key) {
							angular.forEach(object, function(value, key) {
								if (data.keys.show.indexOf(key) === -1) {
									data.keys.show.push(key);
									data.formattedKeys.show[key] = Library.readableKey(key);
								}
							});
						});
					}
					refShowKeys.set(data.keys.show);
					console.log('Keys generated and written to firebase');

					loadObjects();
				});
			};

			var val = snap.val();
			if (!val) {
				// no keys -> generate
				generateKeysFromData();

			} else {
				// keys found, store them
				data.keys.show = val;
				for (var i = 0; i < val.length; i++)  {
					var key = data.keys.show[i];
					data.formattedKeys.show[ key ] = Library.readableKey( key );
				}
			}

			loadObjects();
		};

		refShowKeys.on('value', getKeysAndLoadObjects);
	};

	return loader;
});