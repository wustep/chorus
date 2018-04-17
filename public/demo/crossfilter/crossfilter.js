/* Crossfilter demo server-sided data generation function 

Crossfilter demo developed from https://square.github.io/crossfilter/ */

const d3 = require('d3');
const fs = require("fs");
const crossfilter = require('crossfilter');

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

	/*
	create: (callback) => {
		fs.readFile(__dirname + "/flights.json", "utf8", (error, data) => {
			var flights = d3.csvParse(data);

			if (error) {
				callback(err);
				return;
			}

			callback(null, flights);
		});
	},
	*/
	
	pushAll: (params, callback) => {
		module.exports._data = params.data;
		return callback(null, params.data);
	},
	
	pushMain: (params, callback) => {
		module.exports._data = params.data;
		return callback(null, params.data);
	}
};