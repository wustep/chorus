/* Generate colors of keyboard  */
var colorArray = ["#ff0000", "#ff8000", "#ffbf00", "#ffff00", "#bfff00", "#00ff00", "#00ffbf", "#0080ff", "#0000ff", "#4000ff", "#8000ff", "#ff00ff"];
var colorMap = new Array(88);
for (var i = 0; i < colorMap.length; i++) {
	colorMap[i] = colorArray[i % 12];
}

/* Request MIDI access - https://webaudio.github.io/web-midi-api/ */
var midi = null;
var hasInput = false;
var colorElements = [];
var defaultData = { activeNotes: new Array(88),
									  notes: [{key: "A", duration: 0}, {key: "Bb", duration: 0}, {key: "B", duration: 0}, {key: "C", duration: 0}, {key: "Db", duration: 0}, {key: "D", duration: 0},
														{key: "Eb", duration: 0}, {key: "E", duration: 0}, {key: "F", duration: 0}, {key: "Gb", duration: 0}, {key: "G", duration: 0}, {key: "Ab", duration: 0}]};

/* Chorus settings:
	- hide on successfully creating / joining room
	- allow for chromecast casting
	- append automatically to windo
	- use custom "midi" commands
	- use default data of above variable
*/
var chorus = new Chorus({hide: true, chromecast: true, append: true, namespace: "midi", data: defaultData})

$(function() {
	/* Request MIDI input access and report results */
	navigator.requestMIDIAccess().then(
		function(midiAccess) {
			midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
			var inputs = midi.inputs.values();
			for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
				input.value.onmidimessage = onMIDIMessage;
				hasInput = true;
			}
			if (hasInput) {
				console.log("MIDI input ready!");
			} else {
				console.log("MIDI ready but no input");
			}
		},
		function() {
			console.error("MIDI access failed");
		}
	);

	function onMIDIMessage(event) {
		switch (event.data[0] & 0xf0) {
			case 0x90: // Note on
				//console.log(event);
				if (event.data[2] != 0) {
					noteOn(event.data[1], event.data[2], true);
					return;
				}
			case 0x80: // Note off, fall through if velocity == 0
				noteOff(event.data[1], true);
				return;
		}
	}

	/* Generate array of note divs */
	for (var n = 0; n < 88; n++) {
		var d = document.createElement("div");
		d.innerHTML = MIDI.noteToKey[n + 21];
		colorElements.push(d);
		$("#colors").append(d);
	}

	/* Add click triggers to those notes */
	$("#colors div").on("mousedown touchstart", function(e) {
		e.preventDefault(); // For iPad, to prevent both these events triggering
		var note = $(this).html();
		noteOn(MIDI.keyToNote[note], 80, true);
	}).on("mouseup touchend", function(e) {
		e.preventDefault();
		var note = $(this).html();
		noteOff(MIDI.keyToNote[note], true);
	});

	/* Load instrument and effects used to play notes */
	MIDI.loadPlugin({
		soundfontUrl: "./midi/",
		instrument: "acoustic_grand_piano", // or the instrument code 1 (aka the default)
		onsuccess: function() {
			MIDI.setEffects([{
				type: "Chorus",
				rate: 1.5,
				feedback: 0.2,
				delay: 0.0045,
				bypass: 0
			},
			{
				type: "Convolver",
				highCut: 18000, // 20 to 22050
				lowCut: 20, // 20 to 22050
				dryLevel: 1, // 0 to 1+
				wetLevel: 1, // 0 to 1+
				level: 1, // 0 to 1+, adjusts total output of both wet and dry
				impulse: "./midi/impulse_rev.wav", // the path to your impulse response
				bypass: 0
			}]);
		}
	});

	/* Chorus socket command striggers */
	chorus.socket.on("noteOn", function(d) {
		console.log(d);
		noteOn(d.note, d.velocity);
	});
	chorus.socket.on("noteOff", function(d) {
		console.log(d);
		noteOff(d.note);
	});

	/* Chorus render: populate keyboard with colored keys */
	chorus.render = function(d) {
		if (typeof d === "object" && d !== null && "activeNotes" in d && "notes" in d) {
			for (let i = 0; i < d.activeNotes.length; i++) {
				if (d.activeNotes[i] !== null) {
					noteOff(i + 21, false);
				}
			}
		}
	}

	/* Note on / off event functions */
	function noteOn(note, velocity=80, emit=false) {
		var key = note - 21; // correct, since these keys seem to start higher
		var d = colorElements[key];
		if (d) {
			d.style.background = colorMap[key];
			d.style.opacity = 1.0;
			d.classList.add("pressed");
			if (sound)
				MIDI.noteOn(0, note, velocity, 0);
			if (emit) // Only emit on outgoing, not incoming noteOn events
				chorus.command("noteOn", { note: note, velocity: velocity });
		}
	}

	function noteOff(note, emit=false) {
		var key = note - 21;
		var d = colorElements[key];
		if (d) {
			d.style.background = colorMap[key]; // This is here, since on render, they won't have a color
			d.style.opacity = 0.5;
			d.classList.remove("pressed");
			if (sound)
				MIDI.noteOff(0, note, 0);
			if (emit)
				chorus.command("noteOff", { note: note });
		}
	}
});
