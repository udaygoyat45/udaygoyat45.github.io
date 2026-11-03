# Uday Goyat

Personal site. GitHub Pages serves this repository from the root of `main`.

## Structure

```
index.html                  Home
writing/                    Essays
portfolio/                  Project notes
css/site.css                Shared stylesheet
js/sketch.js                Generative square sketch
assets/                     Images
resume.pdf                  Resume
trng.pdf                    TRNG note (kept at its old URL)
google01ce66a28a4f09ef.html Search Console verification
```

Every page uses the same shell: a square sketch on the left (on top, on a narrow screen) and a text column in the same place. The shell is repeated in each HTML file so the first paint is the finished layout and the sketch can start from a blank canvas. There is no build step.

`js/sketch.js` draws one step per frame after that blank frame. Click, Enter, or Space starts a new drawing. `?seed=N` repeats a field. `prefers-reduced-motion` draws a still instead of animating.

## Preview

From the repository root:

```bash
python3 -m http.server
```

Open http://localhost:8000. Root-relative URLs (`/css/site.css`, `/writing/...`) need that server; opening the files directly will not load the stylesheet or the sketch.

## Old URLs

These addresses still resolve:

- `/writing/best_resources.html`, `/writing/fullmetal.html`, `/writing/generative.html`, `/writing/songs_per_era.html`
- `/writing/syrpent_res.png`
- `/portfolio/friendly_surveillance.html`
- `/resume.pdf`, `/trng.pdf`

Redirects for addresses that used to be pages:

- `/sketch-lab.html` → `/`
- `/writing/first_blog.html` → `/writing/fullmetal.html`
- `/portolio/friendly_surveillance.html` → `/portfolio/friendly_surveillance.html`
