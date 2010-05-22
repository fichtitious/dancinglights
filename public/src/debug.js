$(function() {
    $("body").append("<div id='debug' align='left'/>");
});

var _debugMode = getRequestArg("d", false);

var debug = function(d) {
    if (_debugMode) {
        $("#debug").html(d);
    }
}
