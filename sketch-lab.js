/**
 * Sketch Lab — multi-instance p5 grid exploring perlin-line knobs.
 * Each cell runs an independent instance with a distinct recipe.
 */
(function () {
    "use strict";

    /** Curated aesthetic territories + generators for random recipes */
    var RECIPE_ARCHETYPES = [
        {
            name: "Site default",
            nMobiles: 640,
            inkDark: 22,
            inkLight: 95,
            alphaMin: 32,
            alphaMax: 72,
            aMin: 1.5,
            aMax: 3.5,
            a5Min: 2.8,
            a5Max: 3.8,
            curl: 1.15,
            noiseOctaves: 3,
            noiseFalloff: 0.55,
            weightScale: 1.0,
            speedJitterMin: 0.85,
            speedJitterMax: 1.2,
            inkBias: 10,
        },
        {
            name: "Whisper",
            nMobiles: 420,
            inkDark: 55,
            inkLight: 140,
            alphaMin: 14,
            alphaMax: 36,
            aMin: 1.2,
            aMax: 2.4,
            a5Min: 1.6,
            a5Max: 2.4,
            curl: 0.55,
            noiseOctaves: 2,
            noiseFalloff: 0.45,
            weightScale: 0.7,
            speedJitterMin: 0.9,
            speedJitterMax: 1.1,
            inkBias: 6,
        },
        {
            name: "Storm",
            nMobiles: 900,
            inkDark: 8,
            inkLight: 70,
            alphaMin: 40,
            alphaMax: 95,
            aMin: 2.8,
            aMax: 5.2,
            a5Min: 3.8,
            a5Max: 5.5,
            curl: 1.9,
            noiseOctaves: 4,
            noiseFalloff: 0.62,
            weightScale: 1.15,
            speedJitterMin: 0.7,
            speedJitterMax: 1.4,
            inkBias: 14,
        },
        {
            name: "Hairline map",
            nMobiles: 1100,
            inkDark: 30,
            inkLight: 110,
            alphaMin: 20,
            alphaMax: 48,
            aMin: 1.8,
            aMax: 3.2,
            a5Min: 2.0,
            a5Max: 2.9,
            curl: 0.9,
            noiseOctaves: 3,
            noiseFalloff: 0.5,
            weightScale: 0.45,
            speedJitterMin: 0.95,
            speedJitterMax: 1.15,
            inkBias: 8,
        },
        {
            name: "Bold graphite",
            nMobiles: 380,
            inkDark: 5,
            inkLight: 55,
            alphaMin: 70,
            alphaMax: 130,
            aMin: 1.4,
            aMax: 2.8,
            a5Min: 2.5,
            a5Max: 3.4,
            curl: 1.0,
            noiseOctaves: 2,
            noiseFalloff: 0.5,
            weightScale: 1.85,
            speedJitterMin: 0.8,
            speedJitterMax: 1.25,
            inkBias: 12,
        },
        {
            name: "Drift soft",
            nMobiles: 520,
            inkDark: 40,
            inkLight: 120,
            alphaMin: 22,
            alphaMax: 55,
            aMin: 0.9,
            aMax: 1.8,
            a5Min: 1.2,
            a5Max: 1.9,
            curl: 0.35,
            noiseOctaves: 2,
            noiseFalloff: 0.4,
            weightScale: 0.9,
            speedJitterMin: 0.92,
            speedJitterMax: 1.08,
            inkBias: 5,
        },
        {
            name: "Turbulent ink",
            nMobiles: 700,
            inkDark: 12,
            inkLight: 90,
            alphaMin: 35,
            alphaMax: 80,
            aMin: 3.2,
            aMax: 5.8,
            a5Min: 3.2,
            a5Max: 4.6,
            curl: 2.4,
            noiseOctaves: 5,
            noiseFalloff: 0.65,
            weightScale: 1.05,
            speedJitterMin: 0.65,
            speedJitterMax: 1.5,
            inkBias: 16,
        },
        {
            name: "Sparse marks",
            nMobiles: 180,
            inkDark: 15,
            inkLight: 85,
            alphaMin: 50,
            alphaMax: 100,
            aMin: 1.6,
            aMax: 3.0,
            a5Min: 3.0,
            a5Max: 4.2,
            curl: 1.3,
            noiseOctaves: 3,
            noiseFalloff: 0.55,
            weightScale: 1.4,
            speedJitterMin: 0.75,
            speedJitterMax: 1.3,
            inkBias: 10,
        },
        {
            name: "Lace",
            nMobiles: 1400,
            inkDark: 45,
            inkLight: 130,
            alphaMin: 10,
            alphaMax: 28,
            aMin: 2.0,
            aMax: 4.0,
            a5Min: 1.8,
            a5Max: 2.6,
            curl: 1.5,
            noiseOctaves: 4,
            noiseFalloff: 0.58,
            weightScale: 0.35,
            speedJitterMin: 0.88,
            speedJitterMax: 1.2,
            inkBias: 7,
        },
        {
            name: "Night grain",
            nMobiles: 800,
            inkDark: 0,
            inkLight: 40,
            alphaMin: 45,
            alphaMax: 90,
            aMin: 2.2,
            aMax: 4.0,
            a5Min: 2.6,
            a5Max: 3.6,
            curl: 1.25,
            noiseOctaves: 3,
            noiseFalloff: 0.55,
            weightScale: 1.1,
            speedJitterMin: 0.8,
            speedJitterMax: 1.25,
            inkBias: 8,
        },
    ];

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function randInt(min, max) {
        return Math.floor(rand(min, max + 1));
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /** Fully random recipe in a broad aesthetic space */
    function randomRecipe(index) {
        var density = pick(["sparse", "mid", "dense", "lace"]);
        var nMap = { sparse: [160, 320], mid: [400, 700], dense: [750, 1100], lace: [1200, 1600] };
        var nRange = nMap[density];
        var weightScale =
            density === "lace"
                ? rand(0.3, 0.55)
                : density === "sparse"
                  ? rand(1.1, 2.0)
                  : rand(0.55, 1.35);

        return {
            name: "Random " + (index + 1),
            nMobiles: randInt(nRange[0], nRange[1]),
            inkDark: randInt(0, 50),
            inkLight: randInt(60, 150),
            alphaMin: randInt(10, 45),
            alphaMax: randInt(50, 130),
            aMin: rand(0.8, 2.5),
            aMax: rand(2.6, 6.0),
            a5Min: rand(1.2, 3.0),
            a5Max: rand(3.1, 5.8),
            curl: rand(0.25, 2.6),
            noiseOctaves: randInt(2, 5),
            noiseFalloff: rand(0.38, 0.7),
            weightScale: weightScale,
            speedJitterMin: rand(0.65, 0.95),
            speedJitterMax: rand(1.05, 1.55),
            inkBias: randInt(4, 18),
            seed: randInt(1, 999999),
        };
    }

    function recipeFromArchetype(arch, index) {
        var r = clone(arch);
        r.seed = randInt(1, 999999);
        if (r.name.indexOf("Random") === 0) {
            r.name = arch.name;
        }
        // Small jitter so same archetype still varies across cells
        r.nMobiles = Math.round(r.nMobiles * rand(0.9, 1.1));
        r.aMin = r.aMin * rand(0.95, 1.05);
        r.aMax = r.aMax * rand(0.95, 1.05);
        r.a5Min = r.a5Min * rand(0.95, 1.05);
        r.a5Max = r.a5Max * rand(0.95, 1.05);
        r.curl = r.curl * rand(0.92, 1.08);
        r._archetype = arch.name;
        r._slot = index;
        return r;
    }

    function formatParams(cfg) {
        return [
            "seed " + cfg.seed,
            "n " + cfg.nMobiles,
            "ink " + cfg.inkDark + "–" + cfg.inkLight,
            "α " + cfg.alphaMin + "–" + cfg.alphaMax,
            "field " + cfg.aMin.toFixed(2) + "–" + cfg.aMax.toFixed(2),
            "speed " + cfg.a5Min.toFixed(2) + "–" + cfg.a5Max.toFixed(2),
            "curl " + cfg.curl.toFixed(2),
            "noise " + cfg.noiseOctaves + "/" + cfg.noiseFalloff.toFixed(2),
            "wt×" + cfg.weightScale.toFixed(2),
        ].join(" · ");
    }

    function buildSketch(holder, cfg, onFrame) {
        return new p5(function (p) {
            var mobiles = [];
            var a1, a2, a3, a4, a5;
            var size = 0;

            function Mobile() {
                this.reseed();
            }

            Mobile.prototype.reseed = function () {
                this.position0 = p.createVector(
                    p.random(p.width * 0.02, p.width * 0.98),
                    p.random(p.height * 0.02, p.height * 0.98)
                );
                this.position = this.position0.copy();
                this.velocity = p.createVector(0, 0);
                this.alpha = p.random(cfg.alphaMin, cfg.alphaMax);
                this.speedJitter = p.random(cfg.speedJitterMin, cfg.speedJitterMax);
                this.inkBias = p.random(-cfg.inkBias, cfg.inkBias);
            };

            Mobile.prototype.update = function () {
                var nx = this.position.x / p.width;
                var ny = this.position.y / p.height;
                var TAU = p.TWO_PI;

                var vx =
                    1 -
                    2 *
                        p.noise(
                            a4 + a2 * p.sin(TAU * nx),
                            a4 + a2 * p.sin(TAU * ny)
                        );
                var vy =
                    1 -
                    2 *
                        p.noise(
                            a2 + a3 * p.cos(TAU * nx),
                            a4 + a3 * p.cos(TAU * ny)
                        );

                this.velocity = p.createVector(vx, vy);
                this.velocity.mult(a5 * this.speedJitter);

                var curl = (p.noise(a1 + nx * a3, a1 + ny * a2) - 0.5) * cfg.curl;
                this.velocity.rotate(curl);

                this.position0 = this.position.copy();
                this.position.add(this.velocity);
            };

            Mobile.prototype.display = function () {
                var nx = p.constrain(this.position.x / p.width, 0, 1);
                var ny = p.constrain(this.position.y / p.height, 0, 1);

                var tone = p.noise(nx * a1 * 0.75 + 17, ny * a2 * 0.75 + 31);
                var ink = p.lerp(cfg.inkDark, cfg.inkLight, tone) + this.inkBias;

                var spd = this.velocity.mag();
                var wt = p.map(spd, 0, a5 * 1.5, 0.7, 0.22, true);
                wt *= p.constrain(p.width / 520, 0.7, 1.8) * cfg.weightScale;

                p.stroke(ink, this.alpha);
                p.strokeWeight(wt);
                p.line(
                    this.position0.x,
                    this.position0.y,
                    this.position.x,
                    this.position.y
                );

                if (
                    this.position.x > p.width + 4 ||
                    this.position.x < -4 ||
                    this.position.y > p.height + 4 ||
                    this.position.y < -4
                ) {
                    this.reseed();
                }
            };

            function resetField() {
                p.noiseDetail(cfg.noiseOctaves, cfg.noiseFalloff);
                p.noiseSeed(cfg.seed);

                a1 = p.random(cfg.aMin, cfg.aMax);
                a2 = p.random(cfg.aMin, cfg.aMax);
                a3 = p.random(cfg.aMin, cfg.aMax);
                a4 = p.random(cfg.aMin, cfg.aMax);
                a5 = p.random(cfg.a5Min, cfg.a5Max);

                // Capture rolled field coeffs for export
                cfg._rolled = {
                    a1: a1,
                    a2: a2,
                    a3: a3,
                    a4: a4,
                    a5: a5,
                };

                mobiles = [];
                // Cap work for many simultaneous instances
                var n = Math.min(cfg.nMobiles, 900);
                var scale = Math.max(0.45, Math.min(1, size / 280));
                n = Math.round(n * scale);
                for (var i = 0; i < n; i++) {
                    mobiles.push(new Mobile());
                }
                p.background(255);
            }

            p.setup = function () {
                size = Math.floor(holder.clientWidth || 260);
                var c = p.createCanvas(size, size);
                c.parent(holder);
                p.pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5));
                p.colorMode(p.RGB, 255, 255, 255, 255);
                p.noFill();
                p.strokeCap(p.ROUND);
                p.strokeJoin(p.ROUND);
                p.frameRate(30);
                p.randomSeed(cfg.seed);
                resetField();
            };

            p.draw = function () {
                if (p.frameCount > 900 && p.frameCount % 700 === 0) {
                    p.noStroke();
                    p.fill(255, 4);
                    p.rect(0, 0, p.width, p.height);
                    p.noFill();
                }
                for (var i = 0; i < mobiles.length; i++) {
                    mobiles[i].update();
                    mobiles[i].display();
                }
                if (onFrame) onFrame(p.frameCount);
            };

            p.reroll = function () {
                cfg.seed = randInt(1, 999999);
                p.randomSeed(cfg.seed);
                resetField();
            };

            p.getConfig = function () {
                return cfg;
            };
        }, holder);
    }

    // --- UI state ---
    var instances = [];
    var picks = [];
    var useRandomRecipes = false;

    var gridEl = document.getElementById("grid");
    var countEl = document.getElementById("count");
    var picksPanel = document.getElementById("picks-panel");
    var picksJson = document.getElementById("picks-json");

    function destroyAll() {
        for (var i = 0; i < instances.length; i++) {
            if (instances[i].sketch) {
                instances[i].sketch.remove();
            }
        }
        instances = [];
        gridEl.innerHTML = "";
    }

    function makeRecipes(n) {
        var list = [];
        if (!useRandomRecipes) {
            // Cycle archetypes first, then fill with random
            for (var i = 0; i < n; i++) {
                if (i < RECIPE_ARCHETYPES.length) {
                    list.push(recipeFromArchetype(RECIPE_ARCHETYPES[i], i));
                } else {
                    list.push(randomRecipe(i));
                }
            }
        } else {
            for (var j = 0; j < n; j++) {
                list.push(randomRecipe(j));
            }
        }
        return list;
    }

    function isPicked(cfg) {
        return picks.some(function (p) {
            return p.seed === cfg.seed && p.name === cfg.name;
        });
    }

    function updatePicksPanel() {
        if (!picks.length) {
            picksPanel.classList.add("empty");
            picksJson.textContent = "[]";
            return;
        }
        picksPanel.classList.remove("empty");
        picksJson.textContent = JSON.stringify(picks, null, 2);
    }

    function togglePick(cfg, cell, btn) {
        var idx = picks.findIndex(function (p) {
            return p.seed === cfg.seed && p.name === cfg.name;
        });
        if (idx >= 0) {
            picks.splice(idx, 1);
            cell.classList.remove("is-picked");
            btn.classList.remove("picked");
            btn.textContent = "Pick";
        } else {
            var exportCfg = clone(cfg);
            picks.push(exportCfg);
            cell.classList.add("is-picked");
            btn.classList.add("picked");
            btn.textContent = "Picked";
        }
        updatePicksPanel();
    }

    function mountCell(cfg) {
        var cell = document.createElement("article");
        cell.className = "cell";

        var canvasWrap = document.createElement("div");
        canvasWrap.className = "cell__canvas";

        var body = document.createElement("div");
        body.className = "cell__body";

        var title = document.createElement("h2");
        title.className = "cell__title";
        title.textContent = cfg.name;

        var params = document.createElement("div");
        params.className = "cell__params";
        params.textContent = formatParams(cfg);

        var actions = document.createElement("div");
        actions.className = "cell__actions";

        var rerollBtn = document.createElement("button");
        rerollBtn.type = "button";
        rerollBtn.textContent = "Reroll seed";

        var pickBtn = document.createElement("button");
        pickBtn.type = "button";
        pickBtn.textContent = "Pick";

        var copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.textContent = "Copy JSON";

        actions.appendChild(rerollBtn);
        actions.appendChild(pickBtn);
        actions.appendChild(copyBtn);

        body.appendChild(title);
        body.appendChild(params);
        body.appendChild(actions);

        cell.appendChild(canvasWrap);
        cell.appendChild(body);
        gridEl.appendChild(cell);

        var sketch = buildSketch(canvasWrap, cfg, null);

        rerollBtn.addEventListener("click", function () {
            sketch.reroll();
            params.textContent = formatParams(cfg);
            cell.classList.remove("is-picked");
            pickBtn.classList.remove("picked");
            pickBtn.textContent = "Pick";
        });

        pickBtn.addEventListener("click", function () {
            togglePick(cfg, cell, pickBtn);
        });

        copyBtn.addEventListener("click", function () {
            var text = JSON.stringify(cfg, null, 2);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    copyBtn.textContent = "Copied";
                    setTimeout(function () {
                        copyBtn.textContent = "Copy JSON";
                    }, 1200);
                });
            } else {
                window.prompt("Copy config:", text);
            }
        });

        instances.push({ sketch: sketch, cfg: cfg, cell: cell, paramsEl: params });
    }

    function rebuild() {
        destroyAll();
        var n = parseInt(countEl.value, 10) || 9;
        var recipes = makeRecipes(n);
        for (var i = 0; i < recipes.length; i++) {
            mountCell(recipes[i]);
        }
    }

    document.getElementById("reroll-all").addEventListener("click", function () {
        for (var i = 0; i < instances.length; i++) {
            var inst = instances[i];
            inst.sketch.reroll();
            inst.paramsEl.textContent = formatParams(inst.cfg);
            inst.cell.classList.remove("is-picked");
            var pickBtn = inst.cell.querySelector(".cell__actions button:nth-child(2)");
            if (pickBtn) {
                pickBtn.classList.remove("picked");
                pickBtn.textContent = "Pick";
            }
        }
    });

    document.getElementById("new-recipes").addEventListener("click", function () {
        useRandomRecipes = true;
        rebuild();
    });

    document.getElementById("clear-picks").addEventListener("click", function () {
        picks = [];
        updatePicksPanel();
        var cells = gridEl.querySelectorAll(".cell");
        for (var i = 0; i < cells.length; i++) {
            cells[i].classList.remove("is-picked");
            var btn = cells[i].querySelector(".cell__actions button:nth-child(2)");
            if (btn) {
                btn.classList.remove("picked");
                btn.textContent = "Pick";
            }
        }
    });

    countEl.addEventListener("change", function () {
        useRandomRecipes = false;
        rebuild();
    });

    // Initial build after layout
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", rebuild);
    } else {
        rebuild();
    }
})();
