var Allied;
(function (Allied) {
    /// <reference path="../_all.ts" />
    (function (Controllers) {
        "use strict";

        var CarouselController = (function () {
            function CarouselController() {
                this.init();
            }
            CarouselController.prototype.init = function () {
                this.timelineFetaures = angular.fromJson("/Assets/timeline.json");
            };
            return CarouselController;
        })();
        Controllers.CarouselController = CarouselController;
    })(Allied.Controllers || (Allied.Controllers = {}));
    var Controllers = Allied.Controllers;
})(Allied || (Allied = {}));
//# sourceMappingURL=carouselCtrl.js.map
