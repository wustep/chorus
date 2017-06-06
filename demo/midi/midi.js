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

var _data = {
	scheme: 0, // 0 = notes disappear immediately, 1 = notes stay fade
	notes: new Array(88)
};

var notes = new Array(88); // Keep track of time at which notes are played

module.exports = {
	_generateOnServer: true, // Required, no default

	_commands: {
		noteOn: {
			replaceData: false,
			emit: "noteOn",
			emitSender: false,
			emitBroadcast: true,
			returnData: true
		},
		noteOff: {
			replaceData: false,
			emit: "noteOff",
			emitSender: false,
			emitBroadcast: true,
			returnData: true	
		}
	},
	
	create: () => {
		
	},
	
	reset: () => { // if scheme is 1, reset all notes to default (unpressed)
		
	},
	
	noteOn: (params, callback) => { // TODO: Possibly validate input?
		if (notes[params.note] === undefined || notes[params.note] === -1) { // Check that note is currently not already played
			notes[params.note] = process.uptime();
		}
		return callback(null, params);
	},
	
	noteOff: (params, callback) => { 
		if (notes[params.note] !== undefined && notes[params.note] !== -1) {
			console.log(process.uptime() - notes[params.note]);
			notes[params.note] = -1;
		}
		return callback(null, params);
	},
	
	changeScheme: () => {
		
	}
};
