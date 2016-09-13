module.exports = function(game) {
  
  var endpoint = "192.168.1.9:1337";
  var connection = new WebSocket('ws://'+endpoint+'/');

  game.on("addBlock", function(info) { console.log("addblcok", info);
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
  
  game.on("posChange", function(pos) { console.log("posChange", pos);
    connection.send(JSON.stringify({
      cmd: "me.updatePosition",
      data: {pos: pos, angle: 0},
    }));
  });
  
  connection.onopen = function () {
    connection.send(JSON.stringify({
      cmd: "me.setName",
      data: "Nikos",
    }));
  };

  connection.onerror = function (error) {
    
  };

  connection.onmessage = function (e) { 
    var data = JSON.parse(event.data);console.log(data);
    if(data.cmd == "world.entityUpdated") {
      if(data.name == "block") {
        game.addBlock(data.pos.x, data.pos.y, data.pos.z, data.type);
      }
    }
    if(data.cmd == "me.entitiesAroundLocation") {
      for(var i=0; i!=data.data.length; i++) {
        game.addBlock(data.data[i].pos.x, data.data[i].pos.y, data.data[i].pos.z, data.data[i].type);
      }
      
      

    }
  };
  
  
}

