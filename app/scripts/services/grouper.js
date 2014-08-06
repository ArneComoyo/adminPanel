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
		var notice = angularFire.$child('notice')[noticeId];
		var noticeRef = ref.child('notice').child(noticeId);

		if (!notice) {
			console.log('Deleting notice: ERROR: Nothing at reference location: '+noticeRef.toString());
			deletionQueue.performNext();
			return;
		}
		console.log('Deleting notice: '+notice['name']+' '+noticeRef.toString());

		remove('group', noticeId, notice.gid, 'noticeIds');

		// Delete all messages belonging to the notice
		var msgRef = ref.child('message').child(noticeId);
		console.log('- deleting messages: '+msgRef.toString());

		if (!debug)
			msgRef.remove();

		if (!debug)
			noticeRef.remove();

		deletionQueue.performNext();
	};

	grouper.deleteEvent = function (eventId) { // all good
		var event = angularFire.$child('event')[eventId];
		var eventRef = ref.child('event').child(eventId);

		if (!event) {
			console.log('Deleting event: ERROR: Nothing at reference location: '+eventRef.toString());
			deletionQueue.performNext();
			return;
		}
		console.log('Deleting event: '+event['name']+' '+eventRef.toString());

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
		if (!debug)
			rsvp.$child(eventId).$remove();

		console.log(event);
		if (!debug)
			eventRef.remove();

		deletionQueue.performNext();
	};

	grouper.deleteUser = function (userId) { // does not clean up lastRead in chatroom and from in message. But should it?
		var user = angularFire.$child('user')[userId];
		var userRef = ref.child('user').child(userId);

		if (!user) {
			console.log('Deleting user: ERROR: Nothing at reference location: '+userRef.toString());
			deletionQueue.performNext();
			return;
		}
		console.log('Deleting user: '+user['name']+' '+userRef.toString());


		// Groups where user is member:
		// 	Remove reference from group back to user
		console.log('gmid');
		remove('group', userId, user.gmid, 'member');

		// Groups where user is admin:
		//	Remove references from group back to user (?)
		//	Then delete the group
		// TODO: Notify members taht the group was deleted
		console.log('gaid');
		remove('group', userId, user.gaid, 'admin', function (gid) {
			console.log('Delete group owned by user: '+FIREBASE_URL+'group/'+gid);
			grouper.deleteGroup(gid);
		});

		// Events user is invited to:
		//	Remove referenced from event back to user
		remove('event', userId, user.eiid, 'uid');

		// Events owned by the user:
		// 	Remove references from event back to user (?)
		// 	Then delete the event
		// TODO: notify all members that the event was deleted
		console.log('eoid');
		remove('event', userId, user.eoid, 'oid', function (eid) {
			console.log('Delete event owned by user: '+FIREBASE_URL+'event/'+eid);
			grouper.deleteEvent(eid);
		});

		// RSVP for event user is invited to:
		//	Remove rsvp entry
		for (var eid in user.eiid) {
			console.log('Removing rsvp: '+FIREBASE_URL+'rsvp/'+eid+'/'+userId);
			if (!debug) {
				try {
					ref.child('rsvp').child(eid).child(userId).remove();
				} catch (err) {
					console.log('No rsvp made for this event.');
				}
			}
		}

		// Chatrooms (NO ACTION):
		//	(DO NOT!) Remove reference from chatroom back to user
		// remove('chatroom', userId, user.rid, 'uid');

		// MSISDN:
		//	Remove entry
		try {
			console.log('Removing msisdn: '+FIREBASE_URL+'msisdn/'+user.msisdn);
			if (!debug)
				ref.child('msisdn').child(user.msisdn).remove();
		} catch (err) {
			console.log('Msisdn not found');
		}

		// GAT
		// 	Remove entry
		try {
			console.log('Remove GAT: '+FIREBASE_URL+'gat/'+user.msisdn);
			if (!debug)
				ref.child('gat').child(user.msisdn).remove();
		} catch (err) {
			console.log('Gat not found');
		}


		// Finally: Delete the user entry
		var eraseUsers = true;
		if (eraseUsers) {
			console.log('Erasing user:'+user.name, userRef.toString());
			if (!debug)
				userRef.remove();
		} else {
			console.log('Deactivating user '+user.name, userRef.toString());
			if (!debug)
				userRef.child('deactivated').set(true);
		}

		deletionQueue.performNext();
	};
	

	/*
	 * Brukere skal ha en notification når de blir slettet fra en gruppe før 
	 * gruppen blir slettet. Spør Tor dobbeltnavn(Fredrik?) om hvordan dette gjøres.
	 */
	grouper.deleteGroup = function (groupId) { // all good
		var group = angularFire.$child('group')[groupId];
		var groupRef = ref.child('group').child(groupId);

		if (!group) {
			console.log('Deleting group: ERROR: Nothing at reference location: '+groupRef.toString());
			deletionQueue.performNext();
			return;
		}
		console.log('Deleting group: '+group['name']+' '+groupRef.toString());

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
		remove('notice', groupId, group.notice, 'gid', function(nid) {
			grouper.deleteNotice(nid);
		});


		/*
		 *	Remove the actual group
		 */
		console.log('	Removing group: '+group.name);
		if (!debug)
			groupRef.remove();

		deletionQueue.performNext();
	};

	grouper.deleteChatroom = function(formatted) {
		var chatroomId = formatted.id;

		var chatroom = angularFire.$child('chatroom')[chatroomId];
		var chatroomRef = ref.child('chatroom').child(chatroomId);

		if (!chatroom) {
			console.log('Deleting chatroom: ERROR: Nothing at reference location: '+chatroomRef.toString());
			deletionQueue.performNext();
			return;
		}
		var name = (!formatted.name) ? '' : formatted.name[0].value;
		console.log('Deleting chatroom: '+name+' '+chatroomRef.toString());

		// delete pointers from users (members) back to this chatroom
		remove('user', chatroomId, chatroom.uid, 'rid');

		// delete pointers from groups back to this chatroom
		remove('group', chatroomId, chatroom.gid, 'rid');

		// delete chatroom messages
		console.log('deleting messages: '+FIREBASE_URL+'message/'+chatroomId);
		if (!debug)
			ref.child('message').child(chatroomId).remove();

		// delete the room
		if (!debug)
			ref.child('chatroom').child(chatroomId).remove();
		
		deletionQueue.performNext();
	};

	function remove (targetType, objectId, lIds, rIdName, callback) {
		if (typeof lIds !== 'undefined') {
			angular.forEach(lIds, function (value, key) {
				var target = $firebase(ref.child(targetType).child(key));

				console.log('\t\tRemove backward reference from the '
					+targetType+' '+target.$id+'. \t', target.$child(rIdName).$child(objectId));

				if (!debug) {
					target.$child(rIdName).$child(objectId).$remove();
				}

				if (typeof callback !== 'undefined') {
					callback(key);
				}
			});
		}
	}
	
	return grouper;
});