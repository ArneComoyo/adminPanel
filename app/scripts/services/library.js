'use strict';
app.factory('Library', function (FIREBASE_URL) {

	var library = {};


	// Functions
	library.primaryPropertyOf = function(type) {
		if (type === 'message') {
			return 'text';
		}
		// else if (type === 'importRsvp') {
		// 	return '<uid>+value'; // Apply as if type = 'rsvp'
		// } else if (type === 'chatroom') {
		// 	return '{<gid>}+<eid>,<eid>,...<eid>.'
		// }

		return 'name';
	};

	library.typeOf = function(propertyName) {
		var thing = formattables[propertyName];
		if (thing)
			return thing.objectType;
		else
			return;
	};
	library.secondaryTypeOf = function(propertyName) {
		var thing = formattables[propertyName];
		if (thing && thing.secondaryType)
			return thing.secondaryType;
		else
			return;	
	};
	library.remoteTypeOf = function(propertyName) {
		var thing = formattables[propertyName];
		if (thing && thing.remoteType)
			return thing.remoteType;
		else
			return;
	};

	// Remote means the data is stored in another structure. E.g. chatroom messages are stored in 'messages', not in the chatroom.
	library.remoteProperties = function(type) {
		if (type === 'chatroom' || type === 'notice') {
			return ['importMessages'];
		} else if (type === 'event') {
			return ['importRsvps'];
		}
	};

	library.hasKeyValuePairs = function(propertyName) {
		return (
			   propertyName === 'lastRead'
			|| propertyName === 'readReport'
			|| propertyName === 'importRsvps' // TODO (!?) should be just rsvp
			);
	};
	library.hasReference = function(propertyName) {
		return (
			propertyName === 'lastMessage'
			|| propertyName === 'firstMessage'
			);
	};

	library.isNested = function(type) {
		return (
			type === 'message'
			|| type === 'rsvp'
			);
	};

	// ** Keys (e.g. propertyNames) **
	var uppercaseFirst = function(string) {
		if (typeof string !== 'string' || string === '')
			// Not applicable
			return string;

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
		lastRead: { // <uid>: <mid>
			name: 'Last Read',
			objectType: 'user',
			secondaryType: 'message'
		},
		readReport: { // <uid>: <mid>
			name: 'Read report',
			objectType: 'user',
			secondaryType: 'message'
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
		importMessages: {
			name: 'Messages',
			objectType: 'message',
			remoteType: 'message'
		},
		// rsvps
		importRsvps: {
			name: 'RSVP',
			objectType: 'user',
			remoteType: 'rsvp'
		},
		rsvp: {
			name: 'RSVP',
			objectType: 'user'
		}
	};

	return library;
});