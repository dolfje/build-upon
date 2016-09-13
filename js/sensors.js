module.exports = function(game) {
  if (window.DeviceOrientationEvent) {
 console.log("added");
    window.addEventListener('deviceorientation', function(e) {
 console.log("deviceorentation", e);
      // e.gamma: the left-to-right tilt in degrees, where right is positive
      // e.beta: the front-to-back tilt in degrees, where front is positive
      // e.alpha: the compass direction the device is facing in degrees
      game.setOrientation(e.alpha, e.beta, e.gamma);
    }, false);
  }
  
  if(window.navigator && window.navigator.geolocation) {
    navigator.geolocation.watchPosition(function(pos) {
      game.setLatLng(pos.coords.latitude, pos.coords.longitude);
    });
  }  
}

