var Allied;
(function (Allied) {
    /// <reference path="../_all.ts" />
    (function (Directives) {
        "use strict";

        var SlideItem = (function () {
            function SlideItem() {
                var _this = this;
                this.restrict = "A";
                this.replace = true;
                this.transclude = false;
                this.controller = "mapCtrl";
                this.scope = {
                    feature: "="
                };
                this.link = function ($scope, element, attributes, controller) {
                    return _this.linkFn($scope, element, attributes, controller);
                };
                this.template = function (tElement, tAttrs) {
                    return "<ul class='text-center' style='list-style:none'><li><strong>{{feature.date}}</strong></li><li data-ng-repeat='f in feature.features'><a href='' data-ng-click='goTo(f.id)'>{{f.header}}</a></li></ul>";
                };
            }
            SlideItem.prototype.injection = function () {
                return [function () {
                        return new SlideItem();
                    }];
            };

            SlideItem.prototype.linkFn = function (scope, element, attributes, controller) {
                scope.goTo = function (id) {
                    controller.filterOnId(id);
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
