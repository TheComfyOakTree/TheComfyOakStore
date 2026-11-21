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

## The cozy hillside look
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
