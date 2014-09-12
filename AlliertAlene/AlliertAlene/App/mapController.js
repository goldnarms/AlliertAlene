/// <reference path="../scripts/typings/leaflet/leaflet.d.ts" />
/// <reference path="../scripts/typings/d3/d3.d.ts" />
/// <reference path="../scripts/typings/mapbox/mapbox.d.ts" />
/// <reference path="../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="markertypes.ts" />
/// <reference path="../scripts/typings/videojs/videojs.d.ts" />
L.mapbox.accessToken = 'pk.eyJ1IjoiZ29sZG5hcm1zIiwiYSI6IkZKWHd2ZzgifQ.spTj9MJpcjX57EbN2fUDqQ';
var map = L.mapbox.map('map', 'goldnarms.jd8kngde', {
    attributionControl: false,
    infoControl: true
}).setView([65.422, 11.931], 4);
var store = new Lawnchair({ name: 'alliedLS' }, function () {
});
var pointLayer = L.geoJson(null, { pointToLayer: scaledPoint }).addTo(map);
var lastLoc = new L.LatLng(65.422, 11.931);

function scaledPoint(feature, latlng) {
    return L.marker(latlng, {
        icon: setMarker(feature.properties.marker)
    }).on("click", function () {
        setInfoBox(feature);
    }).bindPopup('<h3>' + feature.properties.place + "</h3>");
}

loadJson();

function loadJson() {
    store.nuke();
    $.getJSON('/Assets/dataPoints.geojson', function (data) {
        var ids = _.uniq(_.map(data.features, function (f) {
            return f.properties.id;
        }));
        _.each(ids, function (id) {
            store.save({ key: id, features: _.filter(data.features, function (f) {
                    return f.properties.id === id;
                }) });
        });
        filterOnId("aa00001");
    });
}
function setMarker(markerType) {
    var iconSize = [20, 20];
    var iconAnchor = [10, 10];
    var popupAnchor = [0, -11];
    switch (markerType) {
        case 0 /* Ship */: {
            return new L.Icon({
                iconUrl: "/Content/Markers/battleship-3.png",
                iconSize: iconSize,
                iconAnchor: iconAnchor,
                popupAnchor: popupAnchor
            });
        }
        case 1 /* Video */: {
            return new L.Icon({
                iconUrl: "/Content/Markers/video.png",
                iconSize: iconSize,
                iconAnchor: iconAnchor,
                popupAnchor: popupAnchor
            });
        }
        case 2 /* Diary */: {
            return new L.Icon({
                iconUrl: "/Content/Markers/text.png",
                iconSize: iconSize,
                iconAnchor: iconAnchor,
                popupAnchor: popupAnchor
            });
        }
    }
}

function filterOnId(id) {
    store.get(id, function (data) {
        var selectedFeatures = data.features;
        if (selectedFeatures.length > 0) {
            setInfoBox(selectedFeatures[0]);
            var latLng = new L.LatLng(selectedFeatures[0].properties.centerCoordinates[1], selectedFeatures[0].properties.centerCoordinates[0]);

            //var latLng = selectedFeatures[0].properties.centerCoordinates;
            if (lastLoc.lat !== latLng.lat || lastLoc.lng !== latLng.lng) {
                map.setZoom(5);
                lastLoc = latLng;
                setTimeout(function () {
                    map.setZoom(6);
                }, 500);
                map.panTo(latLng);
            }
        }
        pointLayer.clearLayers().addData(selectedFeatures);
        pointLayer.on('layeradd', function (e) {
            var marker = e.layer, feature = marker.feature;
            marker.setIcon(setMarker(feature.properties.marker));
        });
    });
}

function setInfoBox(data) {
    var infoBox = $("#infoBox");
    var videoContainer = $("#videoContainer");
    var imgContainer = $(".pop-img");
    infoBox.children("h2").first().html(data.properties.header);
    $("#content").html(data.properties.text);
    if (data.properties.media.type === "img") {
        imgContainer.attr("href", data.properties.media.link);
        imgContainer.children("img").attr("src", data.properties.media.link);
        videoContainer.hide();
        imgContainer.show();
    } else if (data.properties.media.type === "video") {
        var myPlayer = videojs('featureVideo');
        myPlayer.src(data.properties.media.link);
        myPlayer.poster(data.properties.media.poster);

        //$("video").attr("poster", data.properties.media.poster);
        //$("source").attr("src", data.properties.media.link);
        videoContainer.show();
        imgContainer.hide();
    } else if (data.properties.media.type === "diary") {
        infoBox.addClass("diary");

        //infoBox.css("background-color", "#32cd32");
        imgContainer.attr("href", data.properties.media.link);
        imgContainer.children("img").attr("src", data.properties.media.link);
        imgContainer.show();
        videoContainer.hide();
    }
}
//# sourceMappingURL=mapController.js.map
