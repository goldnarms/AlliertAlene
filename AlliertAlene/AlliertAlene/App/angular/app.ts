/// <reference path="../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="mapctrl.ts" />

module Allied {
    'use strict';
    var allied = angular.module('allied', [])
        .controller('mapCtrl', MapCtrl);
} 