require('dotenv').config();

const express = require('express');
const http = require('http');
const port = process.env.PORT || 3000;
var app = module.exports = express(); // Export express app for use elsewhere
var sockets = require('./sockets');

var server = http.createServer(app);

app.use(express.static(__dirname + "/../" + process.env.client));
app.use("/client", express.static(__dirname + "/../client/"));

app.use(function (req, res, next) {
	res.status(404).send("404 - Sorry can't find that!")
})

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

sockets.start(server);