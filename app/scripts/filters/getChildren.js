'use strict';

app.filter('getChildren', function() {
	console.log("Getting filter");
  return function(piped) {
  	//if (piped.$child !== undefined) {
  		console.log("2");
             if (piped.$child('uid') !== undefined) {
  			console.log("3a");
	    		return piped.$child('uid');
	    	} else if (piped.$child('gid') !== undefined) {
  			console.log("3b");
	    		return piped.$child('gid');
	    	}
	//} else {
	//	console.log("Undefined");
	//}
  };
});
