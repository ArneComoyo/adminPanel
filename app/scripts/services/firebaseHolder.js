app.factory('FirebaseHolder', function ($firebase, FIREBASE_URL) {
	
	holder = {};

	holder.url = FIREBASE_URL;
	holder.ref = new Firebase(holder.url);
	holder.angularFire = new $firebase(holder.ref);

	return holder;

});