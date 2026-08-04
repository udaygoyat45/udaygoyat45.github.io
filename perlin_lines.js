/**
 * Perlin flow-field — graphite on paper.
 *
 * Agents follow a static noise field; strokes accumulate live over time
 * so you see the drawing build, not a finished field fade in.
 */

var nmobiles = 640;
var mobiles = [];
var a1, a2, a3, a4, a5;
var amin, amax;
var canvas;

// One step per frame = real-time build-up (no instant pre-sim)
var STEPS_PER_FRAME = 1;

// Graphite range (RGB gray). Strong enough that early frames still read.
var INK_DARK = 22;
var INK_LIGHT = 95;

function Mobile(index) {
    this.index = index;
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

Mobile.prototype.run = function () {
    this.update();
    this.display();
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

    // Bottom stays hard-cut (no soft vignette). Right-side dissolve is CSS mask.
    var alpha = this.alpha;

    var spd = this.velocity.mag();
    var wt = map(spd, 0, a5 * 1.5, 0.7, 0.22, true);
    wt *= constrain(width / 520, 0.7, 1.8);

    stroke(ink, alpha);
    strokeWeight(wt);
    line(this.position0.x, this.position0.y, this.position.x, this.position.y);

    if (
        this.position.x > width + 4 ||
        this.position.x < -4 ||
        this.position.y > height + 4 ||
        this.position.y < -4
    ) {
        this.reseed();
    }
};

function stepField() {
    for (var i = 0; i < nmobiles; i++) {
        if (mobiles[i]) mobiles[i].run();
    }
}

function setup() {
    createCanvas(800, 800);
    pixelDensity(min(displayDensity(), 2));
    colorMode(RGB, 255, 255, 255, 255);
    noFill();
    strokeCap(ROUND);
    strokeJoin(ROUND);
    sketchSetup(true);
}

function reset() {
    noiseDetail(3, 0.55);
    noiseSeed(floor(random(100000)));

    amin = 1.5;
    amax = 3.5;
    a1 = random(amin, amax);
    a2 = random(amin, amax);
    a3 = random(amin, amax);
    a4 = random(amin, amax);
    // Slightly faster drift so curves form sooner
    a5 = random(2.8, 3.8);

    mobiles = [];
    for (var i = 0; i < nmobiles; i++) {
        mobiles[i] = new Mobile(i);
    }

    background(255);
    // No prewarm — draw() accumulates ink frame by frame.
}

function draw() {
    // Soft long-run lift so density never becomes a black matte
    if (frameCount > 1800 && frameCount % 1400 === 0) {
        noStroke();
        fill(255, 4);
        rect(0, 0, width, height);
        noFill();
    }

    for (var s = 0; s < STEPS_PER_FRAME; s++) {
        stepField();
    }
}

function windowResized() {
    sketchSetup(false);
}

function mousePressed() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        reset();
    }
}

function sketchSetup(init) {
    var sketchHolder = document.getElementById("sketch-holder");
    if (!sketchHolder) return;

    var w = sketchHolder.offsetWidth;
    if (!w || w < 40) w = 400;

    if (!init && canvas) {
        canvas.remove();
    }

    canvas = createCanvas(w, w);
    canvas.parent("sketch-holder");

    pixelDensity(min(displayDensity(), 2));
    colorMode(RGB, 255, 255, 255, 255);
    noFill();
    strokeCap(ROUND);
    strokeJoin(ROUND);

    reset();

    if (canvas && canvas.elt) {
        canvas.elt.style.display = "block";
        canvas.elt.style.opacity = "1";
        canvas.elt.style.transition = "none";
    }
}
