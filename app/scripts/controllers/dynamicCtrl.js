'use strict';

/**
 * @ngdoc function
 * @name adminPanel.controller:DynamicCtrl
 * @description
 * # DynamicCtrl
 * Controller of the adminPanel
 */
 app.controller('DynamicCtrl', function ($scope, $routeParams, $firebaseSimpleLogin, $filter, FIREBASE_URL, Library, DataLoader, Grouper) {


 	$scope.types = Library.types;

	// SET DATATYPE
	// Get information from URL
	$scope.dataType = $routeParams.dataType;
	$scope.id = $routeParams.id; // may be undefined
	$scope.childId = $routeParams.childId; // may be undefined
	console.log($scope.childId);

	$scope.firebaseTypeUrl = FIREBASE_URL+$scope.dataType+'/';

	$scope.setData = function() {
		// Get data and bind it to the scope
		DataLoader.get($scope.dataType, $scope.id);
		$scope.data = DataLoader.data;
	};

	$scope.forceReload = function() {
		// Force load data (regardless of buffer) and bind it to the scope
		DataLoader.load($scope.dataType, $scope.id);
		$scope.data = DataLoader.data;
		prepareKeySettings();
	};


	// LOGIN
	$scope.test = function() {
		console.log('Scope.auth', $scope.auth);
	};
	var authResponse = function(error, user) {
		if (error) {
			// an error occurred while attempting login
			console.log('Error logging in: ', error);
			console.log('If you are an admin, you can add yourself to the "admin"-directory: '+FIREBASE_URL+'admin');
			console.log('Create an entry with the key "github:<your github id>". Find your github id here: http://caius.github.io/github_id/');
		} else if (user) {
			// user authenticated with Firebase
			console.log('User UID: ' + user.uid);
			$scope.forceReload();
		} else {
			// user is logged out
			console.log('Not logged in');
			//$window.location.href = '#/login';
			// $scope.$apply(function() { $location.path('/login')});
		}
	};

	// Ref to our firebase
	var ref = new Firebase(FIREBASE_URL);
	// This angularfire object is used to display correctly in HTML and to call login
	$scope.auth = $firebaseSimpleLogin(ref);
	// This line will run authResponse() upon creation and when $scope.auth.$login() is called
	new FirebaseSimpleLogin(ref, authResponse);
	


	// FILTER / SEARCH
	$scope.searchValue;

	// SORTING
	$scope.predicate = '';
	$scope.reverse = false;

	$scope.setSortingPredicate = function(predicate) {
		if ($scope.predicate === predicate) {
			// Same as before
			$scope.reverse = !$scope.reverse;
		} else {
			// New value
			$scope.reverse = false;
			$scope.predicate = predicate;
		}
		$scope.data.objects = $filter('mySortFilter')($scope.data.objects, $scope.predicate, $scope.reverse);
	};


	// SELECTION
	var selectedRows = [];
	$scope.selectedObjects = [];

	$scope.toggleSelectedRow = function (rowNo, objectId) {
		var index = selectedRows.indexOf(rowNo);

		if (index === -1) {
			// Select
			selectedRows.push(rowNo);
			$scope.selectedObjects.push({
				id: objectId,
				name: $scope.data.objects[objectId][ Library.primaryPropertyOf($scope.dataType) ][0].value
			});

		} else {
			// Deselect
			selectedRows.splice(index, 1);
			$scope.selectedObjects.splice(index, 1);
		}
	};
	$scope.isSelected = function(rowNo){
		return selectedRows.indexOf(rowNo) !== -1;
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
				default:
				console.log('Could not delete: Type unknown! Wtf? ');
			}
			delete $scope.data.objects[object.id];
			
			selectedRows = [];
			$scope.selectedObjects = [];
		});
	};


	// CHANGING DISPLAYED PROPERTIES
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

	

	// Get keys from firebase
	var prepareKeySettings = function()  {

		var keyRef = new Firebase(Library.urlOfKeys($scope.dataType));

		keyRef.on('value', function(snap) {
			var keys = snap.val();
			$scope.keys = keys;
			$scope.formattedKeys = {};

			if (!keys) {
				console.log('Error: Nothing found at: ', Library.urlOfKeys($scope.dataType));
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
		});

		// Save keys to firebase, called from HTML
		$scope.keysToFirebase = function() {
			keyRef.set($scope.keys);
		};
	};
	prepareKeySettings();


});