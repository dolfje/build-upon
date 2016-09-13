var game = require('./game')();
require("./sensors")(game);
require("./network")(game);

window.game = game;

