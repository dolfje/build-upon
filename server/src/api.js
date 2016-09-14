"use strict";

var Database = require('./database'),

	Block = require('./entities/block');

class Api {
	constructor(httpServer) {
		this.httpServer = httpServer;
		this.database = new Database;
	}

	setupRoutes() {
		this.httpServer.post('/api/block', (request, response) => {
			var block = Block.fromJson(request.body);

			this.database.getEntity(block.pos).then((found) => {
				if (!found) {
					this.database.saveEntity(block).then((state) => {
						response.json({
							ok: !!state.insertedCount
						});
					});
				} else {
					response.json({
						ok: false,
						reason: 'duplicate'
					});
				}
			});
		});

		this.httpServer.get('/api/entities', (request, response) => {
			this.database.entitiesCounts().then(function (counts) {
				response.json(counts);
			});
		});

		this.httpServer.delete('/api/entities',(request, response) => {
			this.database.clear('entities');
			response.json(true);
		});
	}
}

module.exports = Api;