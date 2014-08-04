'use strict';
var debug = false;

app.factory('Grouper', function (FIREBASE_URL, $firebase) {
	var url = FIREBASE_URL;
	var ref = new Firebase(url);
	var angularFire = $firebase(ref);
	var grouper = {};

	var deletionQueue = {
		queued: [],
		add: function(func, id) {
			this.queued.push({
				func: func,
				id: id
			});
		},
		hasNext: function() {
			return this.queued.length > 0;
		},
		performNext: function() {
			if (this.hasNext()) {
				var action = this.queued.pop();
				action.func(action.id);
			}
		}
	};


	grouper.deleteNotice = function (noticeId) {
		var notice = ref.child('notice').child(noticeId);
		console.log('deleting notice: '+FIREBASE_URL+'notice/'+noticeId);

		remove('group', noticeId, notice.gid, 'noticeIds');

		// Delete all messages belonging to the notice
		console.log('deleting messages: '+FIREBASE_URL+'notice/'+noticeId);
		if(!debug)
			ref.child('message').child(noticeId).remove();

		if(!debug)
			ref.child('notice').child(noticeId).remove();

		deletionQueue.performNext();
	};

	grouper.deleteEvent = function (eventId) { // all good
		var event = angularFire.$child('event')[eventId];
		console.log('deleting event: ' + event['name']);
		console.log(ref.child(eventId).toString());

		/*
		 *  Remove eventId from owner - send notification
		 */
		remove('user',  eventId, event.oid, 'eoid');		
		/*
		 *  Remove eventId from user - send notification
		 */
		remove('user',  eventId, event.uid, 'eiid');
		/*
		 *  Remove eventId from group - send notification
		 */
		remove('group', eventId, event.gid, 'eid');
		// Remove from rsvp
		var rsvp = $firebase(ref.child('rsvp'));
		console.log(rsvp.$child(eventId));
		if(!debug)
			rsvp.$child(eventId).$remove();

		console.log(event);
		if(!debug)
			ref.child('event').child(eventId).remove();

		deletionQueue.performNext();
	};

	grouper.deleteUser = function (userId) { // does not clean up lastRead in chatroom and from in message. But should it?
		var user = ref.child('user').child(userId);
		// var user = angularFire.$child('user')[userId];
		console.log('deleting user: ' + user.child('name'));
		console.log(ref.child(userId).toString());

		/*
		 *	Remove userId from event owners
		 *  Also delete the event and then notify all members that they where removed from the event,
		 */
		remove('event', userId, user.eoid, 'oid', function (lId) {
			console.log('---Deleting event '+lId);
			grouper.deleteEvent(lId);
			console.log('---End');
		});
		/*
		 *	Remove userId from event invites
		 */
		remove('event', userId, user.eiid, 'uid');
		/*
		 *	Remove userId from group admins
		 *  Also delete the group. And then notify all members that they where removed from the group.
		 */
		remove('group', userId, user.gaid, 'admin', function (lId) {
			console.log('---Deleting group '+lId);
			grouper.deleteGroup(lId);
			console.log('---End');
		});
		/*
		 *	Remove userId from group members
		 */
		remove('group', userId, user.gmid, 'member');
		/*
		 *	Remove userId from chatrooms
		 */
		remove('chatroom', userId, user.rid, 'uid');

		// Remove from msisdn
		try {
			var msisdn = $firebase(ref.child('msisdn'));
			if(!debug)
				msisdn.$child(user.msisdn).$remove();
			console.log('msisdn');
			console.log(msisdn.$child(user.msisdn));
		} catch (err) {
			console.log('Msisdn not found');
		}

		// Remove from rsvp. Only works on second click? Only for the console.log
		var rsvp = $firebase(ref.child('rsvp'));
		angular.forEach(user.eiid, function (value, key_eventId) {
			console.log('eiid');
			angular.forEach(rsvp.$child(key_eventId), function (value, key_userId) {
				console.log('rsvp');
				if(key_userId === userId) {
					console.log('Delete user from rsvp');
					if(!debug)
						rsvp.$child(key_eventId).$child(key_userId).$remove();
				}
			});
		});
		angular.forEach(user.eoid, function (value, key_eventId) {
			console.log('eoid');
			angular.forEach(rsvp.$child(key_eventId), function (value, key_userId) {
				console.log('rsvp');
				if(key_userId === userId) {
					console.log('Delete user from rsvp');
					if(!debug)
						rsvp.$child(key_eventId).$child(key_userId).$remove();
				}
			});
		});

		// Remove the users msisdn in gat
		try {
			console.log(ref.child('gat').child(user.msisdn));
			if(!debug)
				ref.child('gat').child(user.msisdn).remove();
		} catch (err) {
			console.log('Gat not found');
		}


		/*
		 * Slett grupper som har brukeren som admin og slett events som har brukeren som owner.
		 * Disse slettes med sine respektive funksjoner. Ikke slett den faktiske brukeren men sett
		 * den til deactivated
		 */
		/*
		 *	Deactivate the actual user
		 */
		var eraseUsers = true;
		if (eraseUsers) {
			console.log('Erasing user:', FIREBASE_URL+'user/'+userId);
			if (!debug)
				ref.child('user').child(userId).remove();
		} else {
			console.log('	Deactivating user '+user.name);
			if(!debug)
				ref.child('user').child(userId).child('deactivated').set(true);
		}

		deletionQueue.performNext();
	};
	

	/*
	 * Brukere skal ha en notification når de blir slettet fra en gruppe før 
	 * gruppen blir slettet. Spør Tor dobbeltnavn(Fredrik?) om hvordan dette gjøres.
	 */
	grouper.deleteGroup = function (groupId) { // all good
		var group = angularFire.$child('group')[groupId];
		console.log('deleting group: ' + group['name']);
		console.log(ref.child(groupId).toString());

		/*
		 *	Remove groupId from administrators - send notification
		 */
		remove('user', groupId, group.admin, 'gaid');
		/*
		 *	Remove groupId from members - send notification
		 */
		remove('user', groupId, group.member, 'gmid');
		/*
		 *	Remove groupId from events
		 */
		remove('event', groupId, group.eid, 'gid');
		/*
		 *	Remove groupId from chatrooms
		 */
		remove('chatroom', groupId, group.rid, 'gid');
		
		/*
		 *	Remove groupId from notices
		 */
		remove('notice', groupId, group.notice, 'gid');

		// TODO delete notice
		// angular.forEach(group.notiecIds, function(value, key) {
		// 	grouper.deleteNotice(key);
		// });
		for (var key in group.noticeIds) {
			console.log('Queue to delete notice: '+FIREBASE_URL+'notice/'+key);
			// queue deletion
			deletionQueue.add(grouper.deleteNotice, key);
		}


		/*
		 *	Remove the actual group
		 */
		console.log('	Removing group: '+group.name);
		if(!debug)
			ref.child('group').child(groupId).remove();

		deletionQueue.performNext();
	};

	grouper.deleteChatroom = function(formatted) {
		var rid = formatted.id;
		var chatroom = angularFire.$child('chatroom')[rid];
		console.log('deleting chatroom: "'+formatted.name[0].value+'"');

		// delete pointers from users (members) back to this chatroom
		remove('user', rid, chatroom.uid, 'rid');

		// delete pointers from groups back to this chatroom
		remove('group', rid, chatroom.gid, 'rid');

		// delete chatroom messages
		if (!debug)
			ref.child('message').child(rid).remove();

		// delete the room
		if (!debug)
			ref.child('chatroom').child(rid).remove();
		
		deletionQueue.performNext();
	};

	function remove (targetType, objectId, lIds, rIdName) {
		if(typeof lIds !== 'undefined') { // Should delete the whole event
			// console.log(arguments);
			if(typeof arguments[4] !== 'undefined') { // If a callback function is passed as a fifth argument, store it in fun.
				var fun = arguments[4];
			}
			// console.log(lIds);
			angular.forEach(lIds, function (value, key) {
				var target = $firebase(ref.child(targetType).child(key));
				console.log('\t\tRemove backward reference from the '
					+targetType+' '+target.$id+'. \t', target.$child(rIdName).$child(objectId));
				if(!debug)
					target.$child(rIdName).$child(objectId).$remove();
				if(typeof fun !== 'undefined') {
					fun(key);
				}
			});
		}
	}
	
	return grouper;
});