/**
 * Perlin flow-field sketch — graphite lines accumulate live.
 * Mounts into #sketch-holder (created by site.js).
 */
(function () {
    "use strict";

    var N_MOBILES = 640;
    var INK_DARK = 22;
    var INK_LIGHT = 95;

    var mobiles = [];
    var a1, a2, a3, a4, a5;
    var canvas;

    function Mobile() {
        this.reseed();
    }

    Mobile.prototype.reseed = function () {
        this.position0 = createVector(
            random(width * 0.02, width * 0.98),
            random(height * 0.02, height * 0.98)
        );
        this.position = this.position0.copy();
        this.velocity = createVector(0, 0);
        this.alpha = random(32, 72);
        this.speedJitter = random(0.85, 1.2);
        this.inkBias = random(-10, 10);
    };

    Mobile.prototype.update = function () {
        var nx = this.position.x / width;
        var ny = this.position.y / height;

        var vx =
            1 -
            2 *
                noise(
                    a4 + a2 * sin(TAU * nx),
                    a4 + a2 * sin(TAU * ny)
                );
        var vy =
            1 -
            2 *
                noise(
                    a2 + a3 * cos(TAU * nx),
                    a4 + a3 * cos(TAU * ny)
                );

        this.velocity = createVector(vx, vy);
        this.velocity.mult(a5 * this.speedJitter);

        var curl = (noise(a1 + nx * a3, a1 + ny * a2) - 0.5) * 1.15;
        this.velocity.rotate(curl);

        this.position0 = this.position.copy();
        this.position.add(this.velocity);
    };

    Mobile.prototype.display = function () {
        var nx = constrain(this.position.x / width, 0, 1);
        var ny = constrain(this.position.y / height, 0, 1);

        var tone = noise(nx * a1 * 0.75 + 17, ny * a2 * 0.75 + 31);
        var ink = lerp(INK_DARK, INK_LIGHT, tone) + this.inkBias;

        var spd = this.velocity.mag();
        var wt = map(spd, 0, a5 * 1.5, 0.7, 0.22, true);
        wt *= constrain(width / 520, 0.7, 1.8);

        stroke(ink, this.alpha);
        strokeWeight(wt);
        line(
            this.position0.x,
            this.position0.y,
            this.position.x,
            this.position.y
        );

        if (
            this.position.x > width + 4 ||
            this.position.x < -4 ||
            this.position.y > height + 4 ||
            this.position.y < -4
        ) {
            this.reseed();
        }
    };

    Mobile.prototype.run = function () {
        this.update();
        this.display();
    };

    function applyCanvasStyle() {
        pixelDensity(min(displayDensity(), 2));
        colorMode(RGB, 255, 255, 255, 255);
        noFill();
        strokeCap(ROUND);
        strokeJoin(ROUND);
    }

    function resetField() {
        noiseDetail(3, 0.55);
        noiseSeed(floor(random(100000)));

        var amin = 1.5;
        var amax = 3.5;
        a1 = random(amin, amax);
        a2 = random(amin, amax);
        a3 = random(amin, amax);
        a4 = random(amin, amax);
        a5 = random(2.8, 3.8);

        mobiles = [];
        for (var i = 0; i < N_MOBILES; i++) {
            mobiles.push(new Mobile());
        }
        background(255);
    }

    var lastSize = 0;
    var resizeObserver = null;

    function holderSize() {
        var holder = document.getElementById("sketch-holder");
        if (!holder) return 400;

        // Use layout width so phone = full viewport width of the rail
        var w = holder.clientWidth || holder.offsetWidth || 0;
        if (w < 20) {
            // Fallback before layout settles: full content width
            w = document.documentElement.clientWidth || window.innerWidth || 400;
        }

        // Device pixel ratio for crisp lines without CSS upscale blur
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var cssSize = Math.floor(w);
        var pixelSize = Math.floor(cssSize * dpr);

        return {
            css: Math.max(80, Math.min(cssSize, 1400)),
            pixels: Math.max(80, Math.min(pixelSize, 2800)),
            dpr: dpr,
        };
    }

    function mountCanvas(isInit) {
        var holder = document.getElementById("sketch-holder");
        if (!holder) return;

        var dims = holderSize();
        var size = dims.css;
        // Skip no-op resizes (orientation / layout thrash)
        if (!isInit && canvas && Math.abs(size - lastSize) < 2) return;
        lastSize = size;

        // Draw at CSS pixel size; p5 pixelDensity handles retina
        if (!isInit && canvas) {
            resizeCanvas(size, size);
            applyCanvasStyle();
            resetField();
            if (canvas.elt) {
                canvas.elt.style.width = "100%";
                canvas.elt.style.height = "auto";
                canvas.elt.style.display = "block";
            }
            return;
        }

        if (canvas) {
            canvas.remove();
        }

        canvas = createCanvas(size, size);
        canvas.parent("sketch-holder");
        applyCanvasStyle();
        resetField();

        if (canvas.elt) {
            // Fill holder width; height follows square buffer (no squash)
            canvas.elt.style.display = "block";
            canvas.elt.style.width = "100%";
            canvas.elt.style.height = "auto";
        }

        if (typeof ResizeObserver !== "undefined" && !resizeObserver) {
            resizeObserver = new ResizeObserver(function () {
                mountCanvas(false);
            });
            resizeObserver.observe(holder);
        }
    }

    // p5 global lifecycle
    window.setup = function () {
        createCanvas(10, 10);
        applyCanvasStyle();
        mountCanvas(true);
    };

    window.draw = function () {
        if (frameCount > 1800 && frameCount % 1400 === 0) {
            noStroke();
            fill(255, 4);
            rect(0, 0, width, height);
            noFill();
        }

        for (var i = 0; i < mobiles.length; i++) {
            mobiles[i].run();
        }
    };

    window.windowResized = function () {
        mountCanvas(false);
    };

    // Intentionally no mousePressed reset: the canvas sits inside a link that
    // navigates/reloads the page. Resetting here would flash a second restart
    // before the navigation completes.
})();
