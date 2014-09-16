/// <reference path="_all.ts" />

module Allied {
    'use strict';
    var allied = angular.module('allied', [])
        .directive("slideItem", Allied.Directives.SlideItem.prototype.injection())
        //.directive("slideItem", Allied.Directives.SlideItem)
        .controller("carouselCtrl", Allied.Controllers.CarouselController);
} 