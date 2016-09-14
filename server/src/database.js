"use strict";

var MongoClient = require('mongodb').MongoClient,

	config = require('./../config'),

	colors = require('colors');

class Database {
	constructor() {
		this.name = '';
		this.connected = false;
		this.db = null;
	}

	migrate() {
		this.dbState(function (db) {
			var entitiesCollection = db.collection('entities');

			entitiesCollection.ensureIndex({
				plane: '2d'
			}, null, function (err, result) {
				if (err) {
					console.log(colors.red('Failed to set index for plane: 2d'));
				}
			});
		});
	}

	dbState(fn) {
		if (!this.connected) {
			MongoClient.connect(config.mongo_db, (err, db) => {
				if (!err) {
					this.db = db;
					fn(db);
				} else {
					console.log(colors.red('Failed to connect to DB'), err);
				}
			});
		} else {
			fn(this.db);
		}
	}

	save(collection, object) {
		this.dbState(function (db) {
			db.collection(collection).insertOne(object, function (err, rs) {
				if (err) {
					console.log(colors.red('Failed to save to DB'), err);
				}
			});
		});
	}

	saveEntity(entity) {
		this.save('entities', entity);
	}

	getEntity(vec, fn) {
		this.dbState(function (db) {
			db.collection('entities').findOne({
				coords: vec
			}, function (err, result) {
				if (!err) {
					fn(result);
				} else {
					console.log(colors.red('Failed to get from DB'), err);
				}
			});
		});
	}

	getEntities(vec, radius, fn) {
		this.dbState(function (db) {
			var entities = db.collection('entities').find({
				plane: {
					$geoWithin: {
						$center: [vec.plane(), radius]
					}
				}
			});

			entities.toArray(function (err, entities) {
				if (!err) {
					fn(entities);
				} else {
					console.log(colors.red('Failed to get all from DB'), err);
				}
			});
		});
	}

	removeEntity(vec) {
		this.dbState(function (db) {
			db.collection('entities').deleteOne({
				pos: vec
			}, function (err) {
				if (err) {
					console.log(colors.red('Failed to delete from DB'), err);
				}
			});
		});
	}
}

module.exports = Database;