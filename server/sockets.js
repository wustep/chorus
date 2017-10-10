const socketIO = require('socket.io');

// TODO: Add option for additional server commands (like chorus.v0) or 
let rooms = new Map();

function log(room, id, msg, force) { // Log if debug set in .env or force parameter is set
	if (process.env.DEBUG === 'true' || force) {
		let roomNum = "";
		if (room !== null && room !== undefined) roomNum = ` [${room}]`; // Exclude room in logs when room is yet to be set
		console.log(`[${id}]${roomNum} ${msg}`);
	}
}

function getRooms() { // Return list of rooms as array
	return Array.from(rooms.keys());
}

module.exports = { 
	start: (server) => {
		const io = socketIO(server);

		io.on('connect', (socket) => {
			log(null, socket.conn.id, 'Connected');
			let roomid = null;

			socket.on('follow', (room) => {
				let data = rooms.get(room);
				let result = "failed";
				if (data !== undefined) {
					socket.join(room);
					result = "success";
					roomid = room;
					socket.emit('follow success', rooms.get(room));
				} else {
					socket.emit('follow failure');
				}
				log(null, socket.conn.id, "Follow " + room + ": " + result);
			});
			
			socket.on('cast', (params) => {
				// TODO: Add failure on params here (i.e. room / data not set)
				// TODO: Change ERR to something else here and at chorus.js
				let result = "failed";
				if (params.room != "ERR" && rooms.get(params.room) === undefined) {
					result = "success";
					socket.join(params.room);
					rooms.set(params.room, params.data);
					roomid = params.room;
					socket.emit("cast success");
				} else {
					socket.emit("cast failure");
				}
				log(null, socket.conn.id, "Cast " + params.room + ": " + result);
			});
			
			socket.on('get rooms', () => { // Unused for now
				log(roomid, socket.id, "Sent rooms to client.");
				socket.emit('get rooms', getRooms());
			});
			
			socket.on('get data', () => { // Get data request, only done once per client
				socket.emit('get data', rooms.get(roomid)); 
				log(roomid, socket.conn.id, "Sent data to client.")
			});
			
			socket.on('push main', (data) => {
				rooms.set(roomid, data); // TODO: Add room checks here.
				socket.to(roomid).emit('push main', data);
				log(roomid, socket.conn.id, "Pushing to main.");
			});

			socket.on('push all', (data) => {
				rooms.set(roomid, data);
				socket.to(roomid).emit('push all', data);
				log(roomid, socket.conn.id, "Pushing to all.");
			});
			
			socket.on('exit', (room) => {
				if (roomid == null) {
					log(null, socket.conn.id, "Error: Attempted exiting room but was not assigned.", true)
				} else {
					log(roomid, socket.conn.id, "Exiting room.");
					roomid = null;
					socket.leave(room);
				}
			});
			
			// TODO: Re-add custom commands later in a way that makes sense..
		});
	}
}