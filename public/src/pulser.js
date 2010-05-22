/*
    beat-detector: music player continuously calls pulser.refresh(), passing in 
    fresh equalizer values, and animation continuously calls pulser.pulse() to 
    check whether animation should move.
*/

var Pulser = function() {

    var bandCutPoints = [16, 64, 96, 106, 124, 138, 150, 192, 256]; // cut up the 0-255 refrequency range into bands
                                                               // (middle frequencies generally the most interesting)
    var energyHistoryLength = getRequestArg("h", 32); // can tune down to save cpu

    // a frequency band between two cutpoints.
    // beats: beats detected in the music.
    // pulses: beats the animation should dance to.
    var Band = function() {

        var self = this;

        self.pulseNow = false; // the time-to-pulse state variable

        // keep track of current and recent sound energies in this frequency band
        self.currentEnergy = 0.0;
        self.energyHistory = [];
        for (var i = 0; i < energyHistoryLength; i++) {
            self.energyHistory[i] = 0.0;
        }

        // called by pulser.refresh() to shift this band's energy history
        self.pushLastEnergyIntoHistoryAndZeroCurrent = function() {
            self.energyHistory.shift();
            self.energyHistory.push(self.currentEnergy);
            self.currentEnergy = 0.0;
        }

        // called by pulser.refresh() to push in the energy at one frequency in this band
        self.accumulate = function(energy) {
            self.currentEnergy += energy;
        }

        var beatHistoryLength = 16; // how many recent beats and non-beats (1's and 0's) to remember
        var maxRecentBeats = 8;     // how many 1's in that window means take a break from pulsing
        self.numRecentBeats = 0;    // holds onto sum of values in beatHistory
        self.beatHistory = [];      // holds onto recent beats (1's and 0's)
        for (var i = 0; i < beatHistoryLength; i++) {
            self.beatHistory[i] = 0;
        }

        // called by pulser.refresh()
        self.refresh = function() {

            // mean squares of recent energies
            var averageLocalEnergy = 0.0;
            for (i in self.energyHistory) {
                averageLocalEnergy += Math.pow(self.energyHistory[i], 2);
            }
            averageLocalEnergy /= energyHistoryLength;

            // mean squared differences of recent energies from local average
            var energyVariance = 0.0;
            for (i in self.energyHistory) {
                energyVariance += Math.pow(averageLocalEnergy - self.energyHistory[i], 2);
            }
            energyVariance /= energyHistoryLength;

            // a beat is detected if the current energy exceeds blah blah
            var beat = (self.currentEnergy > averageLocalEnergy * (-0.0025714 * energyVariance + 1.5142857)) ? 1 : 0;

            // push this beat into history
            self.beatHistory.shift();
            self.beatHistory.push(beat);
            self.numRecentBeats = 0;
            for (i in self.beatHistory) {
                self.numRecentBeats += self.beatHistory[i];
            }

            // don't want to be constantly pulsing if song gets noisy.
            // pulse only if there's a current beat and the buffer isn't
            // too full of recent beats.
            self.pulseNow = beat ? self.numRecentBeats <= maxRecentBeats : false;

        }

        // how interesting is this band?  not interesting at all if there were no recent beats.
        // otherwise, the fewer recent beats, the more interesting.
        self.getInterestingness = function() {
            return self.numRecentBeats == 0 ? 0 : beatHistoryLength - self.numRecentBeats;
        }

        // called by pulser.pulse() if this band is the most interesting
        self.pulse = function() {
            return self.pulseNow;
        }

    }

    var idxMostInterestingBand = 0; // tracks which band is the most interesting
    var bands = [];                 // set up bands between the frequency cutpoints
    for (i in bandCutPoints) {
        bands[i] = new Band();
    }
    
    // called by animation: was there a beat worth pulsing to?
    this.pulse = function() {
        return bands[idxMostInterestingBand].pulse();
    }

    // called by music player to push in new sound energies
    this.refresh = function(eqData) {

        for (i in bands) {
            bands[i].pushLastEnergyIntoHistoryAndZeroCurrent();
        }

        // push new sound energies into each band, summing over the energies
        var bandIdx = 0;     // at all the frequencies belonging to the band
        var cutPoint = bandCutPoints[0];
        for (var i = 0; i < 256; i++) {
            if (i > cutPoint) {
                cutPoint = bandCutPoints[++bandIdx];
            }
            bands[bandIdx].accumulate(parseFloat(eqData[i]));
        }

        // recalculate which band is the most interesting
        idxMostInterestingBand = 0;
        var maxInterestingness = 0;
        var interestingness = null;
        for (i in bands) {
            bands[i].refresh();
            interestingness = bands[i].getInterestingness(); 
            if (interestingness > maxInterestingness) {
                idxMostInterestingBand = i;
                maxInterestingness = interestingness;
            }
        }

        debug(idxMostInterestingBand);

    }

}
