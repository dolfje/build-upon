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
  game.osmDrawer = drawer;

  setHighlighter(game);
  
  game.player = avatar;
  return game
}

function generator(x,y,z) {
  return y <= 0 && y > -2 ? 1 : 0;
}

function setHighlighter(game) {
  // highlight blocks when you look at them, hold <Ctrl> for block placement
  var block;
  var removeBlock = false;
  var hl = game.highlighter = highlight(game, { 
    color: 0xff0000, 
    adjacentActive: function() {
      return !removeBlock;
    }
  });
  hl.on('highlight', function (voxelPos) { block = voxelPos; removeBlock = true });
  hl.on('remove', function (voxelPos) { block = null });
  hl.on('highlight-adjacent', function (voxelPos) { block = voxelPos; removeBlock = false });
  hl.on('remove-adjacent', function (voxelPos) { block = null });

  // block interaction stuff, uses highlight data
  game.on('fire', function (target, state) {
    if(block) {
      game.emit("click", block[0], block[1], block[2]);
    }
  });
  
  game.getHighlightMode = function() {
    return removeBlock ? "remove" : "add";
  }
  
  game.setHighlightMode = function(mode) {
    if(mode == "remove") {
      removeBlock = true;
    }
    else {
      removeBlock = false;
    }
  }
}


