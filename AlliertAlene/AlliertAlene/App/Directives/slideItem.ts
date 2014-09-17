/// <reference path="../_all.ts" />
module Allied.Directives {
    "use strict";

    export interface ISlideItemAttributes extends ng.IAttributes {

    }

    export class SlideItem implements ng.IDirective {
        public link: ($scope: ng.IScope, element: JQuery, attributes: ISlideItemAttributes, controller: Allied.Controllers.IMapController) => any;
        static $inject = [];
        public injection(): any[] {
            return [() => { return new SlideItem(); }];
        }
        public template: Function;
        public restrict: string = "A";
        public replace: boolean = true;
        public scope: any;
        public transclude: boolean = false;
        public controller: string = "mapCtrl";
        constructor() {
            this.scope = {
                feature: "="
            };
            this.link = ($scope, element, attributes, controller) => this.linkFn($scope, element, attributes, controller);
            this.template = (tElement, tAttrs) => {
                return "<ul class='text-center' style='list-style:none'><li><strong>{{feature.date}}</strong></li><li data-ng-repeat='f in feature.features'><a href='' data-ng-click='goTo(f.id)'>{{f.header}}</a></li></ul>";
            };
        }

        linkFn(scope, element, attributes, controller: Allied.Controllers.IMapController) {
            scope.goTo = (id: string) => {
                controller.filterOnId(id);
            };
        }
    }
}