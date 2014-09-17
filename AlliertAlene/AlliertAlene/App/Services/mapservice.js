var Allied;
(function (Allied) {
    /// <reference path="../_all.ts" />
    (function (Services) {
        'use strict';

        var MapService = (function () {
            function MapService() {
                L.mapbox.accessToken = 'pk.eyJ1IjoiZ29sZG5hcm1zIiwiYSI6IkZKWHd2ZzgifQ.spTj9MJpcjX57EbN2fUDqQ';
                this.map = L.mapbox.map('map', 'goldnarms.jd8kngde', {
                    attributionControl: false,
                    infoControl: true,
                    maxZoom: 7,
                    minZoom: 5,
                    maxBounds: new L.LatLngBounds(new L.LatLng(57.569, 1.846), new L.LatLng(70.935, 30.828))
                }).setView([65.422, 11.931], 5);
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
        Services.MapService = MapService;
    })(Allied.Services || (Allied.Services = {}));
    var Services = Allied.Services;
})(Allied || (Allied = {}));
//# sourceMappingURL=mapService.js.map
