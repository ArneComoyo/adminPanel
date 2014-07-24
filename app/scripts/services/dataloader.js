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
				if (type === 'message')
					return type+'/'+parentId+'/'+id;
				else
					return type+'/'+id;
			};

			// Inserts object containing a readable value, and a reference to the object (in firebase)
			// Used when an object property contains a list of references to other objects.
			var insertFormattedReference = function(array, index, type, id) {
				var ref = getRef(type, id);
				var url = FIREBASE_URL+ref;
				var primary = Library.primaryPropertyOf(type);

				new Firebase(url).on('value', function(snap) {
					var val = snap.val();

					array[index] = (!val)
						// No object at referenced location. Just display id.
						? { value: id }
						// Found object at referenced locatoin.
						: {
							// Add reference
							ref: ref,
							// Display primary value, if found
							value: (!val[primary])
							? id
							: val[primary]
						};

				});
			};

			// Formats an object (which is a property of a parent object) containing references to other objects.
			// Inserts the formatted references into an array which is provided.
			// Used when an object property contains a list of references to other objects.
			var formatToArray = function(object, array, propertyName) {
				var i = 0;
				var type = Library.typeOf(propertyName);
				angular.forEach(object, function(value, id){
					// Note: value is not used, usually just a dummy value like 'T'
					insertFormattedReference(array, i++, type, id);
				});
			};

			var dateFormat = 'MMM d yyyy, H:mm';
			var formatProperty = function(formatted, key, value) {
				// Look up proper value (may be key rather than value)

				if (typeof value === 'object') {
					// assume value is an object that contains key value pairs, where keys are id's
					formatToArray(value, formatted[key] = [], key);

				} else {
					// assume value is a primitive

					if (typeof value === 'string') {
						formatted[key] = [{value: value}];

						// // TODO merge duplicate code! Similar to formatToArray (except value is string, not object)
						var check = function() {
							var type = Library.typeOf(key);
							if (typeof type !== undefined) {
								// could be possible to reference
								var id = value;
								var ref = getRef(type, id);
								var url = FIREBASE_URL+ref;
								var primary = Library.primaryPropertyOf(type);

								try {
									var fb = new Firebase(url);
									fb.on('value', function(snap) {
										var val = snap.val();

										formatted[key] = (!val)
											// No object at referenced location. Just display id.
											? [{ value: id }]
											// Found object at referenced locatoin.
											: [{
												// Add reference
												ref: ref,
												// Display primary value, if found
												value: (!val[primary])
												? id
												: val[primary]
											}];
									});
								} catch (err) {
									// Url contains illegal characters.
									// value is therefore not a reference.
									// TODO look up in library to keep from attempting to read non-references as reference
								}
							}
						};
						check();


					} else if (typeof value === 'number') {
						if (key === 'when' || key === 'timeStamp' || key === 'lastLogin') {
							formatted[key] = [{
								value: $filter('date')(value, dateFormat), 
								unixTime: value
							}];
						} else {
							formatted[key] = [{
								value: value
							}];
						}

					} else if (typeof value === 'boolean') {
						formatted[key] = [{value: value}];

					} else {
						formatted[key] = [{value: ' [TYPE ERROR] ('+(typeof value)+') : '+value }];

					}

					if (key === Library.primaryPropertyOf(type)) {
						// This property is the primary property (i.e. 'name' for user)
						// put a ref on the object
						formatted[key][0].ref = type+'/'+id;
					}
				}
			};

			// Format and add properties found on the original object
			angular.forEach(original, function(value, key){
				if (data.keys.show.indexOf(key) > -1) {
					formatProperty(formatted, key, value);
				}
			});

			// Add remote properties, e.g. chatroom has messages stored in 'message', not within $chatroom
			var addRemoteProperties = function() {
				var remoteProperties = Library.remoteProperties(type);
				if (!!remoteProperties) {
					for (var i = 0; i < remoteProperties.length; i++) {
						var key = remoteProperties[i];

						if (data.keys.show.indexOf(key) > -1) {
							var remoteType = Library.typeOf(key);

							var ref = new Firebase(FIREBASE_URL+remoteType+'/'+id);
							ref.on('value', function(snap) {
								formatToArray(snap.val(), formatted[key] = [], key);
							});
						}
					}
				}
			} ();

			// Add generted properties, e.g. 'name' of chatroom is the list of members in it.
			var addGeneratedProperties = function () {
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
					if (type === 'message') {
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