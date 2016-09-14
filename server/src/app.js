var config = require('./../config'),

	websocket = require('nodejs-websocket'),
	express = require('express'),

	socketHandler = require('./handler'),
	socketServer = null,

	httpServer = null;

function runSocketServer() {
	var port = config.socket_port,

		handler = socketHandler.create();

	socketServer = websocket.createServer(function (conn) {
		// Client connected :)
		handler.onConnect(conn);

		// Client disconnected :(
		conn.on("close", function (code, reason) {
			handler.onDisconnect(conn);
		});

		// Client sends message to the server
		conn.on("text", function (str) {
			handler.onIncomingText(conn, str);
		});
	});

	socketServer.listen(port);

	console.log('Running websocket server on port ' + port);
}

function runHttpServer() {
	var port = config.http_port;

	httpServer = express(); 
	httpServer.use(express.static('client'));
	httpServer.listen(port);

	console.log('Running http server on port ' + port);
}

function run () {
	runSocketServer();
	runHttpServer();
}

module.exports = {
	run: run,
	socketServer: socketServer,
	httpServer: httpServer
};