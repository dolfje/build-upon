var createGame = require('voxel-engine')
var highlight = require('voxel-highlight')
var player = require('voxel-player')
var voxel = require('voxel')
var extend = require('extend')
var osmDrawer = require('./openstreetmap-drawer')
var osm = require('./openstreetmap')

module.exports = function() {

  // Setup game
  var game = createGame({
    generate: generator,
    chunkDistance: 2,
    materials: ['grass', 'brick'],
    materialFlatColor: false,
    worldOrigin: [0, 0, 0],
    controls: { discreteFire: true },
    texturePath: "images/"
  });
  game.appendTo(document.body)
  if (game.notCapable()) return game
  
  // for debugging
  window.world = game 

  // Player
  var createPlayer = player(game)
  var avatar = createPlayer('images/player.png')
  avatar.possess()
  avatar.yaw.position.set(0, 2, 0)
  avatar.toggle();

  // OSM
  var drawer = osmDrawer.Drawer(game, game.scene, avatar)
  setInterval(function() { //TODO: on move!
      drawer.updatePos();
  }, 1000);
  
  // highlight blocks when you look at them, hold <Ctrl> for block placement
  var blockPosPlace, blockPosErase
  var hl = game.highlighter = highlight(game, { 
    color: 0xff0000, 
    adjacentActive: function() {
      return true;
    }
  });
  hl.on('highlight', function (voxelPos) { blockPosErase = voxelPos })
  hl.on('remove', function (voxelPos) { blockPosErase = null })
  hl.on('highlight-adjacent', function (voxelPos) { blockPosPlace = voxelPos })
  hl.on('remove-adjacent', function (voxelPos) { blockPosPlace = null })

  // block interaction stuff, uses highlight data
  var currentMaterial = 2;
  game.on('fire', function (target, state) {
    if (blockPosPlace) {
      game.createBlock(blockPosPlace, currentMaterial);
      game.emit("addBlock", {x:blockPosPlace[0], y:blockPosPlace[1], z:blockPosPlace[2], type:currentMaterial});
    }
    else if(blockPosErase) {
      game.setBlock(blockPosErase, 0);
      game.emit("removeBlock", {x:blockPosErase[0], y:blockPosErase[1], z:blockPosErase[2]});
    }
  });
  
  game.player = avatar;
  return game
}

function generator(x,y,z) {
  return y <= 0 && y > -2 ? 1 : 0;
}


