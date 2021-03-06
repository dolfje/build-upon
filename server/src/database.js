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
		this.dbState().then((db) => {
			var entitiesCollection = db.collection('entities');

			// Add unique index for pos.
			entitiesCollection.ensureIndex({
				pos: 1
			}, {unique: true}, function (err, result) {
				// ensureIndex should check if the index is already set, if not the case, err code is 11000, exclude anyways
				if (err && err.code !== 11000) {
					console.log(colors.red('Failed to set unique index for pos'), err);
				}
			});
		});
	}

	dbState() {
		return new Promise((resolve, reject) => {
			if (!this.connected) {
				MongoClient.connect(config.mongo_db, (err, db) => {
					if (!err) {
						this.db = db;
                        this.connected = true;
						resolve(db);
					} else {
						console.log(colors.red('Failed to connect to DB'), err);
						reject();
					}
				});
			} else {
				resolve(this.db);
			}
		});
	}

	save(collection, object) {
		return new Promise((resolve, reject) => {
			this.dbState().then((db) => {
				db.collection(collection).insertOne(object, (err, result) => {
					if (err) {
						console.log(colors.red('Failed to save to DB'), err);
						reject();
					} else {
						resolve(result);
					}
				});
			});
		});
	}

	saveEntity(entity) {
		return this.save('entities', entity);
	}

	getEntity(vec) {
		return new Promise((resolve, reject) => {
			this.dbState().then((db) => {
				db.collection('entities').findOne({
					pos: vec
				}, function (err, result) {
					if (!err) {
						resolve(result);
					} else {
						console.log(colors.red('Failed to get from DB'), err);
						reject();
					}
				});
			});
		});
	}

	entitiesCounts() {
		return new Promise((resolve, reject) => {
			this.dbState().then((db) => {
				db.collection('entities').aggregate([
       				{$group: {'_id': '$name', 'count': {$sum: 1}}}
     			]).toArray(function (err, result) {
     				if (!err) {
     					resolve(result);
     				}
     			});
			});
		});
	}

	getEntities(vec, radius) {
		return new Promise((resolve, reject) => {
			this.dbState().then((db) => {
				var constraint = {
					'pos.x': {$lt: vec.x + radius, $gt: vec.x - radius},
					'pos.z': {$lt: vec.z + radius, $gt: vec.z - radius},
					//'pos.y': {$lt: vec.y + radius, $gt: vec.y - radius},

					// Do not put a height constraint (yet)
					// 'pos.z': {$lt: vec.z + radius, $gt: vec.z - radius}
				};

				var entities = db.collection('entities').find(constraint);

				entities.toArray(function (err, entities) {
					if (!err) {
						resolve(entities);
					} else {
						console.log(colors.red('Failed to get all from DB'), err);
						reject();
					}
				});
			});
		});
	}

	removeEntity(vec) {
		return new Promise((resolve, reject) => {
			this.dbState(function (db) {
				db.collection('entities').deleteOne({
					pos: vec
				}, function (err) {
					if (err) {
						console.log(colors.red('Failed to delete from DB'), err);
						reject();
					} else {
						resolve();
					}
				});
			});
		});
	}

	clear(collection) {
		this.dbState().then((db) => {
			db.collection(collection).remove({});
		});
	}
}

module.exports = Database;
