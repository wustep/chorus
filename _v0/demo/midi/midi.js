/* Additional server settings */

var app = require('../../server/server.js');
const hbs = require('hbs');
const utils = require('./utils');

hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views/')

app.get('/', (req, res) => {
	res.render('index.hbs', {
		pageTitle: 'Keyboard',
	});
});

app.get('/player', (req, res) => {
	res.render('player.hbs', {		
		pageTitle: 'MIDI Player'
  	});
});

app.get('/notes', (req, res) => {
	res.render('notes.hbs', {
		pageTitle: 'Notes Played'
	});
});

var currentNote = -1;

app.get('/note/:note', (req, res) => { // TODO: Also add allowing user to do /note/A0 instead of /0, etc.
	res.render('note.hbs', {
		pageTitle: 'Note: ' + utils.numToKey(req.params.note),
		note: req.params.note,
		noteKey: utils.numToKey(req.params.note)
	});
});

app.get('/note', (req, res) => { // Give client incremented note
	if (currentNote < 88) {
		currentNote++;
	} else {
		currentNote = 0;
	}

	res.render('note.hbs', {
		pageTitle: 'Note: ' + utils.numToKey(currentNote),
		note: currentNote,
		noteKey: utils.numToKey(currentNote)
	});
});

/* Data generator */

const d3 = require('d3');
const fs = require("fs");

var activeNotes = new Array(88); // Keep track of time at which notes are played
const notesDefault = [{key: "A", duration: 0}, {key: "Bb", duration: 0}, {key: "B", duration: 0}, {key: "C", duration: 0}, {key: "Db", duration: 0}, {key: "D", duration: 0}, 
		{key: "Eb", duration: 0}, {key: "E", duration: 0}, {key: "F", duration: 0}, {key: "Gb", duration: 0}, {key: "G", duration: 0}, {key: "Ab", duration: 0}];

module.exports = {
	_data: {
		scheme: 0, // 0 = notes disappear immediately, 1 = notes stay fade
		notes: JSON.parse(JSON.stringify(notesDefault)) // Copy notes array
	},
	
	_generateOnServer: true, // Required, no default

	_commands: {
		noteOn: {
			emit: "noteOn",
			emitSender: false,
			emitBroadcast: true,
		},
		noteOff: {
			emit: "noteOff",
			emitSender: false,
			emitBroadcast: true,
		},
		reset: {
			emit: "get data",
			emitSender: true,
			emitBroadcast: true
		}
	},
	
	create: (callback) => {
		callback(null, module.exports._data);
	},
	
	noteOn: (params, callback) => { // TODO: Possibly validate input?
		const adjNote = params.note - 21;
		if (activeNotes[adjNote] === undefined || activeNotes[adjNote] === -1) { // Check that note is currently not already played
			activeNotes[adjNote] = process.uptime();
		}
		return callback(null, params);
	},
	
	noteOff: (params, callback) => { // If C1 and C2 are being played, double count them.
		const adjNote = params.note - 21;
		const key = adjNote % 12;
		if (activeNotes[adjNote] !== undefined && activeNotes[adjNote] !== -1) {
			module.exports._data.notes[key].duration += process.uptime() - activeNotes[adjNote];
			activeNotes[adjNote] = -1;
		}
		return callback(null, params);
	},

	reset: (params, callback) => {
		module.exports._data.notes = JSON.parse(JSON.stringify(notesDefault)); // Copy default
		callback(null, module.exports._data);
	}
};
