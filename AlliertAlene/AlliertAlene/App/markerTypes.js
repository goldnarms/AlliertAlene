var app;
(function (app) {
    (function (MarkerType) {
        MarkerType[MarkerType["Ship"] = 0] = "Ship";
        MarkerType[MarkerType["Video"] = 1] = "Video";
        MarkerType[MarkerType["Diary"] = 2] = "Diary";
        MarkerType[MarkerType["Region"] = 3] = "Region";
        MarkerType[MarkerType["Plane"] = 4] = "Plane";
        MarkerType[MarkerType["Battle"] = 5] = "Battle";
        MarkerType[MarkerType["Surrender"] = 6] = "Surrender";
        MarkerType[MarkerType["Occupied"] = 7] = "Occupied";
        MarkerType[MarkerType["Forces"] = 8] = "Forces";
        MarkerType[MarkerType["Bombing"] = 9] = "Bombing";
    })(app.MarkerType || (app.MarkerType = {}));
    var MarkerType = app.MarkerType;
})(app || (app = {}));
//# sourceMappingURL=markerTypes.js.map
