var Allied;
(function (Allied) {
    (function (Directives) {
        "use strict";

        var SlideItem = (function () {
            function SlideItem() {
                this.restrict = "A";
                this.scope = {
                    feature: "="
                };

                //this.link = ($scope, element, attributes) => this.linkFn($scope, element, attributes);
                this.template = "<span style='font-size:16px'>{{feature.headline}}</span> <span>{{feature.startDate}}</span>";
            }
            SlideItem.prototype.injection = function () {
                return [function () {
                        return new SlideItem();
                    }];
            };
            SlideItem.$inject = [];
            return SlideItem;
        })();
        Directives.SlideItem = SlideItem;
    })(Allied.Directives || (Allied.Directives = {}));
    var Directives = Allied.Directives;
})(Allied || (Allied = {}));
//# sourceMappingURL=slideitem.js.map
