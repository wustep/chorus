if (typeof jQuery == 'undefined') { // TODO: Add versions here
	console.error("[Chorus] jQuery is not loaded and is required!");
} else if (typeof io == 'undefined') {
	console.error("[Chorus] Socket.io is not loaded and is required!");
} else if (typeof _data == 'undefined') {
	console.error("[Chorus] _data must exist as a global serializable object or variable, containing the data store.");
/*} else if (typeof chorusRender != 'function') {
	console.error("[Chorus] chorusRender() must be a global function that exists and renders the viz accordingly based on _data.");
} else if (typeof chorusUpdate == 'function') { 
	console.error("[Chorus] chorusUpdate() must not be an existing global function.");*/
} else {
	let chorus = io("http://localhost:3000");
	let display = -1; // -1 = neither, 0 = main, 1 = detached
	
	function chorusUpdate() {
		if (display == 0) chorus.emit("push main", _data);
	}

	$(function() {		
		var nav = $("<nav id='chorus-nav'></nav>");
		var navNone = $("<nav id='chorus-nav'><button id='chorus-cast'>Cast</button> <button id='chorus-follow'>Follow</button></nav>");
		var navMain = $("<button id='chorus-display' value='main'>Detach</button> <button id='chorus-push' value='main'>Push to All</button></nav> <button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></span></button>");
		var navAux = $("<button id='chorus-display' value='aux'>Return to Main</button> <button id='chorus-push' value='main'>Push to Main</button></nav> <button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></button></span>");
		var room = "ERR";

		$("body").append(nav)
		$("#chorus-nav").html(navNone);
		
		// Getting data for the first time or Aux -> Main
		chorus.on("get data", function (data) {
			chorusRender(data, true);
			_data = data;
		});
		// Render on push to main/all
		chorus.on("push all", function (data) {
			chorusRender(data);
		});
		chorus.on("push main", function (data) {
			if (!display) { 
				chorusRender(data);
				_data = data;
			}
		});
			
		// Cast button
		$("#chorus-nav").on("click", "#chorus-cast", function() {
			var roomPrompt = prompt("Create room?");
			if (roomPrompt != null && roomPrompt.length > 0) {
				room = roomPrompt;
				chorus.emit("cast", { room: roomPrompt, data: _data });
				$("#chorus-cast").prop("disabled", true);
				$("#chorus-follow").prop("disabled", true);
			}
		});
		
		// Cast success/failure
		chorus.on("cast success", function() {
			display = 0;
			$("#chorus-nav").html(navMain);
			$("#chorus-room-number").html(room);
		});		
		chorus.on("cast failure", function() {
			alert("Cast failed, invalid or existing room: " + room);
			room = "ERR";
			$("#chorus-cast").prop("disabled", false);
			$("#chorus-follow").prop("disabled", false);
		});
		
		// Follow button
		$("#chorus-nav").on("click", "#chorus-follow", function() {
			var roomPrompt = prompt("Follow room?");
			if (roomPrompt != null && roomPrompt.length > 0) {
				room = roomPrompt;
				chorus.emit("follow", roomPrompt);
				$("#chorus-cast").prop("disabled", true);
				$("#chorus-follow").prop("disabled", true);
			}
		});
		
		// Follow success/failure
		chorus.on("follow success", function(data) {
			display = 0;
			$("#chorus-nav").html(navMain);
			$("#chorus-room-number").html(room);
			_data = data;
			chorusRender(data, true);
		});		
		chorus.on("follow failure", function() {
			alert("Follow failed, invalid room: " + room);
			room = "ERR";
			$("#chorus-cast").prop("disabled", false);
			$("#chorus-follow").prop("disabled", false);
		});

		// Display button
		$("#chorus-nav").on("click", "#chorus-display", function() {
			display = 1 - display; // swap 1 to 0 and vice-versa
			if (!display) { // Swapping Aux -> Main
				chorus.emit("get data")
				$("#chorus-nav").html(navMain);
			} else {
				$("#chorus-nav").html(navAux);
			}
			$("#chorus-room-number").html(room);
		});
		
		// Push button
		$("#chorus-nav").on("click", "#chorus-push", function() {
			if (!display) { // Pushing Main -> All
				chorus.emit("push all", _data);
			} else { // Pushing Main -> All
				chorus.emit("push main", _data);
			}
		});

		// Exit button
		$("#chorus-nav").on("click", "#chorus-exit", function() {
			display = -1;
			$("#chorus-nav").html(navNone);
			$("#chorus-cast").prop("disabled", false);
			$("#chorus-follow").prop("disabled", false);
			chorus.emit("exit", room);
		});
	});
}