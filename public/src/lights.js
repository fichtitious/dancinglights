/*
  original lights animation by dan puhe: http://spielzeugz.de/html5/liquid-particles.html
*/

var Lights = function (pulser) {

    var self = this;

    var numLights = getRequestArg("n", 550);

    self.go = function() {

        self.canvasW     = 1000;
        self.canvasH     = 560;
        self.lights      = [];
        self.friction    = .96;
        self.radCirc     = Math.PI * 2;
        self.xCenter = self.canvasW / 2;
        self.yCenter = self.canvasH / 2;

        self.mouseX = self.mouseY = self.mouseVX = self.mouseVY = null;
        self.prevMouseX = self.prevMouseY = 0;    
        self.isMouseDown = false;
        self.isHovering = false;
        self.autoPulse = true;

        $("#lightsContainer").append("<div id='canvasContainer'/>");
        $("#canvasContainer").append("<canvas id='mainCanvas' width='" + self.canvasW + "' height='" + self.canvasH + "'></canvas>")
        $("#canvasContainer").append("<div id='output'/>");
        $("body").append("<div id='toggleMusic' class='toggle right'>-</div>");
        $("body").append("<div id='toggleAutoPulse' class='toggle left'>-</div>");

        self.outerDiv = $("#lightsContainer").get(0);
        self.canvasDiv = $("#canvasContainer").get(0);
        self.canvas = $("#mainCanvas").get(0);
        if (!self.canvas.getContext) {
            alert("please use a better browser");
        }
        self.ctx = self.canvas.getContext("2d");

        for (var i = 0; i < numLights; i++) {
            var l = new Light();
            l.x  = self.canvasW * .5;
            l.y  = self.canvasH * .5;
            l.vX = Math.cos(i) * Math.random() * 25;
            l.vY = Math.sin(i) * Math.random() * 25;
            l.size = 2;
            self.lights[i] = l;
        }

        $("#toggleAutoPulse").click(function(_) {
            self.autoPulse = !self.autoPulse;
            $("#toggleAutoPulse").text(self.autoPulse ? "-" : "+");
        });

        var lightsContainer = $("#lightsContainer");

        lightsContainer.mousedown(function(_) {
            self.isMouseDown = true;
            return false;
        });

        lightsContainer.mouseup(function(_) {
            self.isMouseDown = false;
            return false;
        });

        lightsContainer.mousemove(function(e) {
            self.mouseX = e.clientX - self.outerDiv.offsetLeft - self.canvasDiv.offsetLeft;
            self.mouseY = e.clientY - self.outerDiv.offsetTop  - self.canvasDiv.offsetTop;
        });

        lightsContainer.mouseenter(function(_) {
            self.isHovering = true;
        });

        lightsContainer.mouseleave(function(_) {
            self.isHovering = false;
        });

        setInterval(self.update, 33);

    }

    self.update = function() {

        var ctx      = self.ctx;
        var canvasW  = self.canvasW;
        var canvasH  = self.canvasH;
        var friction = self.friction;
        var radCirc  = self.radCirc;
        var mouseVX  = self.mouseVX;
        var mouseVY  = self.mouseVY;

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(8,8,12,.65)";
        ctx.fillRect(0, 0, canvasW, canvasH);
        ctx.globalCompositeOperation = "lighter";

        self.mouseVX    = self.mouseX - self.prevMouseX;
        self.mouseVY    = self.mouseY - self.prevMouseY;
        self.prevMouseX = self.mouseX;
        self.prevMouseY = self.mouseY;
        
        var toDist   = canvasW / 1.15;
        var stirDist = canvasW / 8;
        var blowDist = canvasW / 2;
        
        var Mrnd   = Math.random;
        var Mabs   = Math.abs;
        var Msqrt  = Math.sqrt;
        var Mcos   = Math.cos;
        var Msin   = Math.sin;
        var Matan2 = Math.atan2;
        var Mmax   = Math.max;
        var Mmin   = Math.min;
        
        var i = numLights;
        while (i--) {

            var l  = self.lights[i];
            var x  = l.x;
            var y  = l.y;
            var vX = l.vX;
            var vY = l.vY;
            
            var dX = x - (self.isHovering ? self.mouseX : self.xCenter);
            var dY = y - (self.isHovering ? self.mouseY : self.yCenter); 
            var d = Msqrt(dX * dX + dY * dY);
            var a = Matan2(dY, dX);
            var cosA = Mcos(a);
            var sinA = Msin(a);
            
            if (self.isMouseDown || (self.autoPulse && pulser.pulse())) {
                if( d < blowDist ) {
                    var blowAcc = ( 1 - ( d / blowDist ) ) * 14;
                    vX += cosA * blowAcc + .5 - Mrnd();
                    vY += sinA * blowAcc + .5 - Mrnd();
                }
            }
            
            if (d < toDist) {
                var toAcc = ( 1 - ( d / toDist ) ) * canvasW * .0014;
                vX -= cosA * toAcc;
                vY -= sinA * toAcc;
            }
            
            if (d < stirDist) {
                var mAcc = ( 1 - ( d / stirDist ) ) * canvasW * .00022;
                vX += mouseVX * mAcc;
                vY += mouseVY * mAcc;            
            }
            
            vX *= friction;
            vY *= friction;
            
            var avgVX = Mabs(vX);
            var avgVY = Mabs(vY);
            var avgV = (avgVX + avgVY) * .5;
            
            if (avgVX < .1) vX *= Mrnd() * 3;
            if (avgVY < .1) vY *= Mrnd() * 3;
            
            var sc = avgV * .45;
            sc = Mmax( Mmin( sc , 3.5 ) , .4 );
            
            
            var nextX = x + vX;
            var nextY = y + vY;
            
            if (nextX > canvasW) {
                nextX = canvasW;
                vX *= -1;
            } else if (nextX < 0) {
                nextX = 0;
                vX *= -1;
            }
            
            if (nextY > canvasH) {
                nextY = canvasH;
                vY *= -1;
            } else if (nextY < 0) {
                nextY = 0;
                vY *= -1;
            }
            
            l.vX = vX;
            l.vY = vY;
            l.x  = nextX;
            l.y  = nextY;
            
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.arc(nextX, nextY, sc, 0, radCirc, true);
            ctx.closePath();
            ctx.fill();
        }
        
    }

    var Light = function () {

        this.color = "rgb(" + Math.floor( Math.random()*255 ) + "," + Math.floor( Math.random()*255 ) + "," + Math.floor( Math.random()*255 ) + ")";
        this.y     = 0;
        this.x     = 0;
        this.vX    = 0;
        this.vY    = 0;
        this.size  = 0; 

    }   

}
