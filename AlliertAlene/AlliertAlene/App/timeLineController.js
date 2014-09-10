/// <reference path="../scripts/typings/jquery/jquery.d.ts" />

$(document).ready(function () {
    createStoryJS({
        type: 'timeline',
        //width: '800',
        lang: 'no',
        height: '210',
        source: '/Assets/timeline.json',
        embed_id: 'my-timeline'
    });
    $('#my-timeline').delegate(".marker", "click", function (event) {
        //console.log(this.parent.innerHTML);
        //console.log(this.innerHTML);
        //console.log(event);
    });
});
//# sourceMappingURL=timeLineController.js.map
