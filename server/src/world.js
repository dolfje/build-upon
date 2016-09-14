"use strict";

var math = require('./math'),

	colors = require('colors'),

	fs = require('fs'),

	config = require('./../config'),

	Database = require('./database');

class Entity {
	constructor(name, pos) {
		this.name = name;
		this.pos = pos;
	}

	static fromJson(name, json) {
		var entity = eval('new ' + name + '()');

		entity = Object.assign(entity, json);
		entity.pos = new math.Vector(entity.pos);

		return entity;
	}

	set pos(vec) {
		if (!(vec instanceof math.Vector)) {
			vec = new math.Vector(vec);
		}
		this.coords = vec;

		// Store a plane for indexed lookup.
		this.plane = vec.plane();
	}

	get pos() {
		return this.coords;
	}
}

class Block extends Entity {
	constructor(pos, type, owner) {
		super('Block', pos);
		this.type = type;

		if (owner) {
			this.owner_id = owner.id;
		} else {
			// Indicate that the block is a system block, doesn't belong to anyone.
			this.system_block = true;
		}
	}
}

class World {
	constructor(clients) {
		// Clients wandering this world
		this.clients = clients;

		// Create database.
		this.database = new Database;
		this.database.migrate();
	}

	getEntity(vec) {
		return this.database.getEntity(vec);
	}

	addEntity(entity) {
		return this.database.saveEntity(entity);
	}

	removeEntity(vec) {
		return this.database.removeEntity(vec);
	}

	entitiesAroundClient(client, fn) {
		var radius = config.entity_user_radius;

		this.database.getEntities(client.pos, radius, function (entities) {
			fn(entities);
		});
	}

	handleBlock(action, data) {
		var pos = new math.Vector(data.pos);

		if (!pos.valid()) {
			console.log(colors.red('Invalid block position'), data);
			return;
		}

		this.getEntity(pos).then((block) => {
			block = block ? Block.fromJson('Block', block) : null;

			switch (action) {

				// When a block is created.
				case 'create':
					if (!block) {
						block = new Block(pos, data.type, data.client);

						this.addEntity(block);

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
		});
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
				this.entitiesAroundClient(payload.client, function (entities) {
					payload.client.send('me.entitiesAroundLocation', entities);
				});

				break;

		}
	}
}

module.exports = {
	World: World,
	Block: Block
};