var playMusic = function(lights, pulser) {

    var mp3Name     = getRequestArg("s", "despues");
    var debugPlayer = getRequestArg("dp", false);

    var music       = null;
    var musicLoaded = false;
    var paused      = false;
     
    soundManager.flashVersion                  = 9;
    soundManager.flash9Options.useEQData       = true;
    soundManager.flash9Options.useWaveformData = false;
    soundManager.useHighPerformance            = true;
    soundManager.flashLoadTimeout              = 30000;
    soundManager.waitForWindowLoad             = true;
    soundManager.debugMode                     = debugPlayer;
    soundManager.useFlashBlock                 = !$.browser.webkit;
    soundManager.url                           = "lib/soundmanager2/swf/";

    soundManager.onload = function() {
        music = soundManager.createSound({
            id           : "music",
            url          : "music/" + mp3Name + ".mp3",
            volume       : 100,
            autoLoad     : true,
            stream       : false,
            autoPlay     : true,
            onload       : function() {musicLoaded = true;},
            whileplaying : function() {pulser.refresh(music.eqData);},
            ondataerror  : function() {alert("please close any YouTube tabs you have open, then refresh");
            }
        });
    }
    
    $("#toggleMusic").click(function(_) {
        if (musicLoaded) {
            paused = !paused;
            music.togglePause();
            $("#toggleMusic").text(paused ? "+" : "-");
        }
    });

}
