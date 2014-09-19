var Allied;
(function (Allied) {
    /// <reference path="../_all.ts" />
    (function (Directives) {
        "use strict";

        var SlideItem = (function () {
            //public controller: string = "mapCtrl";
            function SlideItem() {
                var _this = this;
                this.restrict = "A";
                this.replace = true;
                this.transclude = false;
                this.scope = {
                    feature: "="
                };
                this.link = function ($scope, element, attributes) {
                    return _this.linkFn($scope, element, attributes);
                };
                this.template = function (tElement, tAttrs) {
                    return "<ul class='text-center' style='list-style:none'><li class='timeline-date'><strong>{{feature.date}}</strong></li><li data-ng-repeat='f in feature.features'><a href='' data-ng-click='goTo(f.id)' class='timeline-item'>{{f.header}}</a><i class='icon-play-circled' data-ng-show='f.mediaType === 0'></i></li></ul>";
                };
            }
            SlideItem.prototype.injection = function () {
                return [function () {
                        return new SlideItem();
                    }];
            };

            SlideItem.prototype.linkFn = function (scope, element, attributes) {
                scope.goTo = function (id) {
                    scope.$parent.$parent.mc.filterOnId(id);
                };
            };
            SlideItem.$inject = [];
            return SlideItem;
        })();
        Directives.SlideItem = SlideItem;
    })(Allied.Directives || (Allied.Directives = {}));
    var Directives = Allied.Directives;
})(Allied || (Allied = {}));
//# sourceMappingURL=slideItem.js.map
