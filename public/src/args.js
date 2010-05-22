var getRequestArg = function(key, defaultVal) {
    var match = (new RegExp('[?&]' + key + '=([^&#]*)')).exec(window.location.href);
    return match ? match[1] : defaultVal;
}
