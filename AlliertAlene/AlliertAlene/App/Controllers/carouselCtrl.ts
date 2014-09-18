/// <reference path="../_all.ts" />
module Allied.Controllers {
    "use strict";

    export interface ICarouselController {
        isSmallScreen: boolean;
    }

    export class CarouselController implements ICarouselController {
        public timelineFeatures: any[];
        public isSmallScreen: boolean;
        static $inject = ["$window", "$scope", "$http"];

        constructor(private $window: ng.IWindowService, private scope: ng.IScope, private http: ng.IHttpService) {
            this.init();
            this.isSmallScreen = window.innerWidth < 768;
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
            $.getJSON('/Assets/slickFeatures.json', (data) => {
                this.timelineFeatures = data.dates;

                this.scope.$apply();
            });
        }
    }
}