/// <reference path="../_all.ts" />
module Allied.Controllers {
    "use strict";

    export interface IMapController {
        map: L.Map;
        store: any;
        layer: L.GeoJSON;
        lastLoc: L.LatLng;
        filterOnId(id: string): void;
    }

    export class MapController implements IMapController {
        public static $inject = [];

        public map: L.Map;
        public layer: L.GeoJSON;
        public store: any;
        public lastLoc: L.LatLng;

        private currentKey: string;
        private currentIndex: number = 0;
        private storeKeys: string[] = [];

        constructor() {
            this.init();
        }

        private init(): void {
            this.setupMap();
            this.setupHandlers();
            this.initStore();
            this.loadData();
        }

        private setupHandlers(): void {
            $("#btnFeatureRight").on("click", () => {
                var index = _.indexOf(this.storeKeys, this.currentKey);
                if (index < this.storeKeys.length) {
                    index = index + 1;
                    this.filterOnId(this.storeKeys[index]);
                }
            });

            $("#btnFeatureLeft").on("click", () => {
                var index = _.indexOf(this.storeKeys, this.currentKey);
                if (index > 0) {
                    index = index - 1;
                    this.filterOnId(this.storeKeys[index]);
                }
            });
        }

        private initStore(): void {
            this.store = new Lawnchair({ name: 'alliedLS' }, () => { });
        }

        private setupMap(): void {
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

            this.layer = <L.GeoJSON>L.geoJson(null, { pointToLayer: this.pointer }).addTo(this.map);

            this.lastLoc = new L.LatLng(65.422, 11.931);
        }

        private loadData(): void {
            this.store.nuke();
            $.getJSON('/Assets/dataPoints.geojson', (data) => {
                var ids = _.uniq(_.map(data.features, (f: any) => { return f.properties.id; }));
                _.each(ids, (id: string) => {
                    this.store.save({ key: id, features: _.filter(data.features, (f: any) => { return f.properties.id === id; }) });
                });
                this.storeKeys = ids;
                var initId = ids[0];
                var query = window.location.search.substring(1);
                var vars = query.split("&");
                for (var i = 0; i < vars.length; i++) {
                    var pair = vars[i].split("=");
                    if (pair[0] == "featureId") {
                        initId = pair[1];
                    }
                }
                this.filterOnId(initId);
            });
        }

        public filterOnId(id: string): void {
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


            this.store.get(id, (data) => {
                console.log(data);
                var selectedFeatures = data.features;
                if (selectedFeatures.length > 0) {
                    this.setInfoBox(selectedFeatures[0]);
                    var latLng = new L.LatLng(selectedFeatures[0].properties.centerCoordinates[1], selectedFeatures[0].properties.centerCoordinates[0]);
                    //var latLng = selectedFeatures[0].properties.centerCoordinates;
                    if (this.lastLoc.lat !== latLng.lat || this.lastLoc.lng !== latLng.lng) {
                        if (this.map.getZoom() !== 6) {
                            this.map.setZoom(6);
                        }
                        this.lastLoc = latLng;
                        this.map.panTo(latLng);
                    }
                }
                this.layer.clearLayers().addData(selectedFeatures);
                console.log(selectedFeatures);
                this.layer.on('layeradd', (e) => {
                    console.log(e);
                    var marker = e.layer;
                    var feature = marker.feature;
                    marker.setIcon(this.setMarker(feature.properties.marker));
                });
            });
        }

        private setInfoBox(data): void {
            var date = new Date(data.properties.time);
            var infoBox = $("#infoBox");
            var videoContainer = $("#videoContainer");
            var imgContainer = $(".pop-img");
            $("#infoHeader").html(data.properties.header);
            var months: string[] = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
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
                myPlayer.ready(() => {
                    myPlayer.on('ended', () => {
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
        }

        public pointer(feature: any, latlng: L.LatLng): L.Marker {
            var iconSize = [20, 20];
            var iconAnchor = [10, 10];
            var popupAnchor = [0, -11];
            var marker: L.Icon;
            switch (feature.properties.marker) {
                case app.MarkerType.Ship:
                    {
                        marker = new L.Icon({
                            iconUrl: "/Content/Markers/battleship-3.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                case app.MarkerType.Video:
                    {
                        marker = new L.Icon({
                            iconUrl: "/Content/Markers/video.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                case app.MarkerType.Diary:
                    {
                        marker = new L.Icon({
                            iconUrl: "/Content/Markers/text.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                default:
                    {
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
            }).on("click", () => {
                    this.setInfoBox(feature);
                }).bindPopup('<strong>' + feature.properties.place + "</strong>");
        }

        private setMarker(markerType: app.MarkerType): L.Icon {
            console.log("marker");
            var iconSize = [20, 20];
            var iconAnchor = [10, 10];
            var popupAnchor = [0, -11];
            switch (markerType) {
                case app.MarkerType.Ship:
                    {
                        return new L.Icon({
                            iconUrl: "/Content/Markers/battleship-3.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                    }
                case app.MarkerType.Video:
                    {
                        return new L.Icon({
                            iconUrl: "/Content/Markers/video.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                    }
                case app.MarkerType.Diary:
                    {
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
        }
    }
}