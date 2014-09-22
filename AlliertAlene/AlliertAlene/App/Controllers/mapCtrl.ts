/// <reference path="../_all.ts" />
module Allied.Controllers {
    "use strict";

    export interface IMapController {
        map: L.Map;
        store: any;
        layer: L.GeoJSON;
        lastLoc: L.LatLng;
        selectedFeature: IFeatureViewmodel;
        totalFeatureCount: number;
        showStartArrow: boolean;
        showEndArrow: boolean;
        isSmallScreen: boolean;
        filterOnId(id: string): void;
        nextFeature(): void;
        previousFeature(): void;
        setInfoBox(data: any): void;
    }

    export interface IFeatureViewmodel {
        id: string;
        selected: boolean;
        date: string;
        text: string;
        media: IMediaObject[];
        header: string;
    }

    export interface IMediaObject {
        src: string;
        desc: string;
        posterSrc?: string;
        showImg: boolean;
        showVideo: boolean;
    }

    export class MapController implements IMapController {
        public static $inject = ["$window", "$scope", "mapService", "$timeout", "$location"];

        public map: L.Map;
        public layer: L.GeoJSON;
        public store: any;
        public lastLoc: L.LatLng;
        public selectedFeature: IFeatureViewmodel;
        public totalFeatureCount: number;
        public showStartArrow: boolean = false;
        public showEndArrow: boolean = true;
        public isSmallScreen: boolean;

        private currentKey: string;
        private currentIndex: number = 0;
        private storeKeys: string[] = [];
        private timeIndices: { [id: string]: number };

        constructor(private $window: ng.IWindowService, private scope: ng.IScope, private mapService: Allied.Services.IMapService, private timeout: ng.ITimeoutService, private $location: ng.ILocationService) {
            this.init();
            this.isSmallScreen = this.$window.innerWidth < 768;
            $(window).on("resize", () => {
                var isSmallScreen = this.$window.innerWidth < 768;
                if (this.isSmallScreen !== isSmallScreen) { //only safeApply when there is an actual change
                    this.isSmallScreen = isSmallScreen;
                    this.scope.$apply();
                }
            });
            scope.$on("$destroy", () => {
                $(window).off();
                this.scope = scope = null;
            });
        }

        private init(): void {
            this.setupMap();
            this.initStore();
            this.loadData();
        }

        public nextFeature(): void {
            var index = _.indexOf(this.storeKeys, this.currentKey);
            if (index < this.storeKeys.length) {
                index = index + 1;
                this.filterOnId(this.storeKeys[index]);
            }
        }

        public previousFeature(): void {
            var index = _.indexOf(this.storeKeys, this.currentKey);
            if (index > 0) {
                index = index - 1;
                this.filterOnId(this.storeKeys[index]);
            }
        }

        private initStore(): void {
            this.store = new Lawnchair({ name: 'alliedLS' }, () => { });
        }

        private setupMap(): void {
            this.map = this.mapService.map;
            this.isSmallScreen = window.innerWidth < 768;
            if (this.isSmallScreen) {
                this.map.dragging.disable();
                this.map.touchZoom.disable();
                this.map.doubleClickZoom.disable();
                this.map.scrollWheelZoom.disable();
            }

            this.layer = <L.GeoJSON>L.geoJson(null, { pointToLayer: this.pointer }).addTo(this.map);

            this.lastLoc = new L.LatLng(65.422, 11.931);
        }

        private loadData(): void {
            this.store.nuke();
            this.timeIndices = {};
            $.getJSON('/Assets/dataPoints.geojson', (data) => {
                var ids = _.uniq(_.map(data.features, (f: any) => { return f.properties.id; }));
                var dates = _.uniq(_.map(data.features, (f: any) => { return f.properties.time; }));
                _.each(ids, (id: string) => {
                    this.store.save({ key: id, features: _.filter(data.features, (f: any) => { return f.properties.id === id; }) });
                    this.timeIndices[id] = _.indexOf(dates, _.find(data.features, (f: any) => { return f.properties.id === id; }).properties.time);
                });
                this.storeKeys = ids;
                var initId = ids[0];
                var url = this.$location.absUrl();
                var query = url.split("/");
                var queryValue = query[query.length - 1];
                if (queryValue.indexOf("aa00") > -1) {
                    initId = query[query.length - 1];
                }
                this.totalFeatureCount = ids.length;
                this.filterOnId(initId);
            });
        }

        public filterOnId(id: string): void {
            this.currentKey = id;
            this.currentIndex = _.indexOf(this.storeKeys, this.currentKey);
            this.showStartArrow = this.currentIndex > 0;
            this.showEndArrow = (this.currentIndex + 1) < this.totalFeatureCount;
            this.store.get(id, (data) => {
                var selectedFeatures = data.features;
                if (selectedFeatures.length > 0) {
                    this.setInfoBox(selectedFeatures[0]);
                    var latLng = this.calculaterCenterLocation(data.features);
                    if (this.lastLoc.lat !== latLng.lat || this.lastLoc.lng !== latLng.lng) {
                        if (this.map.getZoom() !== 6) {
                            this.map.setZoom(6);
                        }
                        this.lastLoc = latLng;
                        this.map.panTo(latLng);
                    }
                }
                this.layer.clearLayers().addData(selectedFeatures);
                this.layer.on('layeradd', (e) => {
                    var marker = e.layer;
                    var feature = marker.feature;
                    marker.setIcon(this.setMarker(feature.properties.marker));
                });
            });
            this.timeout(() => {
                (<any>$('.timeline-carousel')).slickGoTo(this.timeIndices[id]);
            }, 100);
        }

        public setInfoBox(data: any): void {
            var date = new Date(data.properties.time);
            var months: string[] = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
            this.selectedFeature = <IFeatureViewmodel>{
                id: data.properties.id,
                selected: true,
                date: date.getDate() + "." + months[date.getMonth()] + " " + date.getFullYear(),
                header: data.properties.header,
                text: data.properties.text,
                media: _.map(data.properties.media, (m: any) => { return <IMediaObject>{
                    desc: m.description,
                    src: m.link || "",
                    posterSrc: m.poster || "",
                    showImg: m.type === "img" || m.type === "diary",
                    showVideo: m.type === "video"
                }
                })
            };
            this.timeout(() => {
                (<any>$(".pop-img")).magnificPopup(
                    {
                        type: 'image',
                        image: {
                            titleSrc: 'title'
                        }
                    });
            });
            //this.scope.$apply();
        }

        public pointer(feature: any, latlng: L.LatLng): L.Marker {
            var that = MapController.prototype;
            var iconSize = [20, 20];
            var iconAnchor = [10, 10];
            var popupAnchor = [0, -11];
            var icon: L.Icon;
            switch (feature.properties.marker) {
                case app.MarkerType.Ship:
                    {
                        icon = new L.Icon({
                            iconUrl: "/Content/Markers/battleship-3.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                case app.MarkerType.Video:
                    {
                        icon = new L.Icon({
                            iconUrl: "/Content/Markers/video.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                case app.MarkerType.Diary:
                    {
                        icon = new L.Icon({
                            iconUrl: "/Content/Markers/text.png",
                            iconSize: iconSize,
                            iconAnchor: iconAnchor,
                            popupAnchor: popupAnchor
                        });
                        break;
                    }
                default:
                    {
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
            }).on("click", () => {
                    //that.setInfoBox(feature);
            }).bindPopup('<strong>' + feature.properties.place[0].toUpperCase() + feature.properties.place.substring(1).toLowerCase() + "</strong>");
        }

        private calculaterCenterLocation(features: any[]): L.LatLng {
            var lngCoordinates = _.map(features, (f: any) => { return f.geometry.coordinates[0]; });
            var latCoordinates = _.map(features, (f: any) => { return f.geometry.coordinates[1]; });
            return new L.LatLng((_.min(latCoordinates) + _.max(latCoordinates)) / 2, (_.min(lngCoordinates) + _.max(lngCoordinates)) / 2);
        }

        private setMarker(markerType: app.MarkerType): L.Icon {
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