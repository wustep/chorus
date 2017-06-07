/* Crossfilter demo server-sided data generation function 

Crossfilter demo developed from https://square.github.io/crossfilter/ */

const d3 = require('d3');
const fs = require("fs");
const crossfilter = require('crossfilter');

var _data = [];

module.exports = {
	_generateOnServer: false, // Required, no default
	
	_commands: {
		updateSliders: {
			replaceData: true,
			emit: "render all",
			emitSender: true,
			emitBroadcast: true,
			requireGenerated: false,
			returnData: true
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
	
	updateSliders: (params, callback) => {
		return callback(null, params.data);
	}
};