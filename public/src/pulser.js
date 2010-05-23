/*
    beat detector: music player continuously calls pulser.refresh(), passing in
    fresh equalizer values, and animation continuously calls pulser.pulse() to 
    check whether animation should move.
*/

var Pulser = function() {

    var bandCutPoints = [16, 64, 96, 106, 124, 138, 150, 192, 256]; // cut up the 0-255 refrequency range into bands
                                                               // (middle frequencies generally the most interesting)
    var energyHistoryLength = getRequestArg("h", 32); // can tune down to save cpu

    // a frequency band between two cutpoints
    var Band = function() {

        var self = this;

        self.beatNow = false; // the beat detection state variable

        // keep track of current and recent sound energies in this frequency band
        self.currentEnergy = 0.0;
        self.energyHistory = [];
        for (var i = 0; i < energyHistoryLength; i++) {
            self.energyHistory[i] = 0.0;
        }

        // called by pulser.refresh() to push in the energy at one frequency in this band
        self.accumulate = function(energy) {
            self.currentEnergy += energy;
        }

        var beatHistoryLength = 16; // how many recent beats and non-beats to remember
        self.beatHistory = [];      // holds onto recent beats (1's and 0's)
        for (var i = 0; i < beatHistoryLength; i++) {
            self.beatHistory[i] = false;
        }

        // called by pulser.refresh()
        self.refresh = function() {

            // mean squares of recent energies
            var averageLocalEnergy = 0.0;
            for (var i = 0; i < energyHistoryLength; i++) {
                averageLocalEnergy += Math.pow(self.energyHistory[i], 2);
            }
            averageLocalEnergy /= energyHistoryLength;

            // mean squared differences of recent energies from local average
            var energyVariance = 0.0;
            for (var i = 0; i < energyHistoryLength; i++) {
                energyVariance += Math.pow(averageLocalEnergy - self.energyHistory[i], 2);
            }
            energyVariance /= energyHistoryLength;

            // a beat is detected if the current energy exceeds blah blah
            self.beatNow = self.currentEnergy > averageLocalEnergy * (-0.0025714 * energyVariance + 1.5142857);

            // push this beat into history
            self.beatHistory.shift();
            self.beatHistory.push(self.beatNow);

            // push current energy into history
            self.energyHistory.shift();
            self.energyHistory.push(self.currentEnergy);
            self.currentEnergy = 0.0;

        }

        // how interesting is this band?  not interesting at all if there were no recent beats.
        // otherwise, favor bands with a medium number of recent beats.
        self.getInterestingness = function() {
            var numRecentBeats = 0;
            for (var i = 0; i < beatHistoryLength; i++) {
                numRecentBeats += self.beatHistory[i] ? 1 : 0;
            }
            return numRecentBeats == 0 ? 0 : (beatHistoryLength - Math.abs(beatHistoryLength / 2 - numRecentBeats));
        }

        // called by pulser.pulse() if this band is the most interesting
        self.beat = function() {
            return self.beatNow;
        }

    }

    var idxMostInterestingBand = 0; // tracks which band is the most interesting
    var bands = [];                 // set up bands between the frequency cutpoints
    var numBands = bandCutPoints.length;
    for (var i = 0; i < numBands; i++) {
        bands[i] = new Band();
    }

    // periodically recalculate which band is the most interesting
    // (constantly switching bands can make animation seem flustered)
    setInterval(function() {
        idxMostInterestingBand = 0;
        var maxInterestingness = 0;
        var interestingness = null;
        for (var i = 0; i < numBands; i++) {
            interestingness = bands[i].getInterestingness();
            if (interestingness > maxInterestingness) {
                idxMostInterestingBand = i;
                maxInterestingness = interestingness;
            }
        }
        debug(idxMostInterestingBand);
    }, 5000);


    var pulseHistoryLength = 16; // don't want to be constantly pulsing if song gets noisy,
    var maxRecentPulses = 12;    // so maintain a buffer for pulse() to check against
    var pulseHistory = [];
    for (var i = 0; i < pulseHistoryLength; i++) {
        pulseHistory[i] = false;
    }

    // called by animation, says whether there's a beat worth pulsing to
    this.pulse = function() {

        var beat = bands[idxMostInterestingBand].beat(); // check whether there's a beat in the most interesting band
        var pulse = null;

        if (beat) {
            numRecentPulses = 0;                           // count up the recent pulses and pulse
            for (var i = 0; i < pulseHistoryLength; i++) { // if there haven't been too many
                numRecentPulses += pulseHistory[i] ? 1 : 0;
            }
            pulse = numRecentPulses <= maxRecentPulses;
        } else {
            pulse = false;
        }

        pulseHistory.shift();
        pulseHistory.push(pulse);
        return pulse;

    }

    // called by music player to push in new sound energies
    this.refresh = function(eqData) {

        // push new sound energies into each band, summing over the energies
        var bandIdx = 0;     // at all the frequencies belonging to the band
        var cutPoint = bandCutPoints[0];
        for (var i = 0; i < 256; i++) {
            if (i > cutPoint) {
                cutPoint = bandCutPoints[++bandIdx];
            }
            bands[bandIdx].accumulate(parseFloat(eqData[i]));
        }

        // refresh the bands' internal state
        for (var i = 0; i < numBands; i++) {
            bands[i].refresh();
        }

    }

}
