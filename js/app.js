var game = require('./game')();
require("./sensors")(game);
require("./network")(game);
require("./findBoxGame")(game);
window.game = game;

