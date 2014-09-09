/// <reference path="../scripts/typings/jquery/jquery.d.ts" />

$(document).ready(function () {
    createStoryJS({
        type: 'timeline',
        //width: '800',
        height: '300',
        source: '/Assets/timeline.json',
        embed_id: 'my-timeline'
    });
    $('#my-timeline').delegate(".marker", "click", function () {
        alert(this);
    });
});
//# sourceMappingURL=timeLineController.js.map
