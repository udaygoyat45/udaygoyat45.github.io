/**
 * Site shell — single place for sidebar, paths, analytics, sketch boot.
 *
 * Usage (site root):
 *   <div id="site-sidebar" data-root="./"></div>
 *   …
 *   <script src="site.js"></script>
 *
 * Usage (writing/, portfolio/):
 *   <div id="site-sidebar" data-root="../"></div>
 *   …
 *   <script src="../site.js"></script>
 */
(function (global) {
    "use strict";

    var P5_CDN = "https://cdn.jsdelivr.net/npm/p5@1.11.2/lib/p5.min.js";
    var GOAT = "https://proug.goatcounter.com/count";

    function normalizeRoot(root) {
        if (root == null || root === "") return "./";
        return root.slice(-1) === "/" ? root : root + "/";
    }

    function getRoot() {
        var mount = document.getElementById("site-sidebar");
        var attr = mount && mount.getAttribute("data-root");
        return normalizeRoot(attr);
    }

    function href(path) {
        return getRoot() + String(path).replace(/^\//, "");
    }

    function renderSidebar() {
        var mount = document.getElementById("site-sidebar");
        if (!mount) return;

        mount.className = "site-sidebar";
        mount.innerHTML =
            '<a class="site-sidebar__sketch-link" href="' +
            href("index.html") +
            '">' +
            '<div id="sketch-holder" class="sketch-holder"></div>' +
            "</a>" +
            '<div class="site-sidebar__meta">' +
            '<h1 class="font-display site-sidebar__name">Uday Goyat</h1>' +
            '<nav class="site-sidebar__nav" aria-label="Social">' +
            "<ul>" +
            '<li><a href="' +
            href("resume.pdf") +
            '" target="_blank" rel="noopener">Resume</a></li>' +
            '<li><a href="https://www.linkedin.com/in/udaygoyat" aria-label="LinkedIn">LinkedIn</a></li>' +
            '<li><a href="https://www.youtube.com/channel/UCB9zbZBY_6MBwtI3PH1pjWw" aria-label="YouTube">YouTube</a></li>' +
            '<li><a href="https://github.com/udaygoyat45" aria-label="GitHub">GitHub</a></li>' +
            "</ul>" +
            "</nav>" +
            "</div>";
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement("script");
            s.src = src;
            s.async = false;
            s.onload = function () {
                resolve();
            };
            s.onerror = function () {
                reject(new Error("Failed to load " + src));
            };
            document.body.appendChild(s);
        });
    }

    function bootSketch() {
        if (!document.getElementById("sketch-holder")) return Promise.resolve();
        return loadScript(P5_CDN).then(function () {
            return loadScript(href("perlin_lines.js"));
        });
    }

    function bootAnalytics() {
        if (document.querySelector("script[data-goatcounter]")) return;
        var s = document.createElement("script");
        s.setAttribute("data-goatcounter", GOAT);
        s.async = true;
        s.src = "//gc.zgo.at/count.js";
        document.head.appendChild(s);
    }

    /** Home crumb for subpages: <a class="back-home" data-site-home></a> */
    function wireHomeLinks() {
        var links = document.querySelectorAll("[data-site-home]");
        for (var i = 0; i < links.length; i++) {
            links[i].setAttribute("href", href("index.html"));
            if (!links[i].textContent.trim()) {
                links[i].textContent = "← home";
            }
        }
    }

    function boot() {
        renderSidebar();
        wireHomeLinks();
        bootAnalytics();
        bootSketch().catch(function (err) {
            console.error(err);
        });
    }

    global.Site = {
        href: href,
        getRoot: getRoot,
        boot: boot,
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})(window);
