
module.exports = function() {

    var m_per_pixel = 2.387;
    var width = 256;
    var zoom = 16;

    var m_per_pixel = 0.298;
    var width = 256;
    var zoom = 19;

    var OSM = {
        metersToImageCoor: function(x) {
            return x * 1.0 / (width * OSM.M_PER_PIXEL)
        },

        imageCoorToMeters: function(coor) {
            return coor * width * OSM.M_PER_PIXEL; 
        },

        START_X: 32000 * Math.pow(2, zoom-16) * width * m_per_pixel,
        START_Z: 24000 * Math.pow(2, zoom-16) * width * m_per_pixel,
        X: 0,
        Y: 1,
        Z: 2,
        URL: 3,
        ZOOM: zoom,
        M_PER_PIXEL: m_per_pixel,

        load: function(x_min, z_min, x_max, z_max) {
            var server = "a";
            var image_x_start = Math.floor(OSM.metersToImageCoor(x_min + OSM.START_X));
            var image_x_stop = Math.ceil(OSM.metersToImageCoor(x_max + OSM.START_X));
            var image_z_start = Math.floor(OSM.metersToImageCoor(z_min + OSM.START_Z));
            var image_z_stop = Math.ceil(OSM.metersToImageCoor(z_max + OSM.START_Z));

            var images = [];
            for (var x = image_x_start; x < image_x_stop; x++) {
                for (var z = image_z_start; z < image_z_stop; z++) {
                    var url = "http://"+server+".tile.openstreetmap.org/"+zoom+"/"+x+"/"+z+".png";
                    images.push([
                        OSM.imageCoorToMeters(x) - OSM.START_X + OSM.imageCoorToMeters(0.5), // fix that we x,z is measured from the center
                        1.05,
                        OSM.imageCoorToMeters(z) - OSM.START_Z + OSM.imageCoorToMeters(0.5),
                        url]);
                }
            }  
            return images;
        }
    };
    return OSM;
}()
