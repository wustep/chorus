require('dotenv').config();

const express = require('express');
const http = require('http');
const sockets = require('./sockets');

const app = module.exports = express(); // Export express app for use elsewhere
const server = http.createServer(app);

// Serve files from env CLIENT
if (process.env.client) {
	app.use(express.static(__dirname + "/../" + process.env.client)); 
}

// Serve error page on 404
app.use(function (req, res, next) {
	res.status(404).send("404 - Sorry can't find that!")
});

// Have express listen to env PORT
server.listen((process.env.PORT || 3000), () => {
	console.log(`Server listening on port ${process.env.PORT}`);
});

sockets.start(server);