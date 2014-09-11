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

// Create a new layer with a special pointToLayer function
// that'll generate scaled points.
var pointLayer: L.GeoJSON = <L.GeoJSON>L.geoJson(null, { pointToLayer: scaledPoint })
    .addTo(map);

function pointColor(feature) {
    //return feature.properties.mag > 5 ? '#f55' : '#a00';
    return '#f55';
}

function pointRadius(feature) {
    return 20;
}

function scaledPoint(feature, latlng) {
    return L.marker(latlng, {
        icon: setMarker(feature.properties.marker)
    }).on("click", () => {
            setInfoBox(feature);
        }).bindPopup('<h3>' + feature.properties.place + "</h3>");
    //bindPopup(
    //'<h2>' + feature.properties.place + '</h2>' +
    //'<h3>' + new Date(feature.properties.time) + '</h3>' +
    //feature.properties.text);
}

filterOnId("aa00001");

function setMarker(markerType: app.MarkerType): L.Icon {
    switch (markerType) {
        case app.MarkerType.Ship: {
            return new L.Icon({
                iconUrl: "/Content/Markers/battleship-3.png",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -11]
            });
        }
    }
}

function filterOnId(id: string): void {
    $.getJSON('/Assets/dataPoints.geojson', (data) => {
        var filter = (feature) => {
            return feature.properties.id == id;
        };
        var filtered = data.features.filter(filter);
        if (filtered.length > 0) {
            setInfoBox(filtered[0]);
            map.panTo(filtered[0].properties.centerCoordinates);
        }
        pointLayer.clearLayers().addData(filtered);
        pointLayer.on('layeradd', function (e) {
            var marker = e.layer,
                feature = marker.feature;
            marker.setIcon(setMarker(feature.properties.marker));
        });
    });
}

function setInfoBox(data): void {
    var infoBox = $("#infoBox");
    infoBox.children("h2").html(data.properties.header);
    infoBox.children("div").first().html(data.properties.text);
    infoBox.children(".pop-img").attr("href", data.properties.media.link);
    infoBox.children(".pop-img").children("img").attr("src", data.properties.media.link);
}

function setBrush(data) {
    var container = d3.select('#brush'),
        width = (<any>container.node()).offsetWidth,
        margin = { top: 0, right: 0, bottom: 0, left: 0 },
        height = 100;

    var timeExtent = d3.extent(data.features, function (d: any) {
        return new Date(d.properties.time);
    });

    var svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    var context = svg.append('g')
        .attr('class', 'context')
        .attr('transform', 'translate(' +
        margin.left + ',' +
        margin.top + ')');

    var x = d3.time.scale()
        .range([0, width])
        .domain(timeExtent);

    var brush = d3.svg.brush()
        .x(x)
        .on('brushend', brushend);

    context.selectAll('circle.quake')
        .data(data.features)
        .enter()
        .append('circle')
        .attr('transform', function (d) {
            return 'translate(' + [x(new Date(d.properties.time)), height / 2] + ')';
        })
        .attr('r', pointRadius)
        .attr('opacity', 0.5)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('fill', pointColor);

    context.append('g')
        .attr('class', 'x brush')
        .call(brush)
        .selectAll('rect')
        .attr('y', -6)
        .attr('height', height);

    function brushend() {
        var filter;
        // If the user has selected no brush area, share everything.
        if (brush.empty()) {
            filter = function () { return true; }
                } else {
            // Otherwise, restrict features to only things in the brush extent.
            filter = function (feature) {
                return feature.properties.time > +brush.extent()[0] &&
                    feature.properties.time < (+brush.extent()[1]);
            };
        }
        var filtered = data.features.filter(filter);
        pointLayer.clearLayers()
            .addData(filtered);
    }
}