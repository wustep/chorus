/* server.js
	Chorus server-sided implementation
	start express server to host server sockets and serve client-sided library, receiver, etc.
*/

require('dotenv').config();

const express = require('express');
const http = require('http');
const sockets = require('./sockets');

const app = module.exports = express(); // Export express app for use elsewhere
const server = http.createServer(app);

// Serve files from env CLIENT
if (process.env.CLIENT) {
	let folder = __dirname + "/../" + process.env.CLIENT;
	app.use(express.static(folder));
	console.log("Serving files from: " + folder);
}

// Serve error page on 404
app.use(function (req, res, next) {
	res.status(404).send("404 Page Not Found")
	console.log("[Error] 404 at: " + req.url);
});

// Have express listen to env PORT
server.listen((process.env.PORT || 3000), () => {
	console.log(`Server listening on port ${process.env.PORT}`);
});

// Attach chorus sockets to server
sockets.start(server);