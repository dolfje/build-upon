var world = require('./world')();
var inherits = require('inherits');
var events = require('events');

module.exports = Game;

function Game() {
  if (!(this instanceof Game)) return new Game();
  var self = this;
  
  world.on("addBlock", function(data) {
    self.emit("addBlock", data)
  });
  
  world.on("removeBlock", function(data) {
    self.emit("removeBlock", data);
  });
}

Game.prototype.addBlock = function(x,y,z,type) {
  world.createBlock([x,y,z], type);
  this.emit("addBlock", {x:x,y:y,z:z,type:type});
}

Game.prototype.removeBlock = function(x,y,z) {
  world.setBlock([x,y,z], 0);
  this.emit("removeBlock", {x:x,y:y,z:z});
}

Game.prototype.setLatLng = function(lat, lng) {
  return this.setPos(
    Math.round((((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,16)))*256*2.387),
    1,
    Math.round((((lng+180)/360*Math.pow(2,16)))*256*2.387)
  );      
};
    
Game.prototype.setPos = function(x,y,z) { 
  world.player.moveTo(x, y, z);  
  this.emit("posChange", {x:x,y:y,z:z});    
};

Game.prototype.setWatching = function(a,b,g) {
  
};

inherits(Game, events.EventEmitter)


