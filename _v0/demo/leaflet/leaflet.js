const fs = require("fs");

module.exports = {
	_data: [],
	
	_generateOnServer: false, // Required, no default
	
	_commands: {
		pushAll: {
			emit: "render all",
			emitSender: false,
			emitBroadcast: true,
			requireGenerated: false
		},
		pushMain: {
			emit: "render main",
			emitSender: false,
			emitBroadcast: true,
			requireGenerated: false
		}
	},
	
	pushAll: (params, callback) => {
		module.exports._data = params.data;
		return callback(null, params.data);
	},
	
	pushMain: (params, callback) => {
		module.exports._data = params.data;
		return callback(null, params.data);
	}
};