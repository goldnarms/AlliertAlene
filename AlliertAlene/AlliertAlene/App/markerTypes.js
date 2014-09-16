var app;
(function (app) {
    (function (MarkerType) {
        MarkerType[MarkerType["Ship"] = 0] = "Ship";
        MarkerType[MarkerType["Video"] = 1] = "Video";
        MarkerType[MarkerType["Diary"] = 2] = "Diary";
        MarkerType[MarkerType["Region"] = 3] = "Region";
        MarkerType[MarkerType["Plane"] = 4] = "Plane";
        MarkerType[MarkerType["Battle"] = 5] = "Battle";
    })(app.MarkerType || (app.MarkerType = {}));
    var MarkerType = app.MarkerType;
})(app || (app = {}));
//# sourceMappingURL=markerTypes.js.map
