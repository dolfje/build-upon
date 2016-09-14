"use strict";

var Entity = require('./entity');

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

module.exports = Block;