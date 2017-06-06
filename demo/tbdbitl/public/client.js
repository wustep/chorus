/* TDBITL demo developed from https://github.com/wustep/tbdbitl */

$(function() {
	var width = $("#instruments-pie").width(),
		height = $("#instruments-pie").height(),
		radius = Math.min(width, height) / 2;

	var svg = d3.select("#instruments-pie").append("svg").append("g");
	svg.append("g").attr("class", "slices");
	svg.append("g").attr("class", "labelName");
	svg.append("g").attr("class", "labelValue");
	svg.append("g").attr("class", "lines");

	var width2 = 460,
		height2 = 450;

	var svg2 = d3.select("#instruments-chart").append("svg")
		.attr("width", width2)
		.attr("height", height2);

	var pie = d3.pie().sort(null)
		.value(function(d) {
			return d.value;
		});

	var arc = d3.arc().outerRadius(radius * 0.8).innerRadius(radius * 0.4);
	var outerArc = d3.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);

	var div = d3.select("#instruments-pie").append("div");
	div.style("display", "none");
	svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	svg.append("text").attr("id", "row-text").attr("text-anchor", "middle");

	var colorRange = d3.schemeCategory20;
	var color = d3.scaleOrdinal(colorRange);
	var socket = io();
	
	var _data = [];
	
	socket.emit('get data');
	socket.on('get data', function (data) {
		console.log("Obtained data from server");	
		_data = data;
		
		if (data.pie.length == 0) { // Get first row if empty
			socket.emit('command', { name: "addRow" });
			console.log("Sending add row request");
		} else {
			render();
		}
		
		/* Triggers */
		$(".fa-arrow-right.instrument-arrow").on("click", function (e) {
			console.log("Sending next row request");
			socket.emit('command', { name: "addRow" });
		});
		$(".fa-arrow-left.instrument-arrow").on("click", function (e) {
			console.log("Sending delete row request")
			socket.emit('command', { name: "deleteRow" });
		});
	});
	
	socket.on('render all', function(data) {
		console.log("Received render all request");
		_data = data;
		console.log(_data);
		render();
	});
	
	function render() {
		if (_data.pie) {
			change(_data.pie, _data.dot);
			change(_data.pie, _data.dot);
		} else {
			console.log("[Error] Failed to render as data was not provided yet by server");
		}
	}
	
	/* Tooltips */
	var tip = d3.tip().attr('class', 'd3-tip').html(function(d, i) { return "<span class=\"instrument instrument-"+i+"\"></span>"+d.data.value + " " + (d.data.label)+" ("+Math.floor((d.data.value/_data.instruments)*100)+"%)"; });

	var tip2 = d3.tip().attr('class', 'd3-tip').html(function(d) { 
		var alt = (d.colId > 11) ? "<br>(Alternate)" : "<br>";
		return "<span class=\"instrument instrument-"+d.instrument+"\"></span>" + d.row + " row: " + _data.pie[d.instrument]["label"] + alt;
	}).offset([-10,0]);
	svg.call(tip);
	svg2.call(tip2);
		
	/* Change function */

	function change(data, data2) {
		tip.hide();
		/* ------- Circle graph ------ */
		var circles = svg2.selectAll("circle")
			.data(data2);
		
		circles.enter()
			.append("circle")
			.style("stroke", function(d, i){ return d3.schemeCategory20[d.instrument] })
			.style("fill", function(d, i){ return d3.schemeCategory20[d.instrument] })
			.attr("r", 8)
			.attr("cx", function(d, i) { 
				var extra = (d.colId > 11) ? 10 : 0;
				return 25 + (d.colId * 24) + extra; 
			})
			.attr("cy", function(d, i) { return 20 + (d.rowId * 26); })
			.on('mouseover', tip2.show)
			.on('mouseout', tip2.hide);
		circles.exit().remove();
		
		/* ------- PIE SLICES -------*/
		var slice = svg.select(".slices").selectAll("path.slice")
			.data(pie(data), function(d){ return d.data.label });
		slice.enter()
			.insert("path")
			.style("fill", function(d) { return color(d.data.label); })
			.attr("class", "slice")
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide);
		slice.transition().duration(1000).attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return arc(interpolate(t));
			};
		})
		slice.exit().remove();

		/* ------- TEXT LABELS -------*/
		var text = svg.select(".labelName").selectAll("text")
			.data(pie(data), function(d){ return d.data.label });
		text.enter()
			.append("text")
			.attr("dy", ".35em")
			.text(function(d) {
				return (d.data.label+": "+d.value+"");
			});
		function midAngle(d){
			return d.startAngle + (d.endAngle - d.startAngle)/2;
		}
		text.transition().duration(1000).attrTween("transform", function(d) {
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					var d2 = interpolate(t);
					var pos = outerArc.centroid(d2);
					pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
					return "translate("+ pos +")";
				};
			})
			.styleTween("text-anchor", function(d){
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					var d2 = interpolate(t);
					return midAngle(d2) < Math.PI ? "start":"end";
				};
			})
			.text(function(d) {
				return (d.data.label+": "+d.value+"");
			});
		text.exit()
			.remove();

		/* ------- SLICE TO TEXT POLYLINES -------*/
		var polyline = svg.select(".lines").selectAll("polyline")
			.data(pie(data), function(d){ return d.data.label });
		polyline.enter()
			.append("polyline");
		polyline.transition().duration(1000)
			.attrTween("points", function(d){
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					var d2 = interpolate(t);
					var pos = outerArc.centroid(d2);
					pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
					return [arc.centroid(d2), outerArc.centroid(d2), pos];
				};
			});
		polyline.exit().remove();
	}
});