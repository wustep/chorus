/* Parameters */

var scheme = 1; // Scheme = 0 = notes disappear, 1 = notes stay faded
var colorArray = ["#ff0000", "#ff8000", "#ffbf00", "#ffff00", "#bfff00", "#00ff00", "#00ffbf", "#0080ff", "#0000ff", "#4000ff", "#8000ff", "#ff00ff"];
var sound = 0; // 0 = don't play sound from input, 1 = do

$(function() {
	var thisNote = $("div.note").attr('id');
	thisNote = thisNote.substring(5, thisNote.length);

	/* Add click triggers to those notes */
	
	$(".note").on("mousedown touchstart", function(e) {
		e.preventDefault(); // For iPad, to prevent both triggering
		noteOn(parseInt(thisNote)+21, 80, true);
	}).on("mouseup touchend", function(e) { 
		e.preventDefault();
		noteOff(parseInt(thisNote)+21, true);	
	});

	/* Socket IO triggers */
	var socket = io();

	socket.on("noteOn", function(d) {
		if (d.note-21 == thisNote) {
			noteOn(d.note, d.velocity);
		}
	});
	socket.on("noteOff", function(d) {
		if (d.note-21 == thisNote) {
			noteOff(d.note);
		}
	});
	
	/* Note on / off */

	function noteOn(note, velocity=80, emit=false) {
		var key = note - 21; // correct, since these keys seem to start higher
		var d = document.getElementsByClassName("note")[0];
		d.style.background = colorArray[key % 12];
		d.classList.add("pressed");
		if (scheme === 1) 
			d.style.opacity = 1.0;
		if (sound)
			MIDI.noteOn(0, note, velocity, 0);
		if (emit)
			socket.emit('command', { name: "noteOn", params: { note: parseInt(note), velocity: velocity }});
	}

	function noteOff(note, emit=false) {
		var key = note - 21;
		var d = document.getElementsByClassName("note")[0];
		if (scheme === 0) 
			d.style.background = "";
		if (scheme === 1) 
			d.style.opacity = 0.6;
		d.classList.remove("pressed");
		if (sound)
			MIDI.noteOff(0, note, 0);
		if (emit)
			socket.emit('command', { name: "noteOff", params: { note: parseInt(note) }});
	}
});