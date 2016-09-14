"use strict";

var math = require('./math'),

	colors = require('colors'),

	fs = require('fs'),

	config = require('./../config');

class Entity {
	constructor(name, pos) {
		this.name = name;
		this.pos = pos;
	}
}

class Block extends Entity {
	constructor(pos, type, owner) {
		super('Block', pos);
		this.type = type;
		this.owner = owner.id;
	}
}

class World {
	constructor(clients) {
		this.name = config.world_name;

		process.argv.forEach((part) => {
			var split = part.split('=');
			if (split.length > 1 && split[0] === 'world') {
				this.name = split[1];
			}
		});

		console.log('World: ' + this.name);

		// Each object is keyed with a vector
		this.entities = new Map;

		// Clients wandering this world
		this.clients = clients;

		this.load();
	}

	getEntity(vec) {
		// Using smth primitive for coord lookup
		return this.entities.get(vec.toString());
	}

	addEntity(vec, entity) {
		this.entities.set(vec.toString(), entity);
		this.save();
	}

	removeEntity(vec) {
		this.entities.delete(vec.toString());
		this.save();
	}

	save() {
		var entities = Array.from(this.entities.entries());
			
		var data = {
			entities: entities
		};

		fs.writeFile('data/' + this.name, JSON.stringify(data), function (err) {
			if (err) {
				console.log(colors.red('Failed to save world'), err);
			}
		});
	}

	load() {
		fs.readFile('data/' + this.name, 'utf8', (err, data) => {
			if (!err) {
				var parsed = JSON.parse(data);

				// Import entities.
				for (var i = 0; i < parsed.entities.length; i++) {
					this.entities.set(parsed.entities[i][0], parsed.entities[i][1]);
				}
			}
		});
	}

	entitiesAroundPos(vec) {
		// TODO: Actually calculate around pos, for now, return all...
		var entities = [];
		for (var entity of this.entities.values()) {
			entities.push(entity);
		}
		return entities;
	}

	handleBlock(action, data) {
		var pos = new math.Vector(data.pos);

		if (!pos.valid()) {
			console.log(colors.red('Invalid block position'), data);
			return;
		}

		// If a block is already on this position, it'll be in here.
		var block = this.getEntity(pos);

		switch (action) {

			// When a block is created.
			case 'create':
				if (!block) {
					block = new Block(pos, data.type, data.client);

					this.addEntity(pos, block);

					console.log(colors.cyan('Added entity (Block)', block.pos, block.type));

					this.clients.eachExceptClient(data.client, function (client) {
						client.send('world.entityUpdated', block);
					});
				} else {
					console.log(colors.yellow('Tried to add a block on a non empty location', block.pos.toString()));
				}
				break;

			// When a block is deleted.
			case 'delete':
				if (block) {
					this.removeEntity(pos);

					console.log(colors.cyan('Entity (Block) removed', block.pos));

					this.clients.eachExceptClient(data.client, function (client) {
						client.send('world.entityDeleted', block);
					});
				} else {
					console.log(colors.yellow('Tried to remove an unexisting block on', block.pos.toString()));
				}
				break;
		}
	}

	handleClient(action, payload) {
		switch (action) {

			// When a client disconnects.
			case 'disconnected':
				this.clients.eachExceptClient(payload.client, function (client) {
					client.send('client.disconnected', client.id);
				});
				break;

			// When a client sets his id.
			case 'setName':
				payload.client.setId(payload.data);
				console.log('Client (' + payload.client.conn.key + ') identified as ' + payload.client.id);

				// Let the other users know of this player' existance.
				this.clients.eachExceptClient(payload.client, function (client) {
					client.send('client.connected', client.id);
				});

				break;
				
			// When a user updates his position.
			case 'updatePosition':
				var pos = new math.Vector(payload.data.pos);

				payload.client.updatePosition(pos);

				var angle = new math.Vector(payload.data.angle);

				payload.client.updateAngle(angle);

				// Send to all other connected clients that the client moved position.
				this.clients.eachExceptClient(payload.client, function (client) {
					client.send('client.positionUpdated', {
						client: payload.client.id,
						pos: pos,
						angle: angle
					});
				});

				// Send back to the client the latest entities around him.
				var entities = this.entitiesAroundPos(payload.client.pos);
				payload.client.send('me.entitiesAroundLocation', entities);

				break;

		}
	}
}

module.exports = World;