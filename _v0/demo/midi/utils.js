var keys = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"];

module.exports = {
	numToKey: (num) => {
		var parsed = parseInt(num);
		if (parsed >= 0 && parsed <= 88) {
			var octave = Math.floor((parsed + 9) / 12);
			var key = keys[parsed % 12];
			return key + octave;
		} else {
			return "ERR";
		}
	}
};