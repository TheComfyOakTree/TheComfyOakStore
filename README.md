# The Comfy Oak Tree — Demo Shop

A storybook woodland jewelry shop: mystery boxes plus rings, necklaces, earrings and bracelets.
This is a **demo**: the basket and checkout work, but no payment is taken and no orders are sent.

## Publishing (GitHub Pages)
Every file sits in this one folder (no sub-folders), so you can upload them all at once:
**Add file → Upload files → choose your files → Ctrl+A → Commit changes**.

## Pages
| Page | What it does |
|---|---|
| `index.html` | Home |
| `mystery-boxes.html` | The 3 boxes with prices, contents, metal preference and *Add to basket* |
| `collections.html` | 17 products with prices and *Add to basket* |
| `checkout.html` | Demo checkout: delivery details, shipping options, order summary and confirmation |
| `about.html`, `reviews.html`, `faq.html`, `shipping-returns.html`, `contact.html` | Info pages |
| `shop.html`, `care-faq.html`, `mystery-box.html` | Old addresses that redirect to the new pages |

## The Hollow theme (brand look)
Taken from *Brand Visual Proposal — The Hollow theme* (`branding/2`).
- `hollow.css` loads last and restyles everything: Bark #2F1E11, Oak #775133, Kraft #BA8552, Parchment #F1E4C6, Moss #5B7A3A, Lantern #D49A3A, Wine #7C1D36, Fern #2F5D3A. Fonts: Lora (headings), Montserrat (logo & labels), Inter (body).
- Logo: `logo-cot.svg` (for light backgrounds) and `logo-cot-light.svg` (for dark backgrounds, used in the header and footer). Icons: `favicon.png`, `apple-touch-icon.png`, `icon-512.png`.
- Brand photos: `hollow-*.jpg`; mystery box photos: `box-acorn.jpg`, `box-sprout.jpg`, `box-old-oak.jpg`.
- To go back to the previous look, delete the `<link rel="stylesheet" href="hollow.css">` line from each page.

## The cozy hillside look (underneath the Hollow theme)
- `cozy.css`: parchment, wooden header, round green doors, arched windows, letters, rolling-hill footer.
- `cozy.js`: fireflies over the hero, round doors that swing open, and the 🔥 hearth button (a crackling-fire sound made in the browser, off until clicked).
- The homepage has a clickable storybook map ("The Hollow beneath the Old Oak") and a fireside corner.

## Things to change before going live
- **Phone number** — still a placeholder (`+44 (0) 123 456 7890`). Change it at the top of `script.js` (`SHOP.phone`).
- **Contact & newsletter forms** — paste a Formspree/Getform link into `SHOP.formEndpoint` in `script.js` to receive messages.
- **Real payments** — replace the demo checkout with Shopify, Etsy, Stripe Payment Links or PayPal.
- **Prices** — product prices live on the *Add to basket* buttons (`data-price`) in `collections.html` and `mystery-boxes.html`. Shipping costs and the £50 free-shipping threshold are in `script.js`.
- **Reviews** — the three reviews are sample text.

## Brand note
Keep the wording "storybook tree-house". Don't call the shop "Hobbit" or use other film or book names: they are trademarks.

## Walk into the shop (home page)
Click the door in the storefront photo (or "Or knock on the door and step inside"). You walk in, then can walk around 5 places:
the shop floor, the mystery box shelf, the treasure chests, the jewellery cabinet and the wrapping counter.
Glowing lanterns open a closer look with "Add to basket". Products, prices and hotspot positions are in `cozy.js`
(`PRODUCTS`, `CABINET`, `STATIONS`): if you change a price in `collections.html`, change it there too.

## Sound credits
- `door-open.mp3`: "Open closet door" by Gravity Sound (https://www.gravitysound.studio/), from Wikimedia Commons
  (https://commons.wikimedia.org/wiki/File:Open_closet_door_(Gravity_Sound).wav), licensed CC BY 4.0
  (https://creativecommons.org/licenses/by/4.0/). Changes: trimmed, made mono, louder, faded out, converted to MP3.
  The credit line in every page footer must stay while this sound is used.
- All other sounds (fire, footsteps, latch, bell, air) are generated in the browser by `cozy.js`.
