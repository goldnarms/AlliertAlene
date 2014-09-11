/// <reference path="../scripts/typings/leaflet/leaflet.d.ts" />
/// <reference path="../scripts/typings/d3/d3.d.ts" />
/// <reference path="../scripts/typings/mapbox/mapbox.d.ts" />
/// <reference path="../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="markertypes.ts" />
var Allied;
(function (Allied) {
    'use strict';
    var MapCtrl = (function () {
        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        function MapCtrl() {
        }
        MapCtrl.$inject = [];
        return MapCtrl;
    })();
    Allied.MapCtrl = MapCtrl;
})(Allied || (Allied = {}));
//# sourceMappingURL=mapCtrl.js.map
