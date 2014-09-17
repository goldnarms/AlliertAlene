/// <reference path="../_all.ts" />
var Allied;
(function (Allied) {
    'use strict';

    var MapService = (function () {
        function MapService() {
        }
        MapService.prototype.setPoint = function (feature, coordinates) {
        };

        MapService.prototype.setData = function (features) {
            //this.layer.clearLayers().addData(features);
            //this.layer.on('layeradd', (e) => {
            //    var marker = e.layer,
            //        feature = marker.feature;
            //    marker.setIcon(setMarker(feature.properties.marker));
            //});
        };
        return MapService;
    })();
    Allied.MapService = MapService;
})(Allied || (Allied = {}));
//# sourceMappingURL=mapService.js.map
