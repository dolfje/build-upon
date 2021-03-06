module.exports = function(game) {
  
  var endpoint = "localhost:1337";
  var connection = new WebSocket('ws://'+endpoint+'/');

  game.on("addBlock", function(info) { 
    connection.send(JSON.stringify({
      cmd: "block.create",
      data: {pos: {x:info.x, y:info.y, z:info.z}, type:info.type},
    }));
  });
  
  game.on("removeBlock", function(info) { 
    connection.send(JSON.stringify({
      cmd: "block.delete",
      data: {pos: {x:info.x, y:info.y, z:info.z}, type:info.type},
    }));
  });
  
  game.on("posChange", function(pos) { 
    connection.send(JSON.stringify({
      cmd: "me.updatePosition",
      data: {pos: pos, angle: 0},
    }));
  });

  game.on("getBlocks", function(pos, radius) {
    connection.send(JSON.stringify({
      cmd: "me.getBlocks",
      data: {pos: pos, radius: radius },
    }));
  });
  
  connection.onopen = function () { 
    connection.send(JSON.stringify({
      cmd: "me.setName",
      data: "Nikos_"+Math.random(),
    }));
  };

  connection.onerror = function (error) {
    
  };

  connection.onmessage = function (e) { 
    var data = JSON.parse(e.data);
    if(data.cmd == "world.entityUpdated") {
      if(data.data.name == "Block") {
        game.addBlockInner(data.data.pos.x, data.data.pos.y, data.data.pos.z, data.data.type);
      }
    }
    if(data.cmd == "client.positionUpdated") {
      game.users.setUser(data.data.client, data.data.pos);
    }
    if(data.cmd == "me.entitiesAroundLocation") {
      console.log("update entities")
      for(var i=0; i!=data.data.length; i++) {
        game.addBlockInner(data.data[i].pos.x, data.data[i].pos.y, data.data[i].pos.z, data.data[i].type);
      }
    }
  };
  
  
}

var amount = 0;
