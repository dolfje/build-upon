"use strict";

class Vector {
	constructor(x, y, z) {
		this.set(x, y, z);
	}

	set(x, y, z) {
		if (x instanceof Object) {
			var vector = x;
			this.set(vector.x, vector.y, vector.z);
		} else {
			this.x = x;
			this.y = y;
			this.z = z;
		}
	}

	toString() {
		return this.x + ':' + this.y + ':' + this.z;
	}

	valid() {
		return this.x !== undefined && this.y !== undefined && this.z !== undefined;
	}

	plane() {
		return [this.x, this.y];
	}

	static empty() {
		return new Vector;
	}
}

module.exports = {
	Vector: Vector
};