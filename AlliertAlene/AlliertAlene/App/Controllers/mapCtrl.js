var Allied;
(function (Allied) {
    /// <reference path="../_all.ts" />
    (function (Controllers) {
        "use strict";

        var MapController = (function () {
            function MapController() {
                this.currentIndex = 0;
                this.storeKeys = [];
                this.init();
            }
            MapController.prototype.init = function () {
                this.setupMap();
                this.setupHandlers();
                this.initStore();
                this.loadData();
            };

            MapController.prototype.setupHandlers = function () {
                var _this = this;
                $("#btnFeatureRight").on("click", function () {
                    var index = _.indexOf(_this.storeKeys, _this.currentKey);
                    if (index < _this.storeKeys.length) {
                        index = index + 1;
                        _this.filterOnId(_this.storeKeys[index]);
                    }
                });

                $("#btnFeatureLeft").on("click", function () {
                    var index = _.indexOf(_this.storeKeys, _this.currentKey);
                    if (index > 0) {
                        index = index - 1;
                        _this.filterOnId(_this.storeKeys[index]);
                    }
                });
            };

            MapController.prototype.initStore = function () {
                this.store = new Lawnchair({ name: 'alliedLS' }, function () {
                });
            };

            MapController.prototype.setupMap = function () {
                if (!this.map) {
                    console.log("Init");
                    L.mapbox.accessToken = 'pk.eyJ1IjoiZ29sZG5hcm1zIiwiYSI6IkZKWHd2ZzgifQ.spTj9MJpcjX57EbN2fUDqQ';
                    this.map = L.mapbox.map('map', 'goldnarms.jd8kngde', {
                        attributionControl: false,
                        infoControl: true,
                        maxZoom: 7,
                        minZoom: 5,
                        maxBounds: new L.LatLngBounds(new L.LatLng(57.569, 1.846), new L.LatLng(70.935, 30.828))
                    }).setView([65.422, 11.931], 5);
                }
                var isSmallScreen = window.innerWidth < 768;
                if (isSmallScreen) {
                    this.map.dragging.disable();
                    this.map.touchZoom.disable();
                    this.map.doubleClickZoom.disable();
                    this.map.scrollWheelZoom.disable();
                    $("#dragger").show();
                }

                this.layer = L.geoJson(null, { pointToLayer: this.pointer }).addTo(this.map);

                this.lastLoc = new L.LatLng(65.422, 11.931);
            };

            MapController.prototype.loadData = function () {
                var _this = this;
                this.store.nuke();
                $.getJSON('/Assets/dataPoints.geojson', function (data) {
                    var ids = _.uniq(_.map(data.features, function (f) {
                        return f.properties.id;
                    }));
                    _.each(ids, function (id) {
                        _this.store.save({ key: id, features: _.filter(data.features, function (f) {
                                return f.properties.id === id;
                            }) });
                    });
                    _this.storeKeys = ids;
                    var initId = ids[0];
                    var query = window.location.search.substring(1);
                    var vars = query.split("&");
                    for (var i = 0; i < vars.length; i++) {
                        var pair = vars[i].split("=");
                        if (pair[0] == "featureId") {
                            initId = pair[1];
                        }
                    }
                    _this.filterOnId(initId);
                });
            };

            MapController.prototype.filterOnId = function (id) {
                var _this = this;
                this.currentKey = id;
                this.currentIndex = _.indexOf(this.storeKeys, this.currentKey);
                if (this.currentIndex === 0) {
                    $("#btnFeatureLeft").hide();
                } else if (this.currentIndex === this.storeKeys.length) {
                    $("#btnFeatureRight").hide();
                } else {
                    $("#btnFeatureLeft").show();
                    $("#btnFeatureRight").show();
                }

                this.store.get(id, function (data) {
                    console.log(data);
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
                    console.log(selectedFeatures);
                    _this.layer.on('layeradd', function (e) {
                        console.log(e);
                        var marker = e.layer;
                        var feature = marker.feature;
                        marker.setIcon(_this.setMarker(feature.properties.marker));
                    });
                });
            };

            MapController.prototype.setInfoBox = function (data) {
                var date = new Date(data.properties.time);
                var infoBox = $("#infoBox");
                var videoContainer = $("#videoContainer");
                var imgContainer = $(".pop-img");
                $("#infoHeader").html(data.properties.header);
                var months = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
                $("#content").html(data.properties.text);
                $("#featureDate").html(date.getDate() + "." + months[date.getMonth()] + " " + date.getFullYear());
                if (data.properties.media.type === "img") {
                    imgContainer.attr("href", data.properties.media.link);
                    imgContainer.children("img").attr("src", data.properties.media.link);
                    videoContainer.hide();
                    imgContainer.show();
                } else if (data.properties.media.type === "video") {
                    var myPlayer = videojs('featureVideo');
                    myPlayer.src(data.properties.media.link);
                    myPlayer.poster(data.properties.media.poster);
                    myPlayer.ready(function () {
                        myPlayer.on('ended', function () {
                            $("#videoLinkContainer").show();
                            videoContainer.hide();
                        });
                    });
                    videoContainer.show();
                    imgContainer.hide();
                } else if (data.properties.media.type === "diary") {
                    infoBox.addClass("diary");

                    //infoBox.css("background-color", "#32cd32");
                    imgContainer.attr("href", data.properties.media.link);
                    imgContainer.children("img").attr("src", data.properties.media.link);
                    imgContainer.show();
                    videoContainer.hide();
                }
                $("#videoLinkContainer").hide();
            };

            MapController.prototype.pointer = function (feature, latlng) {
                var _this = this;
                var iconSize = [20, 20];
                var iconAnchor = [10, 10];
                var popupAnchor = [0, -11];
                var marker;
                switch (feature.properties.marker) {
                    case 0 /* Ship */: {
                        marker = new L.Icon({
                            iconUrl: "/Content/Markers/battleship-3.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                    case 1 /* Video */: {
                        marker = new L.Icon({
                            iconUrl: "/Content/Markers/video.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                    case 2 /* Diary */: {
                        marker = new L.Icon({
                            iconUrl: "/Content/Markers/text.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                    default: {
                        marker = new L.Icon({
                            iconUrl: "/Content/Markers/battleship-3.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                }

                return L.marker(latlng, {
                    icon: marker
                }).on("click", function () {
                    _this.setInfoBox(feature);
                }).bindPopup('<strong>' + feature.properties.place + "</strong>");
            };

            MapController.prototype.setMarker = function (markerType) {
                console.log("marker");
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
            MapController.$inject = [];
            return MapController;
        })();
        Controllers.MapController = MapController;
    })(Allied.Controllers || (Allied.Controllers = {}));
    var Controllers = Allied.Controllers;
})(Allied || (Allied = {}));
//# sourceMappingURL=mapCtrl.js.map
