module Allied.Directives {
    "use strict";

    export interface ISlideItemAttributes extends ng.IAttributes {

    }

    export class SlideItem implements ng.IDirective {
        //public link: ($scope: ng.IScope, element: JQuery, attributes: ISlideItemAttributes) => any;
        static $inject = [];
        public injection(): any[] {
            return [() => { return new SlideItem(); }];
        }
        public template: string;
        public restrict: string = "A";
        public scope: any;
        constructor() {
            this.scope = {
                feature: "="
            };
            //this.link = ($scope, element, attributes) => this.linkFn($scope, element, attributes);
            this.template = "<span style='font-size:16px'>{{feature.headline}}</span> <span>{{feature.startDate}}</span>";
        }

        //linkFn($scope, element, attributes) {
            
        //}
    }
}