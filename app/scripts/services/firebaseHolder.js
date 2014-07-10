app.factory('FirebaseHolder', function ($firebase, FIREBASE_URL) {
	
	/*
	 In minified file, 'return holder;' is the first line!(!?).
	 Not surprisingly, holder is not defined.
	 Renaming holder to something else.
	 */
	var cannotBeNamedHolderApparently = {};

	cannotBeNamedHolderApparently.url = FIREBASE_URL;
	cannotBeNamedHolderApparently.ref = new Firebase(cannotBeNamedHolderApparently.url);
	cannotBeNamedHolderApparently.angularFire = new $firebase(cannotBeNamedHolderApparently.ref);

	return cannotBeNamedHolderApparently;

});