var Allied;
(function (Allied) {
    /// <reference path="../_all.ts" />
    (function (Controllers) {
        "use strict";

        var MapController = (function () {
            function MapController($window, scope, mapService, timeout, $location) {
                var _this = this;
                this.$window = $window;
                this.scope = scope;
                this.mapService = mapService;
                this.timeout = timeout;
                this.$location = $location;
                this.showStartArrow = false;
                this.showEndArrow = true;
                this.currentIndex = 0;
                this.storeKeys = [];
                this.init();
                this.isSmallScreen = this.$window.innerWidth < 768;
                $(window).on("resize", function () {
                    var isSmallScreen = _this.$window.innerWidth < 768;
                    if (_this.isSmallScreen !== isSmallScreen) {
                        _this.isSmallScreen = isSmallScreen;
                        _this.scope.$apply();
                    }
                });
                scope.$on("$destroy", function () {
                    $(window).off();
                    _this.scope = scope = null;
                });
            }
            MapController.prototype.init = function () {
                this.setupMap();
                this.initStore();
                this.loadData();
            };

            MapController.prototype.nextFeature = function () {
                var index = _.indexOf(this.storeKeys, this.currentKey);
                if (index < this.storeKeys.length) {
                    index = index + 1;
                    this.filterOnId(this.storeKeys[index]);
                }
            };

            MapController.prototype.previousFeature = function () {
                var index = _.indexOf(this.storeKeys, this.currentKey);
                if (index > 0) {
                    index = index - 1;
                    this.filterOnId(this.storeKeys[index]);
                }
            };

            MapController.prototype.initStore = function () {
                this.store = new Lawnchair({ name: 'alliedLS' }, function () {
                });
            };

            MapController.prototype.setupMap = function () {
                this.map = this.mapService.map;
                this.isSmallScreen = window.innerWidth < 768;
                if (this.isSmallScreen) {
                    this.map.dragging.disable();
                    this.map.touchZoom.disable();
                    this.map.doubleClickZoom.disable();
                    this.map.scrollWheelZoom.disable();
                }

                this.layer = L.geoJson(null, { pointToLayer: this.pointer }).addTo(this.map);

                this.lastLoc = new L.LatLng(65.422, 11.931);
            };

            MapController.prototype.loadData = function () {
                var _this = this;
                this.store.nuke();
                this.timeIndices = {};
                $.getJSON('/Assets/dataPoints.geojson', function (data) {
                    var ids = _.uniq(_.map(data.features, function (f) {
                        return f.properties.id;
                    }));
                    var dates = _.uniq(_.map(data.features, function (f) {
                        return f.properties.time;
                    }));
                    _.each(ids, function (id) {
                        _this.store.save({ key: id, features: _.filter(data.features, function (f) {
                                return f.properties.id === id;
                            }) });
                        _this.timeIndices[id] = _.indexOf(dates, _.find(data.features, function (f) {
                            return f.properties.id === id;
                        }).properties.time);
                    });
                    _this.storeKeys = ids;
                    var initId = ids[0];
                    var url = _this.$location.absUrl();
                    var query = url.split("/");
                    var queryValue = query[query.length - 1];
                    if (queryValue.indexOf("aa00") > -1) {
                        initId = query[query.length - 1];
                    }
                    _this.totalFeatureCount = ids.length;
                    _this.timeout(function () {
                        //(<any>$('.timeline-carousel')).slickGoTo(this.timeIndices[initId]);
                    });
                    _this.filterOnId(initId);
                });
            };

            MapController.prototype.filterOnId = function (id) {
                var _this = this;
                this.currentKey = id;
                this.currentIndex = _.indexOf(this.storeKeys, this.currentKey);
                this.showStartArrow = this.currentIndex > 0;
                this.showEndArrow = (this.currentIndex + 1) < this.totalFeatureCount;
                this.store.get(id, function (data) {
                    var selectedFeatures = data.features;
                    if (selectedFeatures.length > 0) {
                        _this.setInfoBox(selectedFeatures[0]);
                        var latLng = new L.LatLng(selectedFeatures[0].properties.centerCoordinates[1], selectedFeatures[0].properties.centerCoordinates[0]);

                        //var latLng = selectedFeatures[0].properties.centerCoordinates;
                        if (_this.lastLoc.lat !== latLng.lat || _this.lastLoc.lng !== latLng.lng) {
                            if (_this.map.getZoom() !== 6) {
                                _this.map.setZoom(6);
                            }
                            _this.lastLoc = latLng;
                            _this.map.panTo(latLng);
                        }
                    }
                    _this.layer.clearLayers().addData(selectedFeatures);
                    _this.layer.on('layeradd', function (e) {
                        var marker = e.layer;
                        var feature = marker.feature;
                        marker.setIcon(_this.setMarker(feature.properties.marker));
                    });
                });
            };

            MapController.prototype.setInfoBox = function (data) {
                var date = new Date(data.properties.time);
                var months = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
                this.selectedFeature = {
                    date: date.getDate() + "." + months[date.getMonth()] + " " + date.getFullYear(),
                    header: data.properties.header,
                    text: data.properties.text,
                    showImg: data.properties.media.type === "img" || data.properties.media.type === "diary",
                    showVideo: data.properties.media.type === "video",
                    mediaSrc: data.properties.media.link || "",
                    posterSrc: data.properties.media.poster || "",
                    id: data.properties.id,
                    imgDesc: data.properties.media.description
                };
            };

            MapController.prototype.pointer = function (feature, latlng) {
                var that = MapController.prototype;
                var iconSize = [20, 20];
                var iconAnchor = [10, 10];
                var popupAnchor = [0, -11];
                var icon;
                switch (feature.properties.marker) {
                    case 0 /* Ship */: {
                        icon = new L.Icon({
                            iconUrl: "/Content/Markers/battleship-3.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                    case 1 /* Video */: {
                        icon = new L.Icon({
                            iconUrl: "/Content/Markers/video.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                    case 2 /* Diary */: {
                        icon = new L.Icon({
                            iconUrl: "/Content/Markers/text.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                    default: {
                        icon = new L.Icon({
                            iconUrl: "/Content/Markers/battleship-3.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                }

                return L.marker(latlng, {
                    icon: icon,
                    zIndexOffset: 1000
                }).on("click", function () {
                    that.setInfoBox(feature);
                }).bindPopup('<strong>' + feature.properties.place + "</strong>");
            };

            MapController.prototype.setMarker = function (markerType) {
                var iconSize = [20, 20];
                var iconAnchor = [10, 10];
                var popupAnchor = [0, -11];
                switch (markerType) {
                    case 0 /* Ship */: {
                        return new L.Icon({
                            iconUrl: "/Content/Markers/battleship-3.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                    }
                    case 1 /* Video */: {
                        return new L.Icon({
                            iconUrl: "/Content/Markers/video.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                    }
                    case 2 /* Diary */: {
                        return new L.Icon({
                            iconUrl: "/Content/Markers/text.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                    }
                    default: {
                        return new L.Icon({
                            iconUrl: "/Content/Markers/battleship-3.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                    }
                }
            };
            MapController.$inject = ["$window", "$scope", "mapService", "$timeout", "$location"];
            return MapController;
        })();
        Controllers.MapController = MapController;
    })(Allied.Controllers || (Allied.Controllers = {}));
    var Controllers = Allied.Controllers;
})(Allied || (Allied = {}));
//# sourceMappingURL=mapCtrl.js.map
