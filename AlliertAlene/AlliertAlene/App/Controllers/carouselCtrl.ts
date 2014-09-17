/// <reference path="../_all.ts" />
module Allied.Controllers {
    "use strict";

    export interface ICarouselController {
    }

    export class CarouselController implements ICarouselController {
        public timelineFeatures: any[];
        static $inject = ["$scope", "$http"];

        constructor(private scope: ng.IScope, private http: ng.IHttpService) {
            this.init();
        }

        private init(): void {
            $.getJSON('/Assets/slickFeatures.json', (data) => {
                console.log(data.dates);
                this.timelineFeatures = data.dates;

                this.scope.$apply();
            });
        }
    }
}