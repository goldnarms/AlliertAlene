/// <reference path="../scripts/typings/leaflet/leaflet.d.ts" />
/// <reference path="../scripts/typings/d3/d3.d.ts" />
/// <reference path="../scripts/typings/mapbox/mapbox.d.ts" />
/// <reference path="../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="markertypes.ts" />
L.mapbox.accessToken = 'pk.eyJ1IjoiZ29sZG5hcm1zIiwiYSI6IkZKWHd2ZzgifQ.spTj9MJpcjX57EbN2fUDqQ';
var map = L.mapbox.map('map', 'goldnarms.jd8kngde', {
    attributionControl: false,
    infoControl: true
}).setView([65.422, 11.931], 4);

var pointLayer = L.geoJson(null, { pointToLayer: scaledPoint }).addTo(map);

function scaledPoint(feature, latlng) {
    return L.marker(latlng, {
        icon: setMarker(feature.properties.marker)
    }).on("click", function () {
        setInfoBox(feature);
    }).bindPopup('<h3>' + feature.properties.place + "</h3>");
    //bindPopup(
    //'<h2>' + feature.properties.place + '</h2>' +
    //'<h3>' + new Date(feature.properties.time) + '</h3>' +
    //feature.properties.text);
}

filterOnId("aa00001");

function setMarker(markerType) {
    switch (markerType) {
        case 0 /* Ship */: {
            return new L.Icon({
                iconUrl: "/Content/Markers/battleship-3.png",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -11]
            });
        }
    }
}

function filterOnId(id) {
    $.getJSON('/Assets/dataPoints.geojson', function (data) {
        var filter = function (feature) {
            return feature.properties.id == id;
        };
        var filtered = data.features.filter(filter);
        if (filtered.length > 0) {
            setInfoBox(filtered[0]);
            var latLng = new L.LatLng(filtered[0].properties.centerCoordinates[1], filtered[0].properties.centerCoordinates[0]);
            map.setZoom(8);
            map.panTo(latLng);
        }
        pointLayer.clearLayers().addData(filtered);
        pointLayer.on('layeradd', function (e) {
            var marker = e.layer, feature = marker.feature;
            marker.setIcon(setMarker(feature.properties.marker));
        });
    });
}

function setInfoBox(data) {
    var infoBox = $("#infoBox");
    console.log(data.properties.header);
    console.log(data.properties.media.link);
    console.log(infoBox);
    infoBox.children("h2").first().html(data.properties.header);
    $("#content").html(data.properties.text);
    $(".pop-img").attr("href", data.properties.media.link);
    $(".pop-img").children("img").attr("src", data.properties.media.link);
}
//# sourceMappingURL=mapController.js.map
