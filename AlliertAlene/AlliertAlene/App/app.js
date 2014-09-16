/// <reference path="_all.ts" />
var Allied;
(function (Allied) {
    'use strict';
    var allied = angular.module('allied', []).directive("slideItem", Allied.Directives.SlideItem.prototype.injection()).controller("carouselCtrl", Allied.Controllers.CarouselController);
})(Allied || (Allied = {}));
//# sourceMappingURL=app.js.map
