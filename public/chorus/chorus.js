/* chorus.js
	Chorus client-side implementation
*/
if (typeof jQuery == 'undefined') {
	console.error("[Chorus] Error - jQuery is not loaded and is required. Chorus disabled.");
} else if (typeof io == 'undefined') {
	console.error("[Chorus] Error - Socket.io version >=2.0.1 is not loaded and is required. Chorus disabled.");
} else {
	/* getParameterByName(name, url=window.location.href)
		obtains value of GET param "name" from "url", which defaults to the current location
		returns null if does not exist or the parameter value
		[here to help get "chorusFollowRoom" parameter from URL]
	*/
	function getParameterByName(name, url=window.location.href) {
		name = name.replace(/[\[\]]/g, "\\$&");
		let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	/* debounce(func, wait, immediate)
		Underscore.js's debounce function, used to rate limit function
	*/
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	let chorusInitialized = false; // Only allow 1 instance of Chorus, otherwise funky stuff might happen

	/* Chorus({server, chromecast, namespace, hide})
		create instance of chorus, optionally supply server URL or set chromecast to true
		params:
			server: string, url of server hosting chorus, only needed if client is on different host
			chromecast (false): bool, default false, whether or not to include chromecast logic and nav buttons
			namespace (null): identifier for the type of chatroom, used to distinguish which command set to use
			hide: bool (false), hides nav on join, default false
			care: bool (true), whether it cares about the data store, so it receives calls as well as sends
			append: bool (false), append to body after initialization
	*/
	var Chorus = function(params={}) {
		/* Accessable:
			.data (current data store)
			.clone (bool, update based on value instead of reference)
			.socket (obj, socket.io instance)
			.display (int, none / main / detached)
			.room (string, room name)
			.nav (jQuery object, of #chorus-nav)
			..namespace (string or false, custom namespace)
			.chromecasts .cares, .hides (bool, parameters)
			.update(), render(), append()
		*/

		if (chorusInitialized) { // Prevent multiple instances of chorus
			console.error("[Chorus] Error - An instance of chorus is already running!");
			return;
		}
		chorusInitialized = true;

		// Chrous object variables
		this.clone = ('clone' in params) ? params.clone : false; // Update based on value instead of reference if true
		this.data = ('data' in params) ? (this.clone ? JSON.parse(JSON.stringify(params.data)) : params.data) : undefined; // Default data to initialization parameter
		this.socket = io(('server' in params) ? params.server : ''); // Create new socket given provided URL.
		this.display = -1; // Default display to none, 0 = detached from main, 1 = main
		this.room = "ERR"; // Default room to "ERR"
		this.nav = $("<nav id='chorus-nav'></nav>");
		this.chromecasts = ('chromecast' in params) ? params.chromecast : false;
		this.debounce = ('debounce' in params) ? params.debounce : 300;
		this.namespace = ('namespace' in params) ? params.namespace : false;
		this.cares = ('care' in params && !params.care) ? false : true;
		this.hides = ('hide' in params && params.hide) ? true : false;
		this.appended = false;

		// Chorus update functions

		/* chorus.update(data, clone=false)
			emits socket message to push to main display
			[this should be called by client whenever data is updated]
		*/
		this.update = debounce(function(data, clone=this.clone) { // chorus.update() returns 1 if pushed to main, 0 otherwise
			if (typeof data != 'undefined') { // Don't replace if undefined
				this.data = (typeof data == 'object' && clone) ? JSON.parse(JSON.stringify(data)) : data;
			}
			if (this.display == 0) { // This is a main display, so push to other main displays
				this.socket.emit("push main", this.data);
				return 1;
			}
			return 0;
		}, this.debounce)

		/* chorus.render()
			reports error, as this function should be overriden by client implementation
			chorus.render(obj data, boolean fresh) should be implemented by client to render the viz given data
		*/
		this.render = function() {
			console.log("[Chorus] Error - chorus.render() function should be implemented!");
		}

		/* chorus.append(obj="body")
			appends the chorus navigation to the desired HTML object, defaulting to body
			should only be done once -- errors otherwise
			returns 1 on success and 0 on fail
			e.g. chorus.append("div"), .append("#navigation"), .append("#sidebar"), etc.
		*/
		this.append = function(obj="body") {
			if (!this.appended) {
				if ($(obj).length) { // If object exists
					$(obj).append(this.nav);
					this.appended = true;
					console.log("[Chorus] Appended to: " + obj);
					return 1;
				} else {
					console.error("[Chorus] Error - Attempted to append chorus nav to DOM object (" + obj + ") which does not exist.")
				}
			} else {
				console.error("[Chorus] Error - Attempting to append chorus nav more than once.")
			}
			return 0;
		}

		if ('append' in params && params.append) {
			this.append();
		}

		/* chorus.command(command, data)
		  send a custom socket io command
		*/
		this.command = function(command, params) {
			if (this.namespace) {
				this.socket.emit("command", {command: command, params: params, namespace: this.namespace});
			} else {
				console.error("[Chorus] Error - attempted to use custom command without a set namespace.")
			}
		}

		// Chorus initialization and sockets

		let chorus = this; // Use this to refer to chorus instance from here on to make simpler for sockets, etc.
		$(function() { // Use JQuery to wait till rest of document loaded + IIFE, might be redundant
			// navNone: Default navbar with [Cast] and [Follow] buttons
			let castBtn = (chorus.cares) ? "<button id='chorus-cast'>Cast</button> " : "";
			let navNone = $("<div>"+castBtn+"<button id='chorus-follow'>Follow</button></div>");
			// chromeCasting: Set to true when attempting to cast to Chromecast
			let chromeCasting = false; // TODO: Check this logic across the board and see if redundant / consistent

			/* Chorus-Chromecast logic: initialize chromecast and set up buttons */
			if (chorus.cares && chorus.chromecasts && typeof(chrome) != 'undefined') {
				// Append cast button to nav
				navNone.append(" <button id='chorus-chromecast-follow' disabled='true'>Chromecast</button>");

				// Custom sender parameters
				let applicationID = '7FF6442F';
				let namespace = 'urn:x-cast:edu.ohio-state.cse.chorus';
				let session = null;

				/* Chrome cast sender API, from https://github.com/googlecast/CastHelloText-chrome */
				//if (!chrome.cast || !chrome.cast.isAvailable) { // Removing this b/c this seems to break sometimes and not properly initialize Chromecast
					setTimeout(initializeCastApi, 2000);
				//} else {
				//	console.log("[Chorus Chromecast] Available!");
				//}

				function initializeCastApi() {
					console.log("[Chorus Chromecast] Attempting initialization");
					let sessionRequest = new chrome.cast.SessionRequest(applicationID);
					let apiConfig = new chrome.cast.ApiConfig(sessionRequest,
						sessionListener,
						receiverListener);
					chrome.cast.initialize(apiConfig, onInitSuccess, onError);
				}

				function onInitSuccess() {
					console.log('[Chorus Chromecast] Initialization success');
					chorus.nav.find("#chorus-chromecast-follow").prop("disabled", false);
				}

				function onError(message) {
					console.log(`[Chorus Chromecast] Error - ${JSON.stringify(message)}`);
					alert(`[Chorus Chromecast] Failed to chromecast: (${message.code})`);
				}

				function onSuccess(message) {
					console.log('[Chorus Chromecast] Success: ' + message);
					alert("[Chorus Chromecast] Successfully casted!");
				}

				function onStopAppSuccess() {
					console.log('[Chorus Chromecast] Stopped Chromecast app');
				}

				function sessionListener(e) {
					console.log('[Chorus Chromecast] New session ID: ' + e.sessionId);
					session = e;
					session.addUpdateListener(sessionUpdateListener);
					session.addMessageListener(namespace, receiverMessage);
				}

				function sessionUpdateListener(isAlive) {
					var message = '[Chorus Chromecast] ' + isAlive ? 'Session Updated' : 'Session Removed';
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
						console.log('[Chorus Chromecast] Receiver found :)');
					} else {
						console.log('[Chorus Chromecast] Receiver list was empty :(');
					}
				}

				function sendMessage() {
					var message = {
						url: window.location.href,
						room: chorus.room
					};
					if (session !== null) { // If session exists, send new room & link to process.
						session.sendMessage(namespace, message, onSuccess.bind(this, 'Chorus cast sent to ' + message.url + " @ room: " + message.room), onError);
					} else {
						console.log("[Chorus Chromecast] Session requested with receiver..");
						chrome.cast.requestSession(function(e) {
							session = e;
							session.sendMessage(namespace, message, onSuccess.bind(this, 'Chorus cast sent to ' + message.url + " @ room: " + message.room), onError);
						}, onError);
					}
				}
			} else if (chorus.chromecasts) {
				if (!chorus.cares) {
					console.log("[Chorus] Chromecast integration was requested but care was set to false; non-caring clients cannot (chrome)cast.")
				} else {
					console.error("[Chorus] Chromecast integration was requested but cast sender API was not included.");
				}
				chorus.chromecasts = false;
			} else {
				chorus.chromecasts = false;
			}

			// Set up main and aux navigation button sets
			// Chorus will swap between these and navNone
			let detachAndPushToAllBtns = (chorus.cares) ? "<button id='chorus-display' value='main'>Detach</button> <button id='chorus-push' value='main'>Push to All</button></nav>" : "";
			let navMain = $(detachAndPushToAllBtns + " <button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></span></button>");
			let navAux = $("<button id='chorus-display' value='aux'>Return</button> <button id='chorus-push' value='main'>Push to Main</button></nav> <button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></button></span>");

			// Chorus follow, used for Chromecast receiver to access
			let followRoom = getParameterByName("chorusFollowRoom");

			// If GET chorusFollowRoom is specified, just go there
			if (followRoom) {
				chromeCasting = false;

				// Attempt follow
				chorus.socket.emit("follow", followRoom);
				console.log("[Chorus] Attempting follow: " + followRoom + " from URL parameter")

				// Simplify chorus-nav so it just has room #
				navMain = $("<button id='chorus-exit'><span id='chorus-room'>Room: <span id='chorus-room-number'></span></button>");
				// If followRoom is used, the client will be stuck in that room
				chorus.room = followRoom;
			}

			// Set nav to default with [Follow], [Close], and sometimes [Chromecast]
			chorus.nav.html(navNone);

			// Getting data for the first time or Aux -> Main
			if (chorus.cares) {
				chorus.socket.on("get data", function (data) {
					chorus.data = data;
					chorus.render(data, true);
				});

				// Render on push to main/all
				chorus.socket.on("push all", function (data) {
					chorus.data = data;
					chorus.render(data);
				});

				chorus.socket.on("push main", debounce(function (data) {
					if (!chorus.display) { // If on main
						chorus.data = data;
						chorus.render(data);
					}
				}, chorus.debounce));

				// Cast button
				chorus.nav.on("click", "#chorus-cast", function() {
					let roomPrompt = prompt("Create room?");
					if (roomPrompt != null && roomPrompt.length > 0) {
						chorus.room = roomPrompt;
						chorus.socket.emit("cast", { room: roomPrompt, data: chorus.data });
						chorus.nav.find("#chorus-cast").prop("disabled", true);
						chorus.nav.find("#chorus-follow").prop("disabled", true);
						chorus.nav.find("#chorus-chromecast-follow").prop("disabled", true);
					}
				});

				// Cast success/failure
				chorus.socket.on("cast success", function() {
					chorus.display = 0;
					chorus.nav.html(navMain);
					chorus.nav.find("#chorus-room-number").html(chorus.room);
					console.log("[Chorus] Cast success: " + chorus.room);
					if (chorus.hides) {
						chorus.nav.fadeOut(1000);
						console.log("[Chorus] Hiding nav");
					}
				});
				chorus.socket.on("cast failure", function() {
					alert("Cast failed, invalid or existing room: " + chorus.room);
					console.log("[Chorus] Cast failed, invalid or existing room: " + chorus.room);
					chorus.room = "ERR";
					chorus.nav.find("#chorus-cast").prop("disabled", false);
					chorus.nav.find("#chorus-follow").prop("disabled", false);
					chorus.nav.find("#chorus-chromecast-follow").prop("disabled", false);
				});

				/* Chorus - Chromecast sender logic */
				if (chorus.chromecasts) {
					chorus.nav.on("click", "#chorus-chromecast-follow", function () {
						chromeCasting = true;
						followPrompt();
					});
				}

				// Display button
				chorus.nav.on("click", "#chorus-display", function() {
					chorus.display = 1 - chorus.display; // swap 1 to 0 and vice-versa
					if (!chorus.display) { // Swapping Aux -> Main
						chorus.socket.emit("get data"); // Obtain main's data
						chorus.nav.html(navMain);
					} else { // Don't try to obtain any data
						chorus.nav.html(navAux);
					}
					chorus.nav.find("#chorus-room-number").html(chorus.room);
				});

				// Push button
				chorus.nav.on("click", "#chorus-push", function() {
					if (!chorus.display) { // Pushing Main -> All
						chorus.socket.emit("push all", chorus.data);
					} else { // Pushing Main -> All
						chorus.socket.emit("push main", chorus.data);
					}
				});
			}

			// Follow button
			chorus.nav.on("click", "#chorus-follow", function() {
				followPrompt();
			});

			// Prompt user for follow and send socket on valid completion
			function followPrompt() { // Used in Chromecast prompt, so made into function
				let roomPrompt = prompt((chromeCasting ? "Chromecast existing room?" : "Follow room?"));
				if (roomPrompt != null && roomPrompt.length > 0) {
					chorus.room = roomPrompt;
					chorus.socket.emit("follow", roomPrompt);
					// Disable all buttons so user doesn't enter a new room
					chorus.nav.find("#chorus-cast").prop("disabled", true);
					chorus.nav.find("#chorus-follow").prop("disabled", true);
					chorus.nav.find("#chorus-chromecast-follow").prop("disabled", true);
					console.log("[Chorus] Attempting follow: " + chorus.room);
					if (chorus.chromecast && chromeCasting) {
						sendMessage();
						chromeCasting = false;
					}
				} else {
					chromeCasting = false;
				}
			}

			// Follow success/failure
			chorus.socket.on("follow success", function(data) {
				if (chorus.cares) {
					chorus.data = data; // Replace data
					chorus.render(data, true); // Re-render display from data
				}
				chorus.display = 0; // Set display to main
				chorus.nav.html(navMain); // Change navbar to main
				chorus.nav.find("#chorus-room-number").html(chorus.room); // Replace room # with proper #
				console.log("[Chorus] Follow success: " + chorus.room);
				if (chorus.hides) {
					chorus.nav.fadeOut(1000);
					console.log("[Chorus] Hiding nav");
				}
			});
			chorus.socket.on("follow failure", function() {
				alert("Follow failed, invalid room: " + chorus.room);
				chorus.room = "ERR";
				// Re-enable all buttons (which were disabled during the follow)
				chorus.nav.find("#chorus-cast").prop("disabled", false);
				chorus.nav.find("#chorus-follow").prop("disabled", false);
				chorus.nav.find("#chorus-chromecast-follow").prop("disabled", false);
				console.log("[Chorus] Follow failed, invalid room: " + followRoom);
				chromeCasting = false;
			});

			// Exit button
			chorus.nav.on("click", "#chorus-exit", function() {
				chorus.display = -1;
				// Swap to navNone
				chorus.nav.html(navNone);
				// Re-enable all buttons
				chorus.nav.find("#chorus-cast").prop("disabled", false);
				chorus.nav.find("#chorus-follow").prop("disabled", false);
				chorus.nav.find("#chorus-chromecast-follow").prop("disabled", false);
				chorus.socket.emit("exit", chorus.room);
			});
		});
		console.log("[Chorus] Initialized" + (('server' in params) ? ` at: ${params.server}` : ""));
	};

}
