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
            $.getJSON('/Assets/timeline.json', (data) => {
                console.log(data.timeline.date);
                this.timelineFeatures = data.timeline.date;
                this.scope.$apply();
            });
        }
    }
}