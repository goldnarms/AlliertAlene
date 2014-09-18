var Allied;
(function (Allied) {
    /// <reference path="../_all.ts" />
    (function (Controllers) {
        "use strict";

        var CarouselController = (function () {
            function CarouselController($window, scope, http) {
                var _this = this;
                this.$window = $window;
                this.scope = scope;
                this.http = http;
                this.init();
                this.isSmallScreen = window.innerWidth < 768;
                $(window).on("resize", function () {
                    var isSmallScreen = _this.$window.innerWidth < 768;
                    if (_this.isSmallScreen !== isSmallScreen) {
                        _this.isSmallScreen = isSmallScreen;
                        _this.scope.$apply();
                    }
                });
                scope.$on("$destroy", function () {
                    $(window).off();
                    _this.scope = scope = null;
                });
            }
            CarouselController.prototype.init = function () {
                var _this = this;
                $.getJSON('/Assets/slickFeatures.json', function (data) {
                    _this.timelineFeatures = data.dates;

                    _this.scope.$apply();
                });
            };
            CarouselController.$inject = ["$window", "$scope", "$http"];
            return CarouselController;
        })();
        Controllers.CarouselController = CarouselController;
    })(Allied.Controllers || (Allied.Controllers = {}));
    var Controllers = Allied.Controllers;
})(Allied || (Allied = {}));
//# sourceMappingURL=carouselCtrl.js.map
