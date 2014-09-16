/// <reference path="../_all.ts" />
module Allied.Controllers {
    "use strict";

    export interface ICarouselController {
        
    }

    export class CarouselController implements ICarouselController {
        public timelineFetaures: any[];
        constructor() {
            this.init();
        }

        private init(): void {
            this.timelineFetaures = angular.fromJson("/Assets/timeline.json");
        }
    }
}