# St. Sebastian Home — Дом Светог Севастијана

One-page static site: plain HTML/CSS/JS, no build step. Open `index.html` in a browser to preview
(the globe's coastlines and the header font load from the internet, so preview while online).

```
index.html             The page: header, globe, footer. All English and Serbian text is here.
css/style.css          All styling. Colours, header size and language fade speed at the top (:root).
js/globe.js            The intro: Europe, the line to Jackson, the globe. Timing (T) at the top.
js/regions.js          Outlines of Austria-Hungary (1914), Bosnia and Herzegovina, Herzegovina,
                       Boka Kotorska; label positions; start and end of the line.
js/lang.js             English / Serbian switch.
js/vendor/             d3-geo map library (ISC licence, see LICENSE-d3.txt).
images/favicon.svg     Browser tab icon.
```

## How it behaves
- Opens in English with a small, muted Serbian flag top right. Clicking it fades all text into
  Serbian (Cyrillic) and the flag becomes the American one; clicking again goes back.
  A link to `…/?lang=sr` opens straight in Serbian.
- Intro (about 5 s): close-up of Europe with Austria-Hungary in grey, Bosnia and Herzegovina hatched
  (fading towards the north), Herzegovina and Boka Kotorska in red. A red line then follows the great
  circle to Jackson, California, while the camera pulls back to the whole globe. Header and footer
  fade in at the end. Visitors who turn off animations in their system settings see the final globe
  straight away.
- No scrolling; everything fits one screen on phones and desktops.

## Editing
- **Texts:** `index.html`. Each text has an English (`data-l="en"`) and Serbian (`data-l="sr"`) version.
- **Intro timing:** `T` at the top of `js/globe.js`. `ARCH` there sets how round the arch of the
  line looks on the final globe.
- **Colours:** `--red`, `--ink`, `--bg` in `css/style.css`; globe colours (`INK`, `RED`) in `js/globe.js`.
- **Borders:** `js/regions.js` — longitude, latitude pairs. Sea-side edges sit slightly offshore on
  purpose; the globe trims every region to the real coastline.

## Outside sources (loaded by the visitor's browser)
- Header font **Monomakh** — Google Fonts, SIL Open Font License.
- Coastlines — Natural Earth (public domain) via `world-atlas` on the jsDelivr CDN.
  If they fail to load, the globe still shows the regions and the line.

## Putting it online (GitHub + Cloudflare)
1. Create a new GitHub repository and upload the *contents* of this folder
   (`index.html` at the top level of the repo, not inside a subfolder).
2. Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
   Framework preset **None**, build command empty, build output directory `/`.
3. After the first deploy: **Custom domains → Set up a custom domain**, enter the domain.
   If the domain's DNS is on Cloudflare, it connects automatically.

Every later push to GitHub goes live by itself within a minute.
