'use strict';
app.factory('Library', function (FIREBASE_URL) {

	var library = {};


	// Functions
	library.primaryPropertyOf = function(type) {
		if (type === 'chatroom') {
			return 'topic';
		} else if (type === 'message') {
			return 'text';
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

	// Remote means the data is stored in another structure. E.g. chatroom messages are stored in 'messages', not in the chatroom.
	library.remoteProperties = function(type) {
		if (type === 'chatroom') {
			return ['roomMessages'];
		}
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
		'chatroom',
		'notice'
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
		// users
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
		},
		from: {
			name: 'From',
			objectType: 'user'
		},
		lastRead: { // <uid>: <time stamp>
			name: 'Last Read',
			objectType: 'user'
		},
		readReport: { // <uid>: <time stamp>
			name: 'Read report',
			objectType: 'user'
		},
		// messages
		lastMessage: {
			name: 'Last Message',
			objectType: 'message'
		},
		firstMessage: {
			name: 'First Message',
			objectType: 'message'
		},
		roomMessages: {
			name: 'Messages',
			objectType: 'message'
		}
	};

	return library;
});