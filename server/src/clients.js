"use strict";

var math = require('./math'),

	colors = require('colors');

class Connection {
	constructor(conn) {
		this.conn = conn;
	}

	send(cmd, data) {
		if (!data) {
			console.log(colors.red('Tried to send a message to the client with empty message...'));
			return;
		}

		this.conn.send(JSON.stringify({
			cmd: cmd,
			data: data
		}));
	}
}

class Client extends Connection {
	constructor(conn) {
		super(conn);
		this.id = null;
		this.pos = new math.Vector;
		this.angle = 0;
	}

	updatePosition(vector) {
		this.pos.set(vector);
	}

	updateAngle(angle) {
		this.angle = angle;
	}

	setId(id) {
		this.id = id;
	}
}

class Clients {
	constructor() {
		this.map = new Map;
	}

	add(conn) {
		var client = new Client(conn);
		this.map.set(conn, client);
		return client;
	}

	remove(conn) {
		var client = this.get(conn);
		this.map.delete(conn);
		return client;
	}

	get(conn) {
		return this.map.get(conn);
	}

	eachExceptClient(except, fn) {
		this.map.forEach(function (client, conn) {
			if (conn !== except.conn) {
				fn(client);
			}
		});
	}
}

module.exports = Clients;