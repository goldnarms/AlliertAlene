/// <reference path="_all.ts" />

module Allied {
    'use strict';
    var allied = angular.module('allied', ["ngSanitize", "td.easySocialShare"])
        //.directive("slideItem", Allied.Directives.SlideItem)
        .service("mapService", Allied.Services.MapService)
        .controller("carouselCtrl", Allied.Controllers.CarouselController)
        .controller("mapCtrl", Allied.Controllers.MapController)
        .directive("slideItem", Allied.Directives.SlideItem.prototype.injection());
} 