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


		var insertRealValue = function(array, index, type, id) {
			// CONCIDER meomisation
			// ...
			var url = FIREBASE_URL+type+'/'+id;
			var primary = Library.primaryPropertyOf(type);
			new Firebase(url).on('value', function(snap) {
				var val = snap.val();

				array[index] = (!val)
					? { value: id }
					: {
						ref: type+'/'+id,
						value: (!val[primary])
							? id
							: val[primary]
					  };

				//if (!val) {
				//	console.log('404 - Not found: '+url);
				//}

			});
		};

		var formatToArray = function(object, array, arrayId) {
			var i = 0;
			var type = Library.typeOf(arrayId);
			angular.forEach(object, function(value, id){
				// Note: value is not used, usually just a dummy value like 'T'
				insertRealValue(array, i++, type, id);
			});
		};

		var dateFormat = 'MMM d yyyy, H:mm';
		var formatProperty = function(formatted, key, value) {
			// Look up proper value (may be key rather than value)

			if (typeof value === 'object') {
				// assume value contains key value pairs, where keys are *id's
				formatToArray(value, formatted[key] = [], key);

			} else if (typeof value === 'string') {
				formatted[key] = [{value: value}];

			} else if (typeof value === 'number') {
				if (key === 'when' || key === 'timeStamp')  {
					formatted[key] = [{
						value: $filter('date')(value, dateFormat), 
						unixTime: value
					}];
				}

			} else if (typeof value === 'boolean') {
				formatted[key] = [{value: value}];

			} else {
				formatted[key] = [{value: ' [TYPE ERROR] ('+(typeof value)+') : '+value }];

			}
		};


		var formatObject = function(original, formatted) {
			angular.forEach(original, function(value, key){
				if (data.keys.show.indexOf(key) > -1) {
					formatProperty(formatted, key, value);
				}
			});
		};

		var loadSingleObject = function () {
			refOne.on('value', function(snap) {
				var object = snap.val();
				var formatted = { id: id };
				data.objects[id] = formatted;

				formatObject(object, formatted);
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

					formatObject(object, formatted);
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

		var generateKeysFromData = function () {
			console.log('Generate keys from data');
			refAll.on('value', function(snap) {
				data.keys.show = [];
				var all = snap.val();
				angular.forEach(all, function(object, key) {
					angular.forEach(object, function(value, key) {
						if (data.keys.show.indexOf(key) === -1) {
							data.keys.show.push(key);
							data.formattedKeys.show[key] = Library.readableKey(key);
						}
					});
				});
				refShowKeys.set(data.keys.show);
				refHideKeys.set( ['id'] );
				console.log('Written');

				loadObjects();
			});
		};

		var getKeys = function(snap) {

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

		refShowKeys.on('value', getKeys);
	};

	return loader;
});