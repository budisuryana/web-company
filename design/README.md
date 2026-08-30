# design

Source artwork for generated static assets.

## og-default.svg → client/public/og-default.png

The site-wide Open Graph card, used whenever a page has no image of its own.
Authored on a 1200×1200 canvas with the card content in the centre 630px band,
because the macOS renderer below fits to the longest edge; the square is cropped
back to 1200×630 afterwards.

Regenerate after editing (macOS, no dependencies):

    qlmanage -t -s 1200 -o /tmp/og design/og-default.svg
    cp /tmp/og/og-default.svg.png client/public/og-default.png
    sips -c 630 1200 client/public/og-default.png

Product pages do not use this file: they use the cover image uploaded in the
CMS, which is both higher quality and editable without a rebuild.
