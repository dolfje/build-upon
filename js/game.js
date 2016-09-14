var world = require('./world')();
var users = require('./users');
var inherits = require('inherits');
var events = require('events');
var aabb = require('aabb-3d');

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
  var position = {x:0,y:0,z:0};
  var updatePos = false;
  world.spatial.on("position", box, function(data) { 
    if (data[0] != position.x || data[1] != position.y || data[2] != position.x) {
        position = {x:data[0], y:data[1], z:data[2]};
        updatePos = true;
    }
  });
  setInterval(function() {
    if (updatePos) {
      var x = self.offset.x+position.x;
      var y = self.offset.y+position.y;
      var z = self.offset.z+position.z;
      if (self.needReset(x, y, z)) {
          self.resetWorld(x, y, z);
          x = self.offset.x+position.x;
          y = self.offset.y+position.y;
          z = self.offset.z+position.z;
      }

      self.emit("posChange", {x: x, y: y, z: z});
      updatePos = false;
      self.world.osmDrawer.updatePos();
    }
  }, 1000);

  this.on('offsetChanged', function(offset) {
    self.world.osmDrawer.updateOffset(offset.x, offset.y, offset.z);
  });
}

inherits(Game, events.EventEmitter)

Game.prototype.addBlock = function(x,y,z,type) {
  var self = this;
  this.addBlockInner(x,y,z,type);
  this.emit("addBlock", {x:x,y:y,z:z,type:type});
};

Game.prototype.addBlockInner = function(x,y,z,type) {
  var self = this;
  world.createBlock([x-self.offset.x,y-self.offset.y,z-self.offset.z], type);
};

Game.prototype.removeBlock = function(x,y,z) {
  var self = this;
  world.setBlock([x-self.offset.x,y-self.offset.y,z-self.offset.z], 0);
  this.emit("removeBlock", {x:x,y:y,z:z});
};

Game.prototype.setLatLng = function(lat, lng) {
  return this.setPos(
    Math.round((((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,16)))*256*2.387),
    1,
    Math.round((((lng+180)/360*Math.pow(2,16)))*256*2.387)
  );      
};

Game.prototype.needReset = function(x, y, z) {
  return Math.abs(x-this.offset.x) > 1000 || Math.abs(y-this.offset.y) > 1000;
};

Game.prototype.resetWorld = function(x, y, z) {
  // Remove the world and rebuild at 0,0,0
  world.voxels.chunks = [];
  world.voxels.requestMissingChunks(world.worldOrigin);
  world.loadPendingChunks(world.pendingChunks.length);
  this.offset = {x:x, y:1, z:z};
  this.emit("offsetChanged", this.offset);
  world.player.moveTo(0,1,0);
}
    
Game.prototype.setPos = function(x,y,z) {
  var self = this;
  if(this.needReset(x, y, z)) {
      this.resetWorld(x, y, z);
      return;
  }

  world.player.moveTo(x-self.offset.x, y-self.offset.y, z-self.offset.z);  
};

Game.prototype.setOrientation = function(a,b,g) {
  
};


module.exports = Game;

