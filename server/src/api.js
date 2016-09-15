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

		this.httpServer.post('/api/blocks', (request, response) => {
            var count = 0;

            var getEntities = [];
            for (var i = 0; i < request.body.length; i++) {
                var block = Block.fromJson(request.body[i]);
                getEntities.push(this.database.getEntity(block.pos));
            }

            Promise.all(getEntities).then((a) => {

                var saveEntities = [];
                for (var i = 0; i < request.body.length; i++) {
                    if (a[i])
                        continue

                    var block = Block.fromJson(request.body[i]);
                    saveEntities.push(this.database.saveEntity(block));
                }

                Promise.all(saveEntities).then((a) => {
                    console.log("added "+saveEntities.length+" blocks")
                    response.json({
                        ok: true,
                        count: saveEntities.length
                    });
                });
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

		this.httpServer.get('/api/entities/delete',(request, response) => {
			this.database.clear('entities');
			response.json(true);
		});
	}
}

module.exports = Api;
