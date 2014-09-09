/// <reference path="../scripts/typings/jquery/jquery.d.ts" />

$(document).ready(function () {
    createStoryJS({
        type: 'timeline',
        width: '800',
        height: '600',
        source: '',
        embed_id: 'my-timeline'           // ID of the DIV you want to load the timeline into
    });
});