/// <reference path="_all.ts" />
var Allied;
(function (Allied) {
    'use strict';
    var allied = angular.module('allied', ["ngSanitize", "td.easySocialShare"]).service("mapService", Allied.Services.MapService).controller("carouselCtrl", Allied.Controllers.CarouselController).controller("mapCtrl", Allied.Controllers.MapController).directive("slideItem", Allied.Directives.SlideItem.prototype.injection());
})(Allied || (Allied = {}));
//# sourceMappingURL=app.js.map
