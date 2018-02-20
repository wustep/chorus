/* sockets.js
	Chorus server-sided sockets
*/

const socketIO = require('socket.io');

// TODO? Bring back server-sided data generation in custom command files? This isn't necessary in the demos but might be, like in v0

/* Load custom commands
	Any customs loaded should be in the .ENV file, separated by commas, with paths starting from the root
 	e.g. "CUSTOMS=server/demo/midi/midi.js"
*/
let customsLoaded = false;
let commands = {};
if (process.env.customs) {
	const customFiles = process.env.customs.split(",");
	for (let file of customFiles) {
		const custom = require(__dirname + "/../" + file);
		if ("_namespace" in custom) {
			// Any custom set of commands should have a valid namespace provided.
			// TODO: Re-use namespace for room joins / exits as well? As opposed to just including in commands
			if (!commands.hasOwnProperty(custom._namespace)) {
				commands[custom._namespace] = custom;
				console.log(`Successfully added custom command set: ${custom._namespace}`);
				customsLoaded = true;
			} else { // Custom namespace is already used by another set of commands
				console.log(`Error: Custom commands added in configuration have a confict! Namespace "${custom._namespace}" is already in use.`)
			}
		} else {
			console.log(custom);
			console.log('Error: Custom commands added in configuration do not have a valid namespace. See the documentation for more details.')
		}
	}
}

let rooms = new Map(); // Data store with map of rooms

/* log(room, id, msg, force)
	logs message to console if DEBUG is set to true in .env
*/
function log(room, id, msg, force) {
	if (process.env.DEBUG === 'true' || force) {
		let roomNum = "";
		if (room !== null && room !== undefined) roomNum = ` [${room}]`; // Exclude room in logs when room is yet to be set
		console.log(`[${id}]${roomNum} ${msg}`);
	}
}

/* getRooms()
	returns list of rooms as array
*/
function getRooms() { // TODO: not really implemented on the client side yet, not 100% sure it should be?
	return Array.from(rooms.keys());
}

module.exports = {
	start: (server) => {
		const io = socketIO(server);

		io.on('connect', (socket) => {
			log(null, socket.conn.id, 'Connected');
			let roomid = null;

			// Follow event handler
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

			// Cast event handler
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
				log(null, socket.conn.id, "Cast " + params.room + ": " + result); // TODO: Error handling on params.room
			});

			// Get rooms command handler
			socket.on('get rooms', () => { // Unused for now
				log(roomid, socket.id, "Sent rooms to client.");
				socket.emit('get rooms', getRooms());
			});

			// Get data request event handler
			socket.on('get data', () => {
				socket.emit('get data', rooms.get(roomid));
				log(roomid, socket.conn.id, "Sent data to client.")
			});

			// Push to main event handler
			socket.on('push main', (data) => {
				rooms.set(roomid, data); // TODO: Add room checks here.
				socket.to(roomid).emit('push main', data);
				log(roomid, socket.conn.id, "Pushing to main.");
			});

			// Push to all event handler
			socket.on('push all', (data) => {
				rooms.set(roomid, data);
				socket.to(roomid).emit('push all', data);
				log(roomid, socket.conn.id, "Pushing to all.");
			});

			// Exiting room event handler
			socket.on('exit', (room) => {
				if (roomid == null) {
					log(roomid, socket.conn.id, "Error: Attempted exiting room but was not assigned.", true)
				} else {
					log(roomid, socket.conn.id, "Exiting room.");
					roomid = null;
					socket.leave(room);
				}
			});

			// Custom command handler
			socket.on('command', (d) => {
				if (d && typeof d === "object") {
					if (customsLoaded) { // Customs were loaded
						if (roomid != null) { // Is in room
							if ("namespace" in d && d.namespace in commands) {
								const custom = commands[d.namespace]; // Get contents of custom script
								if ("command" in d && d.command in commands[d.namespace]) { // Valid command
									const props = custom[d.command]; // Get specific command function
									if (typeof d.params === "undefined") {
										 d.params = []; // Prevents undefined error.
									}
									commands[d.namespace][d.command](rooms.get(roomid), d.params, function (err, result) {
										if (err) { // if command callsback an error
											log("Error: [Custom] " + err);
											return;
										} else {
											var add = ""; // Additional console info
											if ("_commands" in custom && d.command in custom["_commands"]) { // Valid command in commands list
												let config = custom["_commands"][d.command];
												// TODO: Right now, this format is limited as any consequence of the custom commands (emit / replace) must use the result of the command
												if ("replace" in config) { // Replace data if specified
													rooms.set(roomid, result);
													let informed = "";
													if (config.replace.sender) {
														socket.emit('get data', rooms.get(roomid));
														informed += "Sender";
													}
													if (config.replace.room) {
														socket.to(roomid).broadcast.emit('get data');
														informed += `{(informed) ? "+ " : ""}Room`;
													}
													if (!informed) {
														informed = "Nobody";
													}
													add += ` Replaced data in room, informed: (${informed}).`
												}
												if ("emit" in config) {
													for (emit of emitConfig["emit"]) {
														if (emit.sender) {
															socket.emit(emit.command, result);
															add += " Sent command (" + emit.command + ") to client.";
														}
														if (emit.room) {
															socket.to(roomid).broadcast.emit(emit.command, result);
															add += " Broadcasted command (" + emit.command + ") to room.";
														}
													}
												}
												log(roomid, socket.conn.id, `Client command (${d.command}).${(add) ? add : ''}`);
											} else {
												log(roomid, socket.conn.id, `Error: Client attempted command (${d.command}) not defined in "_commands" of custom file`, true);
											}
										}
									}); // Likely needs more security/validation for live
								} else {
									log(roomid, socket.conn.id, `Error: Client attempted undefined command (${('command' in d) ? d.command : null})`, true);
								}
							} else {
								log(roomid, socket.conn.id, `Error: Client attempted command in undefined namespace (${'namespace' in d ? d.namespace: null})`, true);
							}
						} else {
							log(roomid, socket.conn.id, `Error: Attempted custom command (${('command' in d) ? d.command : null}) but not in any room, so will not give a response`, true);
						}
					} else {
						log(roomid, socket.conn.id, "Error: Attempted custom command but no customs are loaded", true);
					}
				} else {
					log(roomid, socket.conn.id, "Error: Attempted custom command with no or invalid parameters", true);
				}
			});
		});
	}
}
