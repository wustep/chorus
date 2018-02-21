/* Parameters */

var scheme = 1; // Scheme = 0 = notes disappear, 1 = notes stay faded
var colorArray = ["#ff0000", "#ff8000", "#ffbf00", "#ffff00", "#bfff00", "#00ff00", "#00ffbf", "#0080ff", "#0000ff", "#4000ff", "#8000ff", "#ff00ff"];
var sound = 1; // 0 = don't play sound from input, 1 = do

/* MIDI variables */

var player = null;

/* Generate color map based on array of colors */
var colorMap = new Array(88);
for (var i = 0; i < colorMap.length; i++) {
	colorMap[i] = colorArray[i % 12];
}

/* Request MIDI access - https://webaudio.github.io/web-midi-api/ */
var midi = null;
var hasInput = false;
var colorElements = [];
var chorus = new Chorus({chromecast: true, hide: true})
chorus.append();

$(function() {
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
				console.error("MIDI ready but no input");
			}
		},
		function() {
			console.error("MIDI access failed");
		}
	);

	function onMIDIMessage( event ) {
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


	/* Generate array of note divs to refer to */

	for (var n = 0; n < 88; n++) {
		var d = document.createElement("div");
		d.innerHTML = MIDI.noteToKey[n + 21];
		colorElements.push(d);
		$("#colors").append(d);
	}

	/* Add click triggers to those notes */

	$("#colors div").on("mousedown touchstart", function(e) {
		e.preventDefault(); // For iPad, to prevent both triggering
		var note = $(this).html();
		note = MIDI.keyToNote[note];
		noteOn(note, 80, true);
	}).on("mouseup touchend", function(e) {
		e.preventDefault();
		var note = $(this).html();
		note = MIDI.keyToNote[note];
		noteOff(note, true);
	});

	if (sound) {
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
	}

	/* Socket IO triggers */
	chorus.socket.on("noteOn", function(d) {
		console.log(d);
		noteOn(d.note, d.velocity);
	});
	chorus.socket.on("noteOff", function(d) {
		noteOff(d.note);
	});

	/* Note on / off */

	function noteOn(note, velocity=80, emit=false) {
		var key = note - 21; // correct, since these keys seem to start higher
		var d = colorElements[key];
		if (d) {
			d.style.background = colorMap[key];
			d.classList.add("pressed");
			if (scheme === 1)
				d.style.opacity = 1.0;
			if (sound)
				MIDI.noteOn(0, note, velocity, 0);
			if (emit)
				chorus.command("noteOn", { note: note, velocity: velocity });
		}
	}

	function noteOff(note, emit=false) {
		var key = note - 21;
		var d = colorElements[key];
		if (d) {
			if (scheme === 0)
				d.style.background = "";
			if (scheme === 1)
				d.style.opacity = 0.6;
			d.classList.remove("pressed");
			if (sound)
				MIDI.noteOff(0, note, 0);
			if (emit)
				chorus.command("noteOff", { note: note });
		}
	}
});
