if (typeof jQuery == 'undefined') { // TODO: Add versions here
		console.error("[Chorus] Error - jQuery is not loaded and is required. Chorus disabled.");
} else if (typeof io == 'undefined') {
		console.error("[Chorus] Error - Socket.io is not loaded and is required. Chorus disabled.");
} else {
	if (typeof _data == 'undefined') { // Default _data var to empty array.
		window._data = [];
	}
	
	// TODO move these variables to Chorus object
	let socket = io();
	let display = -1; // -1 = neither, 0 = main, 1 = detached
	let room = "ERR"; 
	
	let Chorus = function() {
		this.update = function() { // chorus.update() returns 1 if pushed to main, 0 otherwise
			if (display == 0) { 
				socket.emit("push main", _data);
				return 1;
			} 
			return 0;
		}
		this.nav = $("<nav id='chorus-nav'></nav>");
		this.chromecast = false;
		this.render = function() {
			console.log("[Chorus] Error - chorus.render() function should be implemented!");
		}
		this.append = function(obj="body") {
			$(obj).append(this.nav);
		}
	};
	var chorus = new Chorus();
	
	$(function() {
		var navNone = $("<div><button id='chorus-cast'>Cast</button> <button id='chorus-follow'>Follow</button></div>");
		var chromeCasting = false; // Set to true when following with Chromecast button			

		/* Chorus - Chromecast */
		if (chorus.chromecast && typeof(chrome) != 'undefined') { 
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
				chorus.nav.find("#chorus-chromecast-follow").prop("disabled", false)
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
					//alert("[Chorus Chromecast] Error: receiver list was empty.");
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
		} else if (typeof(chorusChromecast) != 'undefined') {
			console.error("[Chorus] ChorusChromecast was requested but cast sender API was not included");
			chorusChromecasting = false;
		} else {
			chorusChromecasting = false;
		}
		var navMain = $("<button id='chorus-display' value='main'>Detach</button> <button id='chorus-push' value='main'>Push to All</button></nav> <button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></span></button>");
		var navAux = $("<button id='chorus-display' value='aux'>Return to Main</button> <button id='chorus-push' value='main'>Push to Main</button></nav> <button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></button></span>");

		function getParameterByName(name, url) {
			if (!url) url = window.location.href;
			name = name.replace(/[\[\]]/g, "\\$&");
			var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
				results = regex.exec(url);
			if (!results) return null;
			if (!results[2]) return '';
			return decodeURIComponent(results[2].replace(/\+/g, " "));
		}
			
		// Chorus follow, used for Chromecast receiver to access
		let followRoom = getParameterByName("chorusFollowRoom");
		if (followRoom) { // If GET chorusFollowRoom is specified, just go there
			chromeCasting = false;
			socket.emit("follow", followRoom);
			navMain = $("<button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></button>");
			navAux = navMain;
			room = followRoom;
		}
		
		chorus.nav.html(navNone);
		
		/* Chorus - Chromecast sender logic */
		if (chorusChromecasting) {
			chorus.nav.on("click", "#chorus-chromecast-follow", function () {
				chromeCasting = true;
				followPrompt();
			});
		}
		
		// Getting data for the first time or Aux -> Main
		socket.on("get data", function (data) {
			chorus.render(data, true);
			_data = data;
		});
		// Render on push to main/all
		socket.on("push all", function (data) {
			chorus.render(data);
		});
		socket.on("push main", function (data) {
			if (!display) { 
				chorus.render(data);
				_data = data;
			}
		});
				
		// Cast button
		chorus.nav.on("click", "#chorus-cast", function() {
			var roomPrompt = prompt("Create room?");
			if (roomPrompt != null && roomPrompt.length > 0) {
				room = roomPrompt;
				socket.emit("cast", { room: roomPrompt, data: _data });
				chorus.nav.find("#chorus-cast").prop("disabled", true);
				chorus.nav.find("#chorus-follow").prop("disabled", true);
				chorus.nav.find("#chorus-chromecast-follow").prop("disabled", true);
			}
		});
		
		// Cast success/failure
		socket.on("cast success", function() {
			display = 0;
			chorus.nav.html(navMain);
			chorus.nav.find("#chorus-room-number").html(room);
		});     
		socket.on("cast failure", function() {
			alert("Cast failed, invalid or existing room: " + room);
			room = "ERR";
			chorus.nav.find("#chorus-cast").prop("disabled", false);
			chorus.nav.find("#chorus-follow").prop("disabled", false);
			chorus.nav.find("#chorus-chromecast-follow").prop("disabled", false);
			chromeCasting = false;
		});
		
		// Follow button
		chorus.nav.find("#chorus-nav").on("click", "#chorus-follow", function() {
			followPrompt();
		});
		
		function followPrompt() { // Used in Chromecast prompt, so made into function
			var roomPrompt = prompt((chromeCasting ? "Chromecast existing room?" : "Follow room?"));
			if (roomPrompt != null && roomPrompt.length > 0) {
				room = roomPrompt;
				socket.emit("follow", roomPrompt);
				chorus.nav.find("#chorus-cast").prop("disabled", true);
				chorus.nav.find("#chorus-follow").prop("disabled", true);
				chorus.nav.find("#chorus-chromecast-follow").prop("disabled", true);
				if (chromeCasting) sendMessage(); // TODO: For some reason, this can't be in Chorus.on("Follow success"). Not sure why, but this leads to some weird interactions.
			} else {
				chromeCasting = false;
			}
		}
		
		// Follow success/failure
		socket.on("follow success", function(data) {
			display = 0;
			chorus.nav.html(navMain);
			chorus.nav.find("#chorus-room-number").html(room);
			_data = data;
			chorus.render(data, true);
		});     
		socket.on("follow failure", function() {
			alert("Follow failed, invalid room: " + room);
			room = "ERR";
			chorus.nav.find("#chorus-cast").prop("disabled", false);
			chorus.nav.find("#chorus-follow").prop("disabled", false);
			chorus.nav.find("#chorus-chromecast-follow").prop("disabled", false)
		});

		// Display button
		chorus.nav.on("click", "#chorus-display", function() {
			display = 1 - display; // swap 1 to 0 and vice-versa
			if (!display) { // Swapping Aux -> Main
				socket.emit("get data")
				chorus.nav.html(navMain);
			} else {
				chorus.nav.html(navAux);
			}
			chorus.nav.find("#chorus-room-number").html(room);
		});
		
		// Push button
		chorus.nav.on("click", "#chorus-push", function() {
			if (!display) { // Pushing Main -> All
				socket.emit("push all", _data);
			} else { // Pushing Main -> All
				socket.emit("push main", _data);
			}
		});

		// Exit button
		chorus.nav.on("click", "#chorus-exit", function() {
			display = -1;
			chorus.nav.html(navNone);
			chorus.nav.find("#chorus-cast").prop("disabled", false);
			chorus.nav.find("#chorus-follow").prop("disabled", false);
			chorus.nav.find("#chorus-chromecast-follow").prop("disabled", false);
			socket.emit("exit", room);
		});
	});
}