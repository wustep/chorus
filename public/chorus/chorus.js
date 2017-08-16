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
	let chorus = io();
	let display = -1; // -1 = neither, 0 = main, 1 = detached
	
	function chorusUpdate() {
		if (display == 0) chorus.emit("push main", _data);
	}

	$(function() {      
		var nav = $("<nav id='chorus-nav'></nav>");
		var navNone = $("<nav id='chorus-nav'><button id='chorus-cast'>Cast</button> <button id='chorus-follow'>Follow</button></nav>");
		var chorusChromecasting = false;
		var chromeCasting = false; // Set to 1 when following with Chromecast button			

		/* Chorus - Chromecast */
		if (typeof(chorusChromecast) !== "undefined" && chorusChromecast && typeof(chrome.cast) !== "undefined") { 
			chorusChromecasting = true;
			navNone.append(" <button id='chorus-chromecast-follow' disabled='true'>Chromecast</button>");
			var applicationID = '7FF6442F';
			var namespace = 'urn:x-cast:edu.ohio-state.cse.chorus';
			var session = null; // Chromecast session

			if (!chrome.cast || !chrome.cast.isAvailable) {
				setTimeout(initializeCastApi, 1000);
			}

			function initializeCastApi() {
				var sessionRequest = new chrome.cast.SessionRequest(applicationID);
				var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
					sessionListener,
					receiverListener);

				chrome.cast.initialize(apiConfig, onInitSuccess, onError);
				$("#chorus-chromecast-follow").prop("disabled", false)
			}

			function onInitSuccess() {
				console.log('[Chorus Chromecast] onInitSuccess');

			}

			function onError(message) {
				console.log('[Chorus Chromecast] onError: ' + JSON.stringify(message));
				alert("[Chorus Chromecast] Error: " + message.code + ": " + message.description + " / " + message.details);
			}

			function onSuccess(message) {
				console.log('[Chorus Chromecast] onSuccess: ' + message);
				alert("[Chorus Chromecast] Casted!");
			}

			function onStopAppSuccess() {
				console.log('[Chorus Chromecast] onStopAppSuccess');
			}

			function sessionListener(e) {
				console.log('New session ID:' + e.sessionId);
				session = e;
				session.addUpdateListener(sessionUpdateListener);
				session.addMessageListener(namespace, receiverMessage);
			}

			function sessionUpdateListener(isAlive) {
				var message = isAlive ? 'Session Updated' : 'Session Removed';
				message += ': ' + session.sessionId;
				console.log(message);
				if (!isAlive) {
					session = null;
				}
			}

			function receiverMessage(namespace, message) {
				console.log('[Chorus Chromecast] receiverMessage: ' + namespace + ', ' + message);
			}

			function stopApp() {
				session.stop(onStopAppSuccess, onError);
			}
			
			function receiverListener(e) {
				if (e === 'available') {
					console.log('[Chorus Chromecast] Receiver found');
				} else {
					console.log('[Chorus Chromecast] Receiver list was empty');
					alert("[Chorus Chromecast] Error: receiver list was empty.")
				}
			}
			function sendMessage() {
				var message = {
					url: window.location.href,
					room: room
				};
				if (session !== null) {
      				session.sendMessage(namespace, message, onSuccess.bind(this, 'Chorus cast sent to ' + message.url + " @ room: " + message.room), onError);
				} else {
					console.log("[Chorus Chromecast] Session requested with receiver..");
					chrome.cast.requestSession(function(e) {
						session = e;
						session.sendMessage(namespace, message, onSuccess.bind(this, 'Chorus cast sent to ' + message.url + " @ room: " + message.room), onError);
					}, onError);
					chromeCasting = false;
				}	
			}				
		} else if (typeof(chorusChromecast) !== "undefined") {
			console.error("[Chorus] ChorusChromecast was requested but cast sender / receiver APIs were not included");
			chorusChromecasting = false;
		} else {
			chorusChromecasting = false;
		}
		var navMain = $("<button id='chorus-display' value='main'>Detach</button> <button id='chorus-push' value='main'>Push to All</button></nav> <button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></span></button>");
		var navAux = $("<button id='chorus-display' value='aux'>Return to Main</button> <button id='chorus-push' value='main'>Push to Main</button></nav> <button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></button></span>");
		var room = "ERR";

		$("body").append(nav)
		$("#chorus-nav").html(navNone);
		
		/* Chorus - Chromecast sender logic */
		if (chorusChromecasting) {
			$("#chorus-nav").on("click", "#chorus-chromecast-follow", function () {
				chromeCasting = true;
				followPrompt();
			});
		}
		
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
				$("#chorus-chromecast-follow").prop("disabled", true);
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
			$("#chorus-chromecast-follow").prop("disabled", false);
			chromeCasting = false;
		});
		
		// Follow button
		$("#chorus-nav").on("click", "#chorus-follow", function() {
			followPrompt();
		});
		
		function followPrompt() { // Used in Chromecast prompt, so made into function
			var roomPrompt = prompt((chromeCasting ? "Chromecast room?" : "Follow room?"));
			if (roomPrompt != null && roomPrompt.length > 0) {
				room = roomPrompt;
				chorus.emit("follow", roomPrompt);
				$("#chorus-cast").prop("disabled", true);
				$("#chorus-follow").prop("disabled", true);
				$("#chorus-chromecast-follow").prop("disabled", true);
				sendMessage(); // TODO: For some reason, this can't be in Chorus.on("Follow success"). Not sure why, but this leads to some weird interactions.
			}
		}
		
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
			$("#chorus-chromecast-follow").prop("disabled", false)
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
			$("#chorus-chromecast-follow").prop("disabled", false);
			chorus.emit("exit", room);
		});
	});
}