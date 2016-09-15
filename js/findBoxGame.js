module.exports = function(game) {
   var currentBlock;
   var inventory = [0,0];
   
   var createFindBlock = function() {
     var rand = function(min, max) {
       return Math.round(Math.random()*(max-min)+min);
     }
     
     var pos = game.getPos();
     currentBlock = {x: Math.round(pos.x)+rand(0,25), y:1, z:Math.round(pos.z)+rand(0,25)};
     game.addBlock(currentBlock.x, currentBlock.y, currentBlock.z, 2);
   }
   
   var blockFound = function() {
     inventory[1] += 10;
     createFindBlock();
     console.log("inventory changed", inventory);
   }
   
   game.on("offsetChanged", function() {
     createFindBlock();
   });
   
   game.on("click", function(x,y,z) { console.log(x,y,z,currentBlock);
     if(x == currentBlock.x && y == currentBlock.y && z == currentBlock.z) {
       blockFound();
     } else if(game.world.getHighlightMode() == "add") {
       if(!inventory[1]) {
         throw "PREVENT ADD BLOCK";
       } else {
         inventory[1]--;
         console.log("inventory changed", inventory);
       }
     } else if(game.world.getHighlightMode() == "remove") {
       inventory[1]++;
       console.log("inventory changed", inventory);
     }
   });
   
   createFindBlock();
}

