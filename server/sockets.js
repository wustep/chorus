const socketIO = require('socket.io');

// TODO: Add option for additional server commands (like chorus.v0) or 
let generated = false;
let rooms = new Map();
let _data = [];

function log(room, id, msg, force) { // Log if debug set in .env or force parameter is set
	if (process.env.debug === 'true' || force) {
		let roomNum = "";
		if (room != null) roomNum = `[${room}] `; // Exclude room in logs when room is yet to be set
		console.log(`${roomNum}[${id}] ${msg}`);
	}
}

module.exports = { 
	start: (server) => {
		const io = socketIO(server);

		io.on('connect', (socket) => {
			log(null, socket.conn.id, 'Connected');

			socket.on('follow', (room) => {
				let data = rooms.get(room);
				let result = "failed";
				if (data !== undefined) {
					socket.join(room);
					result = "success";
					socket.emit('follow success', _data);
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
					rooms.set(params.room, params.data);
					result = "success";
					socket.emit("cast success");
				} else {
					socket.emit("cast failure");
				}
				log(null, socket.conn.id, "Cast " + params.room + ": " + result);
			});
			
			socket.on('create room', (room) => {
				rooms.set(room, []);
			});
			
			socket.on('get rooms', (room) => {
				// Rooms coming soon
			});

			socket.on('generate data', (data) => {
				_data = data;
				log(data.room, socket.id, "Replaced room data with client copy")
			});
			
			socket.on('get data', () => { // Get data request, only done once per client
				if (genderated) { // Send data to client
					log(data.room, socket.id, "Client data request. Sending data to client.")
					socket.emit('get data', _data); 
				}
			});
			
			socket.on('push to main', (data) => {
				socket.to(socket.room).emit('push to main', data);
				log(data.room, socket.id, "Pushing to main.");
			});

			socket.on('push to all', (data) => {
				socket.to(socket.room).emit('push to all', data);
				log(data.room, socket.id, "Pushing to all.");
			});
			
			// TODO: Re-add custom commands later in a way that makes sense..
		});
	}
}