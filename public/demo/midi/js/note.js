/* note.js
  Single note module
*/

var colorArray = ["#ff0000", "#ff8000", "#ffbf00", "#ffff00", "#bfff00", "#00ff00", "#00ffbf", "#0080ff", "#0000ff", "#4000ff", "#8000ff", "#ff00ff"];
//var sound = 0; // 0 = don't play sound from input, 1 = do
// TODO: Return sound functionality by adding MIDI here

/* Chorus settings
  - cares = true => don't re-render on new data, only care about specific events
*/
var chorus = new Chorus({hide: true, append: true, namespace: "midi", care: false})

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
	chorus.socket.on("noteOn", function(d) {
		if (d.note-21 == thisNote) {
			noteOn(d.note, d.velocity);
		}
	});
	chorus.socket.on("noteOff", function(d) {
		if (d.note-21 == thisNote) {
			noteOff(d.note);
		}
	});

	/* Note on / off */
	function noteOn(note, velocity=80, emit=false) {
		var key = note - 21; // correct, since these keys seem to start higher
		var d = document.getElementsByClassName("note")[0];
		d.style.background = colorArray[key % 12];
		d.style.opacity = 1.0;
		d.classList.add("pressed");
		//if (sound)
		//	MIDI.noteOn(0, note, velocity, 0);
		if (emit)
			chorus.command("noteOn", { note: parseInt(note), velocity: velocity });
	}

	function noteOff(note, emit=false) {
		var key = note - 21;
		var d = document.getElementsByClassName("note")[0];
		d.style.background = colorArray[key % 12];
		d.style.opacity = 0.5;
		d.classList.remove("pressed");
		//if (sound)
		//	MIDI.noteOff(0, note, 0);
		if (emit)
			chorus.command('noteOff', { note: parseInt(note) });
	}
});
