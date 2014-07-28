'use strict';

/**
 * @ngdoc function
 * @name adminPanel.controller:DynamicCtrl
 * @description
 * # DynamicCtrl
 * Controller of the adminPanel
 */
 app.controller('DynamicCtrl', function ($scope, $firebase, $routeParams, $firebaseSimpleLogin, $filter, FIREBASE_URL, Library, DataLoader, Grouper) {

 	var whichFirebase = function() {
		$scope.whichFirebase = $routeParams.whichFirebase;
		if ($scope.whichFirebase !== 'staging'
			&& $scope.whichFirebase !== 'production'
			&& $scope.whichFirebase !== 'interns'
			) {
		      	$scope.whichFirebase = 'INVALID FIREBASE: '+$routeParams.whichFirebase;
		      	console.log($scope.whichFirebase);
		}
 	} ;


	// PROVIDE DATA
	var provideData = function() {
		// Get information from URL
		$scope.firebaseUrl = FIREBASE_URL;
		$scope.dataType = $routeParams.dataType;
		$scope.id = $routeParams.id; // may be undefined
		$scope.childId = $routeParams.childId; // may be undefined
		// Fields used only by HTML
	 	$scope.types = Library.types;
	 	$scope.firebaseTypeUrl = FIREBASE_URL+$scope.dataType+'/';
	 	

		// Helper methods
		var getId = function() {
			if (typeof $scope.id !== 'undefined' 
				&& typeof $scope.childId !== 'undefined') {
				var id = $scope.id+'/'+$scope.childId;
			} else {
				var id = $scope.id;
			}
			return id;
		};

		// var dontLoad = function() {
		// 	if (!!$scope.id) {
		// 		console.log('Single object');
		// 		return false;
		// 	} else if (typeof $scope.requireSearch === 'undefined') {
		// 		console.log('requireSearch is undefined');
		// 		return true;
		// 	} else {
		// 		if ($scope.requireSearch.value === true) {
		// 			console.log('requires search before display ', $scope.requireSearch.value, $scope.requireSearch.value === true);
		// 			return !$scope.filter.searchValue;
		// 		} else {
		// 			console.log('Can load');
		// 			return false;
		// 		}
		// 	}
		// };

		// Setters
		$scope.setData = function() {
			// if (dontLoad())
			// 	return;

			// Get data and bind it to the scope
			DataLoader.get($scope.dataType, getId());
			$scope.data = DataLoader.data;
		};

		$scope.forceReload = function() {
			// if (dontLoad())
			// 	return;

			// Force load data (regardless of buffer) and bind it to the scope
			DataLoader.load($scope.dataType, getId());
			$scope.data = DataLoader.data;
			// provideKeySettings();
		};


	 	// // Require search or not
	 	// var fb = new Firebase(FIREBASE_URL+'adminPanel/settings/requireSearchToShowData');
	 	// fb.on('value', function(snap) {
		 // 	$scope.requireSearch = {
		 // 		value: snap.val(),
		 // 		set: function() {
		 // 			fb.set($scope.requireSearch.value);
		 // 			$scope.setData();
		 // 		}
		 // 	};
		 // 	$scope.setData();
	 	// });
	} ();




	// LOGIN
	var login = function() {
		var authResponse = function(error, user) {
			if (error) {
				// an error occurred while attempting login
				$scope.loggedIn = false;
				console.log('Error logging in: ', error);
				console.log('If you are an admin, you can add yourself to the "admin"-directory: '+FIREBASE_URL+'admin');
				console.log('Create an entry with the key "github:<your github id>". Find your github id here: http://caius.github.io/github_id/');
			} else if (user) {
				// user authenticated with Firebase
				$scope.loggedIn = true;
				$scope.setData();
			} else {
				// user is not logged in
				$scope.loggedIn = false;
				console.log('Not logged in');
			}
		};

		// Ref to our firebase
		var ref = new Firebase(FIREBASE_URL);
		// This angularfire object is used to display correctly in HTML and to call login
		$scope.auth = $firebaseSimpleLogin(ref);
		// This line will run authResponse() upon creation and when $scope.auth.$login() is called
		new FirebaseSimpleLogin(ref, authResponse);
	} ();





	// ** FILTERS **
	$scope.filter = {};
	$scope.html = {};
	// SEARCH
	$scope.html.searchValue;
	$scope.filter.searchValue;
	/* Helper fuction */
	$scope.delayedUpdateHtmlSearchValue = function() {
		setTimeout(function() {
			$scope.$apply($scope.updateHtmlSearchValue);
		}, 200);
	};
	$scope.updateHtmlSearchValue = function() {
		$scope.html.searchValue = typeof $scope.filter.searchValue ==='object' ? '<advanced>' : $scope.filter.searchValue;
	};
	/* Main function */
	$scope.search = function(searchValue) {
		// If object, make a copy
		if (typeof searchValue === 'object') {
			var tmp = searchValue;
			searchValue = {};
			var hasField = false;
			for (var key in tmp) {
				if (tmp.hasOwnProperty(key) && tmp[key] !== '') {
					hasField = true;
					searchValue[key] = tmp[key];
				}
			}
			if (!hasField) {
				searchValue = '';
			}
		}
		// set serach value
		$scope.filter.searchValue = searchValue;
		$scope.updateHtmlSearchValue();
	};
	// SORT
	$scope.filter.predicate = '';
	var defaultOrder = false; // (true -> Descending first)
	$scope.filter.reverse = defaultOrder;
	$scope.setSortingPredicate = function(predicate) {
		if ($scope.filter.predicate === predicate) {
			// Same as before
			$scope.filter.reverse = !$scope.filter.reverse;
		} else {
			// New value
			$scope.filter.reverse = defaultOrder;
			$scope.filter.predicate = predicate;
		}
	};


	// SELECTION
	$scope.selectedObjects = {};
	$scope.toggleSelected = function (objectId) {

		if (!$scope.isSelected(objectId)) {
			// Select
			$scope.selectedObjects[objectId] = DataLoader.data.objects[objectId];
			// console.log('push');
			// console.log($scope.selectedObjects);

		} else {
			// Deselect
			delete $scope.selectedObjects[objectId];
			// console.log('pop');
			// console.log($scope.selectedObjects);
		}
	};
	$scope.isSelected = function(objectId){
		return (typeof $scope.selectedObjects[objectId] === 'object');
	};
	$scope.nofSelectedObjects = function() {
		return Object.keys($scope.selectedObjects).length;
	};


	// DELETING
	$scope.deleteSelected = function () {
		angular.forEach($scope.selectedObjects, function (object) {
			switch($scope.dataType) {
				case 'event':
					Grouper.deleteEvent(object.id);
					break;
				case 'user':
					Grouper.deleteUser(object.id);
					break;
				case 'group':
					Grouper.deleteGroup(object.id);
					break;
				case 'notice':
					Grouper.deleteNotice(object.id);
					break;
				case 'chatroom':
					Grouper.deleteChatroom(object);
					break;
				default:
					console.log('Could not delete: Type unknown!');
			}
			//delete $scope.data.objects[object.id];  // TODO do we need this line?
			
		});
		$scope.selectedObjects = {};
	};


	// CHANGING DISPLAYED PROPERTIES
	var provideKeySettings = function()  {

		// Get keys from firebase
		$scope.firebaseKeySettingsUrl = Library.urlOfKeys($scope.dataType)
		var keyRef = new Firebase($scope.firebaseKeySettingsUrl);


		keyRef.on('value', function(snap) {
			var keys = snap.val();
			$scope.keys = keys;
			$scope.formattedKeys = {};

			if (!keys) {
				console.log('Keys not found at: ', Library.urlOfKeys($scope.dataType));
				return;
			}

			if (!$scope.keys.show) {
				$scope.keys.show = [];
			}
			if (!$scope.keys.hide) {
				$scope.keys.hide = [];
			}

			var all = keys.show.concat(keys.hide);
			for (var i = 0; i < all.length; i++) {
				var key = all[i];
				$scope.formattedKeys[ key ] = Library.readableKey( key );
			}
			
			// After getting from firebase, create relevant functions (that depend on this data)

			// Locally editing displayed keys
			$scope.toggleKey = function(key) {
				var index = $scope.keys.show.indexOf(key);
				if (index > -1) {
					$scope.keys.show.splice(index, 1);
					$scope.keys.hide.push(key);
					return;
				}
				index = $scope.keys.hide.indexOf(key);
				if (index > -1) {
					$scope.keys.hide.splice(index, 1);
					$scope.keys.show.push(key);
				}
			};
			$scope.move = function(key, distance) {
				var types = ['show', 'hide'];

				for (var i = 0; i < types.length; i++) {
					var type = types[i];
					var index = $scope.keys[type].indexOf(key);
					if (index === 0 && distance < 0) {
						return;
					}
					if (index > -1) {
						$scope.keys[type].splice(index, 1);
						$scope.keys[type].splice(index+distance, 0, key);
					}
				}
			};

			// Save keys to firebase, called from HTML. Changes are reflected automatically in the (dispolayed) data.
			$scope.keysToFirebase = function() {
				keyRef.set($scope.keys);
			};

		});
	} ();


});