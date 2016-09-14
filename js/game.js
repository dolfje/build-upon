var world = require('./world')();
var users = require('./users');
var inherits = require('inherits');
var events = require('events');
var aabb = require('aabb-3d');

module.exports = Game;

function Game() {
  if (!(this instanceof Game)) return new Game();
  var self = this;
  this.users = users(this);
  this.world = world;
  this.offset = {x:0, y:0, z:0};
  
  world.on("click", function(x,y,z) { 
    if(world.getHighlightMode() == "add") {
      self.addBlock(self.offset.x+x,self.offset.y+y,self.offset.z+z, 2);
    } else {
      self.removeBlock(self.offset.x+x,self.offset.y+y,self.offset.z+z);
    }
  });
  
  // Create posChange events
  var box = aabb([-Infinity, -Infinity, -Infinity], [Infinity, Infinity, Infinity]);
  var position;
  world.spatial.on("position", box, function(data) { 
    position = {x:data[0], y:data[1], z:data[2]};
  });
  setInterval(function() {
    if(position) {
      self.emit("posChange", {x: self.offset.x+position.x, y: self.offset.y+position.y, z: self.offset.z+position.z});
      position = false;
    }
  }, 1000);
}

Game.prototype.addBlock = function(x,y,z,type) {
  var self = this;
  world.createBlock([x-self.offset.x,y-self.offset.y,z-self.offset.z], type);
  this.emit("addBlock", {x:x,y:y,z:z,type:type});
}

Game.prototype.removeBlock = function(x,y,z) {
  var self = this;
  world.setBlock([x-self.offset.x,y-self.offset.y,z-self.offset.z], 0);
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
  var self = this;
  if(Math.abs(x-self.offset.x) > 1000 || Math.abs(y-self.offset.y) > 1000) {
    
    // Remove the world and rebuild at 0,0,0
    world.voxels.chunks = [];
    world.voxels.requestMissingChunks(world.worldOrigin)
    world.loadPendingChunks(world.pendingChunks.length)
    self.offset = {x:x, y:1, z:z};
    game.emit("offsetChanged", self.offset);
    world.player.moveTo(0,1,0);
  }
  else {
    world.player.moveTo(x-self.offset.x, y-self.offset.y, z-self.offset.z);  
  }
};

Game.prototype.setOrientation = function(a,b,g) {
  
};

inherits(Game, events.EventEmitter)


