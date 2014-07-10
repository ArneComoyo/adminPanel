app.factory('FirebaseHolder', function ($firebase, FIREBASE_URL) {
	
	/*
	 In minified file, 'return holder;' is the first line!(!?).
	 Not surprisingly, holder is not defined.
	 Renaming holder to something else.
	 */
//	var smthElse = {};
//
//	smthElse.url = FIREBASE_URL;
//	smthElse.ref = new Firebase(smthElse.url);
//	smthElse.angularFire = new $firebase(smthElse.ref);
//
//	return smthElse;

	// Different approach to fix problem
	// return {
	// 	url = FIREBASE_URL,
	// 	ref = new Firebase(url),
	// 	angularFire = new $firebase(ref)
	// };

});