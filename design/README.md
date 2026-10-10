# design

Source artwork for generated static assets.

## og-default.svg → client/public/og-default.png

The site-wide Open Graph card, used whenever a page has no image of its own.
Authored on a 1200×1200 canvas with the card content in the centre 630px band,
because the macOS renderer below fits to the longest edge; the square is cropped
back to 1200×630 afterwards.

The card is drawn at 1200×630 directly and set in Geist, so render it in a
browser that loads the font (e.g. headless Chromium with the Google Fonts
`Geist` stylesheet) and save the screenshot as client/public/og-default.png.

## Brand icons

client/public/favicon.svg is the NUSAKARYA app icon (N symbol on #0f1115).
apple-touch-icon.png (180px) and nusakarya-icon-512.png (the Organization
logo in JSON-LD) are renders of that same SVG.

Product pages do not use this file: they use the cover image uploaded in the
CMS, which is both higher quality and editable without a rebuild.
