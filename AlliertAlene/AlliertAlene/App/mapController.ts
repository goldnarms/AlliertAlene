/// <reference path="../scripts/typings/leaflet/leaflet.d.ts" />
/// <reference path="../scripts/typings/d3/d3.d.ts" />
/// <reference path="../scripts/typings/mapbox/mapbox.d.ts" />
module App {
    L.mapbox.accessToken = 'pk.eyJ1IjoiZ29sZG5hcm1zIiwiYSI6IkZKWHd2ZzgifQ.spTj9MJpcjX57EbN2fUDqQ';

    var map = L.mapbox.map('map', 'goldnarms.jd8kngde', {
        attributionControl: false,
        infoControl: true
    }).setView([65.422, 11.931], 4);

    export class MapController {
        constructor() {
        }
    }

    // Create a new layer with a special pointToLayer function
    // that'll generate scaled points.
    var earthquakesLayer = L.geoJson(null, { pointToLayer: scaledPoint })
        .addTo(map);

    function pointColor(feature) {
        //return feature.properties.mag > 5 ? '#f55' : '#a00';
        return '#f55';
    }

    function pointRadius(feature) {
        return 20;
    }

    function scaledPoint(feature, latlng) {
        return L.circleMarker(latlng, {
            radius: pointRadius(feature),
            fillColor: pointColor(feature),
            fillOpacity: 0.7,
            weight: 0.5,
            color: '#fff'
        }).bindPopup(
            '<h2>' + feature.properties.place + '</h2>' +
            '<h3>' + new Date(feature.properties.time) + '</h3>' +
            feature.properties.text);
    }

    // Request our data and add it to the earthquakesLayer.
    d3.json('/Assets/dataPoints.geojson', function (err, data) {
        earthquakesLayer.addData(data);
        setBrush(data);
    });

    function setBrush(data) {
        var container = d3.select('#brush'),
            width = container.node().offsetWidth,
            margin = { top: 0, right: 0, bottom: 0, left: 0 },
            height = 100;

        var timeExtent = d3.extent(data.features, function (d) {
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
            earthquakesLayer.clearLayers()
                .addData(filtered);
        }
    }
}