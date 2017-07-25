if (typeof jQuery == 'undefined') { // TODO: Add versions here
	console.error("jQuery is not loaded and is required for Chorus!");
} else if (typeof io == 'undefined') {
	console.error("Socket.io is not loaded and is required for Chorus!");
} else if (typeof _chorusConfig == 'undefined') {
	console.error("_chorusConfig is not defined and is required for Chorus! Check Chorus documentation for more details.")
} else {
	$(function() {
		if (_chorusConfig.display !== 0 && _chorusConfig.display !== 1) {
			_chorusConfig.display = 0; // Default display to main if not specified
		}
		
		var socket = io();
		if (_chorusConfig.nav) { // If set, create nav bar
			var nav = $("<nav id='chorus-nav'></nav>");
			$("body").append(nav);
			if (!_chorusConfig.display) { // main display
				if (_chorusConfig.displayBtn) {
					nav.append("<button id='chorus-display' class='chorus-display-main' value='main'>Main Display</button>"); 
				}
				if (_chorusConfig.pushBtn) {
					nav.append("<button id='chorus-push' value='all'>Push to All</button></nav>");
				}
			} else { // secondary
				if (_chorusConfig.displayBtn) {
					nav.append("<button id='chorus-display' class='chorus-display-aux' value='aux'>Auxillary Display</button>");
				}
				if (_chorusConfig.pushBtn) {
					nav.append("<button id='chorus-push' value='main'>Push to Main</button></nav>");
				}
			}
			
			$("#chorus-display").on("click", function() {
				_chorusConfig.display = 1 - _chorusConfig.display; // swap 1 to 0 and vice-versa
				if (!_chorusConfig.display) {
					$(this).html("Main Display");
					$(this).attr("value", "main");
					if (_chorusConfig.pushBtn)
						$("#chorus-push").html("Push to All").attr("value", "all");
					
				} else {
					$(this).html("Auxillary Display");
					$(this).attr("value", "aux");
					if (_chorusConfig.pushBtn)
						$("#chorus-push").html("Push to Main").attr("value", "main");
				}
				$(this).toggleClass('chorus-display-main chorus-display-aux');
			});
		}
	});
}