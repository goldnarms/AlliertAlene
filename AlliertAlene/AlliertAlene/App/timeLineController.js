/// <reference path="../scripts/typings/jquery/jquery.d.ts" />

$(document).ready(function () {
    var isSmallScreen = window.innerWidth < 768;
    if (!isSmallScreen) {
        createStoryJS({
            type: 'timeline',
            //width: '800',
            lang: 'no',
            height: '210',
            source: '/Assets/timeline.json',
            embed_id: 'my-timeline'
        });
    } else {
        $("#timeLine").hide();
    }
});
//# sourceMappingURL=timeLineController.js.map
