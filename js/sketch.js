/* Perlin flow field ("Random 8"), drawn on a blank canvas.
   One step per frame after the first paint. Click, Enter, or Space
   starts a new seed. ?seed=N repeats a field. prefers-reduced-motion
   draws a still instead of looping. */
(function () {
  "use strict";

  // Density is tuned on a 576px sheet, then scaled by area.
  // Speed is divided back down so the sheet fills at the rate of the
  // original 1088-line, 1x-weight drawing: denser and heavier, same pace.
  var REFERENCE_SHEET_PX = 576;
  var REFERENCE_LINE_COUNT = 1741;
  var ORIGINAL_LINE_COUNT = 1088;
  var WEIGHT_TASTE = 1.6;

  var WEIGHT_SCALE = 0.7853325546518085;
  var WEIGHT_WIDTH_REFERENCE_PX = 520;
  var WEIGHT_CLAMP_MIN = 0.7;
  var WEIGHT_CLAMP_MAX = 1.8;
  var STROKE_WIDTH_SLOW = 0.7;
  var STROKE_WIDTH_FAST = 0.22;
  var SPEED_FOR_THIN_STROKE = 1.5;

  var FIELD_MIN = 1.2249583699813624;
  var FIELD_MAX = 3.26618804019157;
  var FIELD_A5_MIN = 2.032027991828462;
  var FIELD_A5_MAX = 3.381026224508914;
  var CURL = 2.4696281526750123;
  var SPEED_JITTER_MIN = 0.7195610208520593;
  var SPEED_JITTER_MAX = 1.21380852024257;

  var INK_ALPHA = 1;
  var INK_DARK = 5;
  var INK_LIGHT = 74;
  var INK_BIAS = 11;
  var TONE_NOISE_SCALE = 0.75;
  var TONE_OFFSET_X = 17;
  var TONE_OFFSET_Y = 31;
  var PAPER = "#fff";
  var PAPER_CHANNEL = 255;

  // A line that moved under STALL_PX across STALL_INTERVAL frames is stuck.
  // At most one stalled line respawns per frame, staggered by index.
  var STALL_INTERVAL = 90;
  var STALL_PX = 0.5;

  // After WASH_FROM_FRAME, every WASH_INTERVAL frames, if more than
  // INK_TARGET of the sheet is darker than INK_LUMINANCE_MAX, lift it
  // toward white. A separate veil runs much later so a long drawing
  // does not go solid black.
  var INK_TARGET = 0.41;
  var WASH_LIFT = 0.03;
  var WASH_FROM_FRAME = 300;
  var WASH_INTERVAL = 10;
  var INK_LUMINANCE_MAX = 200;
  var LIFT_MIN_LEVELS = 1;
  var VEIL_FROM_FRAME = 1800;
  var VEIL_INTERVAL = 1400;
  var VEIL_FILL = "rgba(255,255,255,0.016)";

  var NOISE_OCTAVES = 5;
  var NOISE_FALLOFF = 0.6864426824209959;
  var NOISE_INITIAL_AMPLITUDE = 0.5;
  var PERLIN_SIZE = 4095;
  var PERLIN_Y_SHIFT = 4;
  var PERLIN_Y_STRIDE = 16;
  var PERLIN_Z_OFFSET = 256;
  var COSINE_HALF = 0.5;

  var MIN_CANVAS_PX = 80;
  var MAX_DEVICE_PIXEL_RATIO = 2;
  var REDUCED_MOTION_STEPS = 260;
  var RESIZE_IGNORE_PX = 2;
  var RGBA_STRIDE = 4;

  var HASH_INCREMENT = 0x6D2B79F5;
  var HASH_XOR_SHIFT = 15;
  var HASH_MUL_SHIFT = 7;
  var HASH_FINAL_SHIFT = 14;
  var HASH_SECOND_MUL = 61;
  var UINT32_RANGE = 4294967296;
  var SEED_QUERY = /[?&]seed=(\d+)/;

  var TAU = Math.PI * 2;
  var perlin = null;
  var random = Math.random;

  function createSeededRandom(seed) {
    var state = seed;
    return function randomUnit() {
      state |= 0;
      state = (state + HASH_INCREMENT) | 0;
      var mixed = Math.imul(state ^ (state >>> HASH_XOR_SHIFT), 1 | state);
      mixed = (mixed + Math.imul(mixed ^ (mixed >>> HASH_MUL_SHIFT), HASH_SECOND_MUL | mixed)) ^ mixed;
      return ((mixed ^ (mixed >>> HASH_FINAL_SHIFT)) >>> 0) / UINT32_RANGE;
    };
  }

  function seedNoise() {
    perlin = new Float32Array(PERLIN_SIZE + 1);
    for (var i = 0; i <= PERLIN_SIZE; i++) perlin[i] = random();
  }

  function cosineInterpolate(amount) {
    return COSINE_HALF * (1 - Math.cos(amount * Math.PI));
  }

  // p5 value noise: 4095-entry table, cosine interpolation, fixed octaves.
  function noise(x, y) {
    if (x < 0) x = -x;
    if (y < 0) y = -y;
    var xi = Math.floor(x);
    var yi = Math.floor(y);
    var xf = x - xi;
    var yf = y - yi;
    var value = 0;
    var amplitude = NOISE_INITIAL_AMPLITUDE;
    for (var octave = 0; octave < NOISE_OCTAVES; octave++) {
      var offset = xi + (yi << PERLIN_Y_SHIFT);
      var rx = cosineInterpolate(xf);
      var ry = cosineInterpolate(yf);
      var n1 = perlin[offset & PERLIN_SIZE];
      n1 += rx * (perlin[(offset + 1) & PERLIN_SIZE] - n1);
      var n2 = perlin[(offset + PERLIN_Y_STRIDE) & PERLIN_SIZE];
      n2 += rx * (perlin[(offset + PERLIN_Y_STRIDE + 1) & PERLIN_SIZE] - n2);
      n1 += ry * (n2 - n1);
      offset += PERLIN_Z_OFFSET;
      n2 = perlin[offset & PERLIN_SIZE];
      n2 += rx * (perlin[(offset + 1) & PERLIN_SIZE] - n2);
      var n3 = perlin[(offset + PERLIN_Y_STRIDE) & PERLIN_SIZE];
      n3 += rx * (perlin[(offset + PERLIN_Y_STRIDE + 1) & PERLIN_SIZE] - n3);
      n2 += ry * (n3 - n2);
      n1 += cosineInterpolate(0) * (n2 - n1);
      value += n1 * amplitude;
      amplitude *= NOISE_FALLOFF;
      xi <<= 1;
      xf *= 2;
      yi <<= 1;
      yf *= 2;
      if (xf >= 1) { xi++; xf--; }
      if (yf >= 1) { yi++; yf--; }
    }
    return value;
  }

  function rand(min, max) {
    return min + random() * (max - min);
  }

  function FlowFieldSketch(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.frame = 0;
    this.running = false;
    this.seed = 0;
    this.reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resize();
    this.reset();
  }

  FlowFieldSketch.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    this.width = Math.max(MIN_CANVAS_PX, Math.round(rect.width));
    this.height = Math.max(MIN_CANVAS_PX, Math.round(rect.height));
    this.visibleWidth = this.width;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.context.lineCap = "round";
  };

  FlowFieldSketch.prototype.reset = function (seed) {
    this.seed = seed != null ? seed : (Math.random() * UINT32_RANGE) >>> 0;
    random = createSeededRandom(this.seed);
    seedNoise();
    this.a1 = rand(FIELD_MIN, FIELD_MAX);
    this.a2 = rand(FIELD_MIN, FIELD_MAX);
    this.a3 = rand(FIELD_MIN, FIELD_MAX);
    this.a4 = rand(FIELD_MIN, FIELD_MAX);
    this.a5 = rand(FIELD_A5_MIN, FIELD_A5_MAX);
    var count = Math.round(REFERENCE_LINE_COUNT * (this.width * this.height) / (REFERENCE_SHEET_PX * REFERENCE_SHEET_PX));
    this.particles = new Array(count);
    for (var i = 0; i < count; i++) this.particles[i] = this.spawn({});
    this.context.fillStyle = PAPER;
    this.context.fillRect(0, 0, this.width, this.height);
    this.frame = 0;
    // Nothing is drawn before the loop. Reduced motion has no loop, so it
    // gets a finished still instead of a blank sheet.
    if (this.reduce) this.step(REDUCED_MOTION_STEPS);
  };

  FlowFieldSketch.prototype.spawn = function (particle) {
    particle.x = rand(0, this.width);
    particle.y = rand(0, this.height);
    particle.alpha = INK_ALPHA;
    particle.sj = rand(SPEED_JITTER_MIN, SPEED_JITTER_MAX);
    particle.bias = rand(-INK_BIAS, INK_BIAS);
    return particle;
  };

  FlowFieldSketch.prototype.step = function (steps) {
    var context = this.context;
    var width = this.width;
    var height = this.height;
    var a1 = this.a1;
    var a2 = this.a2;
    var a3 = this.a3;
    var a4 = this.a4;
    var a5 = this.a5;
    var weight = Math.min(Math.max(this.visibleWidth / WEIGHT_WIDTH_REFERENCE_PX, WEIGHT_CLAMP_MIN), WEIGHT_CLAMP_MAX) * WEIGHT_SCALE * WEIGHT_TASTE;
    var length = this.visibleWidth / REFERENCE_SHEET_PX / ((REFERENCE_LINE_COUNT / ORIGINAL_LINE_COUNT) * WEIGHT_TASTE);
    for (var s = 0; s < steps; s++) {
      var moved = false;
      for (var i = 0; i < this.particles.length; i++) {
        var particle = this.particles[i];
        var nx = particle.x / width;
        var ny = particle.y / height;
        var vx = 1 - 2 * noise(a4 + a2 * Math.sin(TAU * nx), a4 + a2 * Math.sin(TAU * ny));
        var vy = 1 - 2 * noise(a2 + a3 * Math.cos(TAU * nx), a4 + a3 * Math.cos(TAU * ny));
        var magnitude = a5 * particle.sj * length;
        vx *= magnitude;
        vy *= magnitude;
        var angle = (noise(a1 + nx * a3, a1 + ny * a2) - COSINE_HALF) * CURL;
        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);
        var rx = vx * cosAngle - vy * sinAngle;
        var ry = vx * sinAngle + vy * cosAngle;
        var x0 = particle.x;
        var y0 = particle.y;
        particle.x += rx;
        particle.y += ry;
        var cx = Math.min(Math.max(particle.x / width, 0), 1);
        var cy = Math.min(Math.max(particle.y / height, 0), 1);
        var tone = noise(cx * a1 * TONE_NOISE_SCALE + TONE_OFFSET_X, cy * a2 * TONE_NOISE_SCALE + TONE_OFFSET_Y);
        var ink = Math.round(INK_DARK + (INK_LIGHT - INK_DARK) * tone + particle.bias);
        var speed = Math.sqrt(rx * rx + ry * ry);
        var thinness = Math.min(Math.max(speed / (a5 * length * SPEED_FOR_THIN_STROKE), 0), 1);
        context.strokeStyle = "rgba(" + ink + "," + ink + "," + ink + "," + particle.alpha.toFixed(3) + ")";
        context.lineWidth = (STROKE_WIDTH_SLOW + (STROKE_WIDTH_FAST - STROKE_WIDTH_SLOW) * thinness) * weight;
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(particle.x, particle.y);
        context.stroke();
        if ((this.frame + i) % STALL_INTERVAL === 0) {
          var dx = particle.x - particle.ax;
          var dy = particle.y - particle.ay;
          if (particle.ax !== undefined && dx * dx + dy * dy < STALL_PX * STALL_PX) {
            if (!moved) {
              moved = true;
              this.spawn(particle);
              particle.ax = undefined;
              continue;
            }
          } else {
            particle.ax = particle.x;
            particle.ay = particle.y;
          }
        }
        if (particle.x >= width || particle.x <= 0 || particle.y >= height || particle.y <= 0) this.spawn(particle);
      }
      this.frame++;
      if (this.frame > VEIL_FROM_FRAME && this.frame % VEIL_INTERVAL === 0) {
        context.fillStyle = VEIL_FILL;
        context.fillRect(0, 0, width, height);
      }
    }
  };

  FlowFieldSketch.prototype.wash = function () {
    var canvas = this.canvas;
    var bitmapWidth = canvas.width;
    var bitmapHeight = canvas.height;
    var context = this.context;
    if (!this.probe) {
      this.probe = document.createElement("canvas");
      this.probeContext = this.probe.getContext("2d", { willReadFrequently: true });
    }
    if (this.probe.width !== bitmapWidth || this.probe.height !== bitmapHeight) {
      this.probe.width = bitmapWidth;
      this.probe.height = bitmapHeight;
    }
    this.probeContext.drawImage(canvas, 0, 0);
    var image = this.probeContext.getImageData(0, 0, bitmapWidth, bitmapHeight);
    var data = image.data;
    var pixelCount = data.length / RGBA_STRIDE;
    var inked = 0;
    var i;
    for (i = 0; i < data.length; i += RGBA_STRIDE) {
      if (data[i] < INK_LUMINANCE_MAX) inked++;
    }
    if (inked / pixelCount <= INK_TARGET) return;
    for (i = 0; i < data.length; i += RGBA_STRIDE) {
      var channel = data[i];
      if (channel === PAPER_CHANNEL) continue;
      channel += Math.max(LIFT_MIN_LEVELS, Math.round((PAPER_CHANNEL - channel) * WASH_LIFT));
      if (channel > PAPER_CHANNEL) channel = PAPER_CHANNEL;
      data[i] = data[i + 1] = data[i + 2] = channel;
    }
    this.probeContext.putImageData(image, 0, 0);
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalCompositeOperation = "copy";
    context.drawImage(this.probe, 0, 0);
    context.restore();
  };

  FlowFieldSketch.prototype.loop = function () {
    if (this.reduce || this.running) return;
    var self = this;
    this.running = true;
    function tick() {
      if (!self.running) return;
      if (!document.hidden) {
        self.step(1);
        if (self.frame > WASH_FROM_FRAME && self.frame % WASH_INTERVAL === 0) self.wash();
      }
      requestAnimationFrame(tick);
    }
    // First painted frame is the blank sheet. Drawing starts the frame after.
    requestAnimationFrame(function () { requestAnimationFrame(tick); });
  };

  function mount() {
    var canvas = document.getElementById("sketch");
    if (!canvas) return;
    var sketch = new FlowFieldSketch(canvas);
    var pinned = SEED_QUERY.exec(location.search);
    if (pinned) sketch.reset(+pinned[1] >>> 0);
    sketch.loop();

    var busy = false;
    var pending = null;
    function redraw(seed) {
      if (busy) {
        pending = { seed: seed };
        return;
      }
      busy = true;
      sketch.reset(seed);
      requestAnimationFrame(function () {
        busy = false;
        if (pending) {
          var next = pending;
          pending = null;
          redraw(next.seed);
        }
      });
    }
    function again() { redraw(); }
    canvas.addEventListener("click", again);
    canvas.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        again();
      }
    });

    var lastWidth = sketch.width;
    var lastHeight = sketch.height;
    window.addEventListener("resize", function () {
      var rect = canvas.getBoundingClientRect();
      if (Math.abs(rect.width - lastWidth) < RESIZE_IGNORE_PX && Math.abs(rect.height - lastHeight) < RESIZE_IGNORE_PX) return;
      sketch.resize();
      sketch.reset();
      lastWidth = sketch.width;
      lastHeight = sketch.height;
    });
  }

  mount();
})();
