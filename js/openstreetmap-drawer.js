
var OSM = require("./openstreetmap.js")

module.exports = {
    Drawer: function(game, scene, avatar) {
        var THREE = game.THREE;
        return {
            scene: scene,
            avatar: avatar,
            last_x: -1,
            last_z: -1,
            drawn: [],
            updatePos: function() {
                var pos = avatar.position
                if (pos.x == this.last_x &&
                    pos.z == this.last_z)
                {
                    return
                }

                var x = this.last_x = pos.x;
                var z = this.last_z = pos.z;
                
                var radius = 300;
                var images = OSM.load(x - radius, z - radius, x + radius, z + radius);
                for (var i=0; i<images.length; i++) {
                    var data = images[i];
                    this.draw(data[0], data[1], data[2], data[3]);
                }
            },
            draw: function(x, y, z, url) {
                if (this.drawn[x+":"+z])
                    return;
                this.drawn[x+":"+z] = true;

                var geometry = new THREE.PlaneGeometry(256 * OSM.M_PER_PIXEL, 256 * OSM.M_PER_PIXEL);
                var material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide} );
                material.map = THREE.ImageUtils.loadTexture(url);
                var plane = new THREE.Mesh( geometry, material );
                plane.position.x = x;
                plane.position.y = y;
                plane.rotation.x = -90*Math.PI/180;
                plane.position.z = z;
                this.scene.add( plane );
            }
        }
    }
}
