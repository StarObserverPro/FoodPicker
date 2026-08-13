# FoodPicker agent guide

## Scope
This repository is a small mobile-first web app. Keep dependencies at zero unless a future task explicitly requires a build system.

## File ownership
- `foods-data.js`: meal catalogue only. Add dishes here; preserve `{ name, native, search, region }`.
- `styles.css`: visual system and responsive/iPhone layout.
- `app.js`: animation, selection, sharing and image UI.
- `functions/api/images.js`: free image search endpoint.
- `functions/api/image.js`: restricted image proxy; do not turn it into an unrestricted proxy.
- `functions/share.js`: dynamic social/share landing page.

## Invariants
- The picker must remain usable when image APIs/functions fail.
- No paid API key is required for core functionality.
- Non-Chinese dishes should keep a native-language display name and a native/English search term.
- Keep `viewport-fit=cover` and safe-area handling for iPhone portrait layouts.
- Keep motion smooth but respect `prefers-reduced-motion`.
- Do not expose arbitrary URL fetching from the browser or server proxy.

## Before publishing changes
Check JavaScript syntax, verify the three referenced frontend assets exist, and test at approximately 375x667, 390x844 and 430x932 viewports.
