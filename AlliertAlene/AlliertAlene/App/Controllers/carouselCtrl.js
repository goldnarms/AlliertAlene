var Allied;
(function (Allied) {
    /// <reference path="../_all.ts" />
    (function (Controllers) {
        "use strict";

        var CarouselController = (function () {
            function CarouselController(scope, http) {
                this.scope = scope;
                this.http = http;
                this.init();
            }
            CarouselController.prototype.init = function () {
                var _this = this;
                $.getJSON('/Assets/slickFeatures.json', function (data) {
                    console.log(data.dates);
                    _this.timelineFeatures = data.dates;

                    _this.scope.$apply();
                });
            };
            CarouselController.$inject = ["$scope", "$http"];
            return CarouselController;
        })();
        Controllers.CarouselController = CarouselController;
    })(Allied.Controllers || (Allied.Controllers = {}));
    var Controllers = Allied.Controllers;
})(Allied || (Allied = {}));
//# sourceMappingURL=carouselCtrl.js.map
