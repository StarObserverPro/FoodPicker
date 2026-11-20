# FoodPicker agent guide

## Scope and baseline

This is a mobile-first app with zero runtime dependencies. Preserve the landing page, literary excerpts, wake animation, artwork, random picker and sharing. The new chat experience turns casual conversation into surreal food illustrations. Do not introduce a normal-food-photo-plus-verdict mode or turn it back into a questionnaire.

The implementation baseline synced deployed Sites source d8c1e7 into GitHub commit 1da0628. Source commits and Sites publication are separate. The 2026-11-19 task is code preparation only; it is not authorization to deploy or evidence that real paid model/image verification has happened.

## Active files

- index.html, psychic-app.js, styles.css: landing, /chat entry, preserved random picker and sharing.
- wake-intro.js / .css, literary-intro.js / .css: existing animations. Preserve the quote/entry wiring and skippability.
- chat.html, chat.mjs, play-chat.css: free conversation, explicit draw action, cancellation, pending-request recovery and JPEG file sharing.
- play/openers.mjs: 240 local opening lines. Loading or changing an opener must not call a model. Preserve stable IDs; reordering lines changes index-based IDs.
- play/library.mjs: 14 styles, 12 mismatch directions, 8 atmospheres. Seeded selection supplies 3 / 4 / 3 candidates, which the model selects and elaborates. These are directions, not fixed food-to-object answers.
- play/schema.mjs, play/prompts.mjs: strict scene schema, validation, chat/planner instructions and deterministic image-prompt compilation.
- server/play-api.mjs, server/provider.mjs: active /api/chat, /api/compose and /api/draw; Responses and direct Images requests. No automatic retries of paid calls.
- server/model-config.mjs: independently replaceable chat, planner and image settings, plus usage cost estimates.
- server/plan-token.mjs, server/play-store.mjs: signed one-hour plans, atomic D1 reservation, request deduplication, accounting and recovery.
- worker/index.mjs, scripts/build.mjs, scripts/bundle-worker.mjs: Worker hosting and allowlisted client build.
- drizzle/0000_food_play.sql: D1 request journal migration.
- functions/api/chat.js, compose.js, draw.js: Pages adapters for the same new backend.
- food-data.js, food-policy.js, meal-parameters.js: preserved menu, native/search names and random-picker policy.

server/food-chat.mjs, chat.js, chat-questions.mjs and the old questionnaire/persona machinery remain compatibility source. There is no active questionnaire entrance or /api/legacy-chat deployment route. /api/chat now uses the new protocol; do not reconnect the old paid handler silently. Historical image/proxy Functions are not mounted by the active Sites Worker.

## Creative contract

- The same eccentric, underrecognized painter speaks in chat, drawing narration and captions. Chat can leave the second sentence slightly open without requiring a follow-up question. Keep the eccentricity in the painter's observations and imagined objects.
- Prefer explicit dishes, ingredients, tastes and exclusions; later corrections take priority. With no clear clues, allow a playful guess and broaden cuisine choices. Language or temporary mood must not become nationality, fixed personality or psychological diagnoses.
- Keep food real and recognizable. Build one main mismatch with a concrete bridge from the chat and at most one small echo. Describe visible containment, replacement, support, scale or connection; simply placing unrelated objects beside one another is insufficient.
- Determine the relationship before choosing a compatible medium. A compiled prompt may start with a short medium anchor, followed immediately by the food and exact relationship. Style must not erase the joke.
- Preserve anchorObject, transformation, food features and the bounded freedom region in the prompt. Use medium and brushwork to control detail; do not claim that painterly simplification directly changes API rates.
- Validate exact user-quote evidence, sampled library IDs and different mismatch IDs for variants. Variants preserve the food and conversation hash; changed restrictions require a new plan.
- Defaults: gpt-6-luna for chat/planning; gpt-image-2.6-flare, 1024x1536, medium, JPEG for drawing. Change models in configuration rather than scattering literals.
- Limits: 600 Unicode code points per user message, six user turns, 200 code points per chat reply, 400 words and 2,600 code points per image prompt. Do not silently truncate the core relationship.

## Runtime and cost invariants

- The random picker works without a paid API key and during AI outages. Report failures honestly; do not fabricate a successful model reply or present a stock image as generated.
- Credentials stay server-side. Publish only allowlisted client assets, never environment files, provider response bodies, arbitrary fetch proxies or secrets.
- Production requires FOOD_PLAY_DB. FOOD_ALLOW_EPHEMERAL_STATE=true is an explicit local-preview fallback, not cross-instance quota or deduplication.
- Preserve the hosting project ID and D1 FOOD_PLAY_DB / R2 FOOD_IMAGES bindings. Keep Worker hosting. R2 recovers paid images across isolates; missing storage must not trigger regeneration.
- Draw deduplication uses the signed plan ID, not the freely changeable requestId. Sharing/saving reuses the finished image; a new mismatch is a new paid request.
- Reserve before calling, reconcile from usage, and retain reservations when outcomes are unknown. Preserve paid results on bookkeeping acknowledgement failures; do not downgrade complete to failed. Stale pending must report unknown rather than stay busy indefinitely or regenerate.
- App budget estimates are not provider hard spending caps. Keep assumptions in docs/models-and-costs.md. Unknown usage is not zero cost; never count reasoning output twice.
- Render model text with textContent and check JPEG format. Share the image file, not conversations, plans or API metadata. Never cache API POSTs in the Service Worker.

## Preserve the existing experience

- Keep the complete world catalogue and China-oriented default in food-policy.js. Non-Chinese dishes retain native display names and native/English search terms.
- Preserve viewport-fit=cover, iPhone safe areas and prefers-reduced-motion. Wake intro remains skippable and must not block the page on failure.
- For wake changes, keep “吃什么了吗？” in one cue, with smaller “了吗？” anchored below-right. Check local-time meal wording and skip/completed transitions.
- Use natural contemporary Chinese. Avoid forced jokes, insults, invented user histories, canned verdicts, psychological labeling and habitual advice endings. Preserve attributed literary excerpts.

## Verification and handoff

Run relevant Node regressions, syntax checks and the dependency-free build. Verify referenced client assets exist and secrets/source documentation are not public. Before publication, check default/world menu behavior, IME/keyboard input, reduced motion and approximately 375×667, 390×844 and 430×932 layouts.

Mocks validate protocol and fee boundaries, not model availability or image quality. For authorized releases, verify bindings/migration, real usage, relationship fidelity and phone sharing. Report the actual browser/image scope and keep deployment notes aligned with the release being verified.
