var colorElements = [];

var defaultData = { activeNotes: new Array(88),
									  notes: [{key: "A", duration: 0}, {key: "Bb", duration: 0}, {key: "B", duration: 0}, {key: "C", duration: 0}, {key: "Db", duration: 0}, {key: "D", duration: 0},
														{key: "Eb", duration: 0}, {key: "E", duration: 0}, {key: "F", duration: 0}, {key: "Gb", duration: 0}, {key: "G", duration: 0}, {key: "Ab", duration: 0}]};
var chorus = new Chorus({chromecast: true, hide: true, append: true, namespace: "midi", data: defaultData})
$(function() {
	var colorArray = ["#ff0000", "#ff8000", "#ffbf00", "#ffff00", "#bfff00", "#00ff00", "#00ffbf", "#0080ff", "#0000ff", "#4000ff", "#8000ff", "#ff00ff"];

	/* D3 bar chart revised from https://bl.ocks.org/mbostock/3885304 */
	var svg = d3.select("svg"),
		margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom;

	var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
			y = d3.scaleLinear().rangeRound([height, 0]);

	var g = svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var data = [];
	var generated = false;

	/* Chorus render:
	 	 generate chart from chorus-supplied data
	*/
	chorus.render = function(_data) {
		data = _data.notes;
		var total = 0;
		for (var i = 0; i < data.length; i++) {
			data[i].num = i; // Add number for coloring reasons
			total += data[i].duration;
		}
		y.domain([0, d3.max(data, function(d) { return (total > 0) ? d.duration / total : 0; })]);
		if (!generated) {
			generated = true; // TODO: add mouseover to bars
			x.domain(data.map(function(d) { return d.key; }));

			g.append("g")
				.attr("class", "axis axis--x")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x));

			g.append("g")
				.attr("class", "axis axis--y")
				.call(d3.axisLeft(y).ticks(10, "%"))
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", "0.71em")
				.attr("text-anchor", "end")
				.text("Frequency");

			g.selectAll(".bar")
				.data(data)
				.enter().append("rect")
				.style("fill", function(d) { return colorArray[d.num]; })
				.attr("class", "bar")
				.attr("x", function(d) { return x(d.key); })
				.attr("y", function(d) { return y((total > 0) ? d.duration / total : 0); })
				.attr("width", x.bandwidth())
				.attr("height", function(d) { return height - y((total > 0) ? d.duration / total : 0); });
		} else {
			g.selectAll(".axis--y")
			.call(d3.axisLeft(y).ticks(10, "%"))
			g.selectAll(".bar")
			.data(data)
			.attr("y", function(d) { return y((total > 0) ? d.duration / total : 0); })
			.attr("height", function(d) { return height - y((total > 0) ? d.duration / total : 0); });
		}
	};

	/* reset btn:
		 send custom command 'reset' to reset note frequencies
	*/
	$("#reset").on('click', function() {
		chorus.command("reset");
	});
});
