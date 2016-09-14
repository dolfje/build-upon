"use strict";

var math = require('./../math'),

	Block = require('./block');

class Entity {
	constructor(name, pos) {
		this.name = name;

		if (!(pos instanceof math.Vector)) {
			pos = new math.Vector(pos);
		}
		this.pos = pos;
	}

	static fromJson(json) {
		var entity = new this;

		entity = Object.assign(entity, json);
		entity.pos = new math.Vector(entity.pos);

		return entity;
	}
}

module.exports = Entity;