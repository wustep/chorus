/* midi.js
  Custom commands for MIDI demo
*/

const hbs = require('hbs');
const utils = require('./utils');
const app = require('../../server.js'); // Get express instance

hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views/')

app.get('/demos/midi/', (req, res) => {
	res.render('index.hbs', {
		pageTitle: 'Keyboard',
	});
});

app.get('/demos/midi/player', (req, res) => {
	res.render('player.hbs', {
		pageTitle: 'MIDI Player'
  });
});

app.get('/demos/midi/notes', (req, res) => {
	res.render('notes.hbs', {
		pageTitle: 'Notes Played'
	});
});

var currentNote = -1;

app.get('/demos/midi/note/:note', (req, res) => { // TODO: Also add allowing user to do /note/A0 instead of /0, etc.
	res.render('note.hbs', {
		pageTitle: 'Note: ' + utils.numToKey(req.params.note),
		note: req.params.note,
		noteKey: utils.numToKey(req.params.note)
	});
});

app.get('/demos/midi/note', (req, res) => { // Give client incremented note
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

/* TODO: Unused rn not sure what to do next */
const notesDefault = [{key: "A", duration: 0}, {key: "Bb", duration: 0}, {key: "B", duration: 0}, {key: "C", duration: 0}, {key: "Db", duration: 0}, {key: "D", duration: 0},
		{key: "Eb", duration: 0}, {key: "E", duration: 0}, {key: "F", duration: 0}, {key: "Gb", duration: 0}, {key: "G", duration: 0}, {key: "Ab", duration: 0}];

module.exports = {
	_namespace: "midi",

	_commands: {
		noteOn: {
			emit: [{
				command: "noteOn",
				sender: true,
				room: false
			}]
		},
		noteOff: {
			emit: [{
				command: "noteOff",
				sender: false,
				room: true
			}]
		},
		reset: {
			replace: [{
				sender: true,
				room: true
			}]
		}
	},

	noteOn: (data, params, callback) => { // TODO: Possibly validate input?
		if (typeof params === 'object' && 'note' in params) {
			const adjNote = params.note - 21;
			if (typeof data === 'object' && 'activeNotes' in data && (data.activeNotes[adjNote] === undefined || data.activeNotes[adjNote] === -1)) { // Check that note is currently not already played
				data.activeNotes[adjNote] = process.uptime();
			}
		} else {
			return callback("Note On command missing note data");
		}
		return callback(null, params);
	},

	noteOff: (data, params, callback) => { // If C1 and C2 are being played, double count them.
		const adjNote = params.note - 21;
		const key = adjNote % 12;
		if (typeof data === 'object' && 'activeNotes' in data && data.activeNotes[adjNote] !== undefined && data.activeNotes[adjNote] !== -1) {
			data.notes[key].duration += process.uptime() - activeNotes[adjNote];
			data.activeNotes[adjNote] = -1;
		} else {
			return callback("ActiveNotes missing from data");
		}
		return callback(null, params);
	},

	reset: (data, params, callback) => {
		data.notes = JSON.parse(JSON.stringify(notesDefault)); // Copy default
		data.activeNotes = notesDefault;
		callback(null, data);
	}
};
