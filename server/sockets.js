const socketIO = require('socket.io');

const gen = require("../" + process.env.server);

const _generateOnServer = gen._generateOnServer; // TODO: Better way for user to decide whether to generate data on server or client

var _generated = false;
if (_generateOnServer) { // If generateOnServer is set, generate data
	gen.create(function(err, data) { 
		if (err) {
			console.log("[Error] Generating data: " + err); 
			return;
		}
		log("Generated data on server");
		_generated = true;
	});
}

function log(msg, force) { // Log if debug set in .env or force parameter is set
	if (process.env.debug === 'true' || force) {
		console.log(msg);
	}
}

module.exports = { 
	start: (server) => {
		var io = socketIO(server);

		io.on('connection', (socket) => {
			log("Client connected");
			
			if (!_generateOnServer) { // Generate on client if generateOnServer is false
				socket.on('generate data', (data) => { 
					if (!_generated) {
						log("Generated data on server from client");
						gen._data = data;
						_generated = true;
					} else {
						console.error("[Error] Client generated data but it was already generated");
					}
				});
			}
			
			socket.on('get data', () => { // Get data request, only done once per client
				if (_generated) { // Send data to client
					log("Client data request. Sending data to client.")
					socket.emit('get data', gen._data); 
				} else if (!_generateOnServer) { // Generate on client because not generated yet
					log("Client data request. Sending generate data request to client.")
					socket.emit('generate data');
				} else {
					console.error("[Error] Client attempted to obtain data but it was not generated on server yet")
				}
			});
			
			socket.on('command', (d) => { 
				if ("name" in d && d.name in gen._commands) { // Valid command
					const props = gen._commands[d.name];
					if (!props.requireGenerated || (props.requireGenerated && _generated)) { // Check if data was generated if needed
						gen[d.name](d.params, function (err, data) { 
							if (err) {
								log("[Error] " + err);
								return;
							} else {
								var add = ""; // Additional console info
								if (props.emitSender) { // TODO: Add option to decide what data to emit with command?
									socket.emit(props.emit, data);
									add += " Sending command (" + props.emit + ") to client.";
								}
								if (props.emitBroadcast) {
									socket.broadcast.emit(props.emit, data);
									add += " Broadcasting command (" + props.emit + ") to all other clients.";
								}
								log("Command (" + d.name + ") done." + add);
							}
						}); // Might need more security/validation?
					} else {
						 console.error("[Error] Client attempted command (" + d.name + ") that required data generation, but data was not generated yet.")
					}
				} else {
					console.error("[Error] Client attempted undefined command (" + d.name + ")");
				}
			});
		});
	}
};