
var otherPlayer = require('./user')

var users = {};

module.exports = function(game) {
  
  return {
    setUser: function(user, pos) {
      if(users[user]) { 
        users[user].position.set(pos.x, pos.y, pos.z);
      } else { 
        var createPlayer = otherPlayer(game.world)
        var avatar = createPlayer('images/player.png')
        avatar.position.set(pos.x, pos.y, pos.z);
        users[user] = avatar;
      }
    }
  }
}
