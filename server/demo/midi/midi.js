/* midi.js
  Custom commands for MIDI demo
*/

const hbs = require('hbs');
const utils = require('./utils');
const app = require('../../server.js'); // Get express instance

hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views/')

const demoPath = "/demo/midi/";

app.get(demoPath, (req, res) => {
	res.render('index.hbs', {
		pageTitle: 'Keyboard',
	});
});

app.get(demoPath + 'player', (req, res) => {
	res.render('player.hbs', {
		pageTitle: 'MIDI Player'
  });
});

app.get(demoPath + 'notes', (req, res) => {
	res.render('notes.hbs', {
		pageTitle: 'Notes Played'
	});
});


app.get(demoPath + 'note/:note', (req, res) => { // TODO: Also add allowing user to do /note/A0 instead of /0, etc.
	res.render('note.hbs', {
		pageTitle: 'Note: ' + utils.numToKey(req.params.note),
		note: req.params.note,
		noteKey: utils.numToKey(req.params.note)
	});
});

// When going to /note, give client an incremented note, deciding for them what the note will be
var currentNote = -1;
app.get(demoPath + 'note', (req, res) => {
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
