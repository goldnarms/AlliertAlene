/// <reference path="../_all.ts" />
module Allied.Services {
    'use strict';
    export interface IMapService {
        setPoint(feature: any, coordinates: any): void;
        setData(features: any[]): void;
        map: L.Map;
    }
    export class MapService implements IMapService {
        public map: L.Map;
        constructor() {
            L.mapbox.accessToken = 'pk.eyJ1IjoiZ29sZG5hcm1zIiwiYSI6IkZKWHd2ZzgifQ.spTj9MJpcjX57EbN2fUDqQ';
            this.map = L.mapbox.map('map', 'goldnarms.jd8kngde', {
                attributionControl: false,
                infoControl: true,
                maxZoom: 7,
                minZoom: 5,
                maxBounds: new L.LatLngBounds(new L.LatLng(57.569, 1.846), new L.LatLng(70.935, 30.828))
            }).setView([65.422, 11.931], 5);
        }

        public setPoint(feature: any, coordinates: any) :void {
            
        }

        public setData(features: any[]): void {
            //this.layer.clearLayers().addData(features);
            //this.layer.on('layeradd', (e) => {
            //    var marker = e.layer,
            //        feature = marker.feature;
            //    marker.setIcon(setMarker(feature.properties.marker));
            //});
        }
    }
} 