/// <reference path="../scripts/typings/jquery/jquery.d.ts" />
declare var createStoryJS: any;
declare var Timeline: any;
$(document).ready(function () {
    createStoryJS({
        type: 'timeline',
        //width: '800',
        height: '300',
        source: '/Assets/timeline.json',
        embed_id: 'my-timeline'           // ID of the DIV you want to load the timeline into
    });
    $('#my-timeline').delegate(".marker", "click", function () {
        alert(this);
    });
});