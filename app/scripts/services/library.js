app.factory('Library', function (FIREBASE_URL) {

	var library = {};


	// Functions
	library.primaryPropertyOf = function(type) {
		if (type === 'chatroom') {
			return 'topic';
		}
		return 'name'; // TODO correct this shit
	};

	library.typeOf = function(key) {
		var thing = formattables[key];
		if (thing)
			return thing.objectType;
		else
			return undefined;
	};

	var uppercaseFirst = function(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	};

	library.readableKey = function(key) {
		var thing = formattables[key];
		return (!!thing) ? thing.name : uppercaseFirst( key );
	};

	library.urlOfKeys = function(type) {
		return FIREBASE_URL+'adminPanel/settings/dispProperties/'+type;
	}


	
	// Fields
	library.types = [
		'user',
		'group',
		'event',
		'chatroom'
	];

	var formattables = {
		// events
		eid: {
			name: 'Events',
			objectType: 'event'
		},
		eiid: {
			name: 'Event invites',
			objectType: 'event'
		},
		eoid: {
			name: 'Events created',
			objectType: 'event'
		},
		// groups
		gid: {
			name: 'Groups',
			objectType: 'group'
		},
		gmid: {
			name: 'Member of groups',
			objectType: 'group'
		},
		gaid: {
			name: 'Admin of groups',
			objectType: 'group'
		},
		// rooms
		rid: {
			name: 'Chat rooms',
			objectType: 'chatroom'
		},
		// notices
		noticeIds: {
			name: 'Notices',
			objectType: 'notice'
		},
		// members
		member: {
			name: 'Members',
			objectType: 'user'
		},
		uid: {
			name: 'Members',
			objectType: 'user'
		},
		oid: {
			name: 'Owners',
			objectType: 'user'
		},
		aid: {
			name: 'Admins',
			objectType: 'user'
		},
		admin: {
			name: 'Admins',
			objectType: 'user'
		}
	};

	return library;
});