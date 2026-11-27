# St. Sebastian Home — Дом Светог Севастијана

One-page static site: plain HTML/CSS/JS, no build step. Open `index.html` in a browser to preview
(the map outlines load from the internet, so preview while online).

```
index.html             The page: header, map, footer. All English and Serbian text is here.
css/style.css          All styling. Colours, header size and language fade speed at the top (:root).
js/map.js              The map intro: cities, highway waypoints, timing (T at the top).
js/lang.js             English / Serbian switch.
images/title-en.svg    "St. Sebastian Home" — traced from the original title artwork.
images/title-sr.svg    "Дом Светог Севастијана" — traced from the same artwork.
images/favicon.svg     Browser tab icon.
```

## How it behaves
- Opens in English with a small, muted Serbian flag top right. Clicking it fades all text into
  Serbian (Cyrillic) and the flag becomes the American one; clicking again goes back.
  A link to `…/?lang=sr` opens straight in Serbian.
- Intro (about 4.5 s), in the style of the Dušan Milojević site: Jackson pops up in red, the outline
  of the American West fades in, and fine dotted lines travel from Phoenix, Las Vegas, Los Angeles,
  San Francisco and Sacramento along the highways, all arriving in Jackson together. Each city appears
  as its line sets off. Header and footer fade in at the end. Visitors who turn off animations in their
  system settings see the finished map straight away.
- No scrolling; everything fits one screen on phones and desktops.

## Editing
- **Texts:** `index.html`. Each text has an English (`data-l="en"`) and Serbian (`data-l="sr"`) version.
- **Header lettering:** the two SVGs in `images/`. Size: `--u` under `.brand` in `css/style.css`.
- **Routes:** in `js/map.js`, `P` holds the waypoints (longitude, latitude) and `ROUTES` lists the
  roads from Jackson. To add a city: add its waypoints to `P`, a route to `ROUTES`, its id to `DEST`,
  and a label (`data-place="…"`) in `index.html`.
- **Timing:** `T` at the top of `js/map.js`.

## Outside sources (loaded by the visitor's browser, cached after the first visit)
- Coastline and national borders — Natural Earth via `world-atlas`, public domain.
- US state lines — US Census via `us-atlas`, public domain.
Both from the jsDelivr CDN. If they fail to load, the routes and cities still show.

## Putting it online (GitHub + Cloudflare)
1. Create a new GitHub repository and upload the *contents* of this folder
   (`index.html` at the top level of the repo, not inside a subfolder).
2. Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
   Framework preset **None**, build command empty, build output directory `/`.
3. After the first deploy: **Custom domains → Set up a custom domain**, enter the domain.
   If the domain's DNS is on Cloudflare, it connects automatically.

Every later push to GitHub goes live by itself within a minute.
