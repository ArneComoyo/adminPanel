  'use strict';

/**
 * @ngdoc overview
 * @name adminPanelApp
 * @description
 * # adminPanelApp
 *
 * Main module of the application.
 */
 var app = angular.module('adminPanelApp', [
 	'ngAnimate',
 	'ngCookies',
 	'ngResource',
 	'ngRoute',
 	'ngSanitize',
 	'ngTouch',
 	'firebase'
 	]);

 app.config(function ($routeProvider) {

 	$routeProvider
 	.when('/staging', {
 		redirectTo:'/user'
 	})
 	.when('/:dataType/:id/:childId', {
 		templateUrl: 'views/dynamic.html',
 		controller: 'DynamicCtrl'
 	})
 	.when('/:dataType/:id', {
 		templateUrl: 'views/dynamic.html',
 		controller: 'DynamicCtrl'
 	})
 	.when('/:dataType', {
 		templateUrl: 'views/dynamic.html',
 		controller: 'DynamicCtrl'
 	})
 	.otherwise({
 		redirectTo: '/user'
 	});

    //  $routeProvider
    //  .when(':whichFirebase/:dataType/:id/:childId', {
    //     templateUrl: 'views/dynamic.html',
    //     controller: 'DynamicCtrl'
    // })
    //  .when(':whichFirebase/:dataType/:id', {
    //     templateUrl: 'views/dynamic.html',
    //     controller: 'DynamicCtrl'
    // })
    //  .when(':whichFirebase/:dataType', {
    //     templateUrl: 'views/dynamic.html',
    //     controller: 'DynamicCtrl'
    // })
    //  .otherwise({
    //     redirectTo: '/staging/user'
    // });

  });

// app.constant('FIREBASE_URL', 'https://interns-grouper.firebaseio.com/');
// app.constant('FIREBASE_URL', 'https://staging-grouper.firebaseio.com/');
app.constant('FIREBASE_URL', 'https://test-grouper.firebaseio.com/');  // Production, obviously