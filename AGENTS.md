# FoodPicker agent guide

## Scope
This repository is a small mobile-first web app. Keep dependencies at zero unless a future task explicitly requires a build system.

## File ownership
- `food-data.js`: complete meal catalogue and native/search-name mappings. Preserve the legacy world catalogue instead of deleting regional data.
- `food-policy.js`: availability and menu-pool policy. The China-oriented default pool belongs here; keep international-only dishes recoverable.
- `styles.css`: visual system and responsive/iPhone layout.
- `app.js`: legacy bundled animation, selection, sharing and image UI.
- `app-core.js`: current random selection and core interaction.
- `app-media.js`: current background animation and image UI.
- `app-share.js`: current sharing and startup logic.
- `functions/api/images.js`: free image search endpoint.
- `functions/api/image.js`: restricted image proxy; do not turn it into an unrestricted proxy.
- `functions/share.js`: dynamic social/share landing page.

## Invariants
- The picker must remain usable when image APIs/functions fail.
- No paid API key is required for core functionality.
- Non-Chinese dishes should keep a native-language display name and a native/English search term.
- The default China pool should contain all China-region dishes plus only deliberately approved international dishes that are reasonably obtainable in China.
- Do not delete harder-to-find international dishes from the source catalogue; keep them available to the international pool.
- Keep `viewport-fit=cover` and safe-area handling for iPhone portrait layouts.
- Keep motion smooth but respect `prefers-reduced-motion`.
- Do not expose arbitrary URL fetching from the browser or server proxy.

## Before publishing changes
Check JavaScript syntax, verify the referenced frontend assets exist, and test at approximately 375x667, 390x844 and 430x932 viewports. Also verify the default menu is China-oriented and `?menu=world` restores the full catalogue.

## Product copy
- Read the current UI wiring before editing copy. `psychic-app.js` overrides engine question text; `persona-art.js` supplies the displayed persona verdicts. Engine hints/subtitles and legacy bundled UI are not currently displayed.
- Use contemporary conversational Chinese for questions and controls. A little regional phrasing is welcome; do not stack dialect particles, insults, or exaggerated world-weariness to manufacture a voice.
- Keep questions and verdicts grammatically complete. Options may omit an obvious subject, but must answer the question and retain the meaning of their existing axis/mood weights.
- Persona verdicts may use brief scenes and character actions. Avoid invented personal histories, absolute personality diagnoses, flattering comparisons, social-status judgments, and habitual advice endings.
- Check every dynamic word in context. Do not insert abstract labels as though they were physical objects, times, or actions unless the sentence supports that reading.
- Keep errors and share controls immediately understandable. Preserve attributed literary excerpts as quotations rather than rewriting them in the product voice.
- With each PR, update relevant documentation to match the implemented behavior and record material verification limits.
