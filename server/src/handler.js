"use strict";

var Clients = require('./clients'),

	World = require('./world').World,

	colors = require('colors');

class Handler {
	constructor() {
		this.clients = new Clients;
		this.world = new World(this.clients);
	}

	onConnect(conn) {
		var client = this.clients.add(conn);
		console.log(colors.green('Client connected (' + conn.key + ')'));

		// Postpone broadcasting the client until a name is set.
	}

	onDisconnect(conn) {
		var client = this.clients.remove(conn);
		console.log(colors.red('Client disconnected (' + conn.key + ')'));

		this.world.handleClient('disconnected', {
			client: client
		});
	}

	onIncomingText(conn, str) {
		var payload = JSON.parse(str),
			client = this.clients.get(conn);

		var executor = payload.cmd.split(/\.(.+)?/),
			type = executor[0],
			method = executor[1];

		switch (type) {
			case 'me':
				this.world.handleClient(method, {
					client: client,
					data: payload.data
				});
				break;

			case 'block':
				if (!client.id) {
					console.log(colors.red('Block interaction failed, did you forget "setName"?'));
					return;
				}

				this.world.handleBlock(method, {
					client: client,
					pos: payload.data.pos,
					type: payload.data.type
				});
				break;
		}
	}
}

module.exports = {
	create: function () {
		return new Handler;
	}
};