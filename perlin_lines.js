var nmobiles = 400;
var mobiles = [];
var a1, a2, a3, a4, a5, amax;
var bw = true;

function Mobile(index) {
    this.index = index;
    this.velocity = createVector(200, 200, 200);
    this.acceleration = createVector(200, 200, 200);
    this.position0 = createVector(random(0, width), random(0, height), random(0, sin(height)));
    this.position = this.position0.copy();
    this.trans = random(50, 100);
    this.hu = (noise(a1 * cos(PI * this.position.x * width), a1 * sin(PI * this.position.y / height)) * 720) % random(360);
    this.sat = noise(a2 * sin(PI * this.position.x * width), a2 * sin(PI * this.position.y / height)) * 255;
    this.bri = noise(a3 * cos(PI * this.position.x / width), a3 * cos(PI * this.position.y / height)) * 255;
}

Mobile.prototype.run = function () {
    this.update();
    this.display();
};

Mobile.prototype.update = function () {
    this.velocity = createVector(1 - 2 * noise(a4 + a2 * sin(TAU * this.position.x / width),
        a4 + a2 * sin(TAU * this.position.y / height)),
        1 - 2 * noise(a2 + a3 * cos(TAU * this.position.x / width),
            a4 + a3 * cos(TAU * this.position.y / height)));

    this.velocity.mult(a5);
    this.velocity.rotate(sin(100) * noise(a4 + a3 * sin(TAU * this.position.x / width)));
    this.position0 = this.position.copy();
    this.position.add(this.velocity);
};

Mobile.prototype.display = function () {
    let gradX = map(this.position.x, 0, width, 0, 1);
    let gradY = map(this.position.y, 0, height, 0, 1);
    let gradMax = max(gradX, gradY);
    for (let i = 0; i < 2; i++)
        gradMax *= gradMax;

    let gradient = constrain(gradMax, 0, 1);  // How "close to white" it should be
    let col = lerpColor(color(0), color(255), gradient); // from black (0) to white (255)
    stroke(col, this.trans);
    if (bw) stroke(col, this.trans); else stroke((frameCount * 1.8) % 360, (millis() % 360), (frameCount) % 360, this.trans % 255);

    // if (bw) stroke(0, this.trans); else stroke((frameCount * 1.8) % 360, (millis() % 360), (frameCount) % 360, this.trans % 255);

    line(this.position0.x, this.position0.y, this.position.x, this.position.y);
    if (this.position.x > width || this.position.x < 0 || this.position.y > height || this.position.y < 0) {
        this.position0 = createVector(random(0, width), random(0, height), random(0, height * width));
        this.position = this.position0.copy();
    }
};

function setup() {
    createCanvas(800, 800);
    noFill();
    colorMode(HSB, 360, 255, 255, 255);
    strokeWeight(.1);
    reset()
    sketchSetup(true)
    background(255);
}


function reset() {
    noiseDetail(2);
    amin = 2;
    amax = 4;
    a1 = random(amin, amax);
    a2 = random(amin, amax);
    a3 = random(amin, amax);
    a4 = random(amin, amax);
    a5 = 3;
    for (var i = 0; i < nmobiles; i++) {
        mobiles[i] = new Mobile(i);
    }
}
function draw() {
    for (var i = 0; i < nmobiles; i++) {
        if (mobiles[i]) {
            mobiles[i].run();
        }
    }
}

function windowResized() {
    sketchSetup();
}

function sketchSetup(init = false) {
    const sketchHolder = document.getElementById("sketch-holder")
    const width = sketchHolder.offsetWidth
    if (!init) canvas.remove()
    canvas = createCanvas(width, width)
    canvas.parent("sketch-holder")
    setTimeout(() => {
        canvas.elt.style.opacity = "1";
    }, 10);
}
