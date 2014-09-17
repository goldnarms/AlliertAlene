/// <reference path="../_all.ts" />
module Allied {
    'use strict';
    export interface IMapService {
        setPoint(feature: any, coordinates: any): void;
        setData(features: any[]):void;
    }
    export class MapService implements IMapService {
        constructor() {
            
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