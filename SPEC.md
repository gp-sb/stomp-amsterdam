# STOMP — site redesign spec (round 2)

A queer line-dancing club in Amsterdam. Western dancehall energy + pride. Modeled on
the *flow* of gonecountry.nl, but original content, branding, and a louder, queerer
visual language. Single rich homepage (first-timers need nothing else) plus a clear
menu overlay for focused navigation.

## Visual language

- **Palette:** rodeo red (`#d63a26`), bone/paper (`#f5ecd8`), near-black (`#15110f`),
  denim blue + butter (the "two ways to dance" cards), and a **pride gradient** used
  sparingly as an animated shimmer on key words and dividers.
- **Type:** `Anton` (huge condensed display), `Inter` (body/UI), `Caveat` (hand-written
  script for playful asides — "yee + haw", "new!").
- **Motion:** GSAP + ScrollTrigger. Kinetic split-letter headlines, marquees, parallax
  boots & stars that drift as you scroll, section reveals, hover micro-interactions,
  pride shimmer. All gated behind `prefers-reduced-motion`.

## Homepage sections (top -> bottom)

1. Nav + full-screen menu overlay.
2. Hero (red) — kinetic headline, video placeholder, drifting boot/stars, next events.
3. Three key links — Donate / Instagram / WhatsApp.
4. Two ways to dance — THE PARTY vs THE CLASS.
5. About snippet + READ OUR FULL STORY.
6. Schedule — Luma-powered list with ticket links.
7. Tutorials feed — gallery of dances.
8. Sister clubs — queer line dancing worldwide.
9. Private events — media-led inquiry.
10. Footer — about + PAGES + FIND US + OTHER.

## Content model

All copy lives in `data/content.json` (keys: `brand`, `hero`, `keyLinks`,
`waysToDance`, `about`, `events`, `tutorials`, `sisterClubs`, `privateEvents`,
`footer`). The frontend is fully data-driven.

## Luma integration

- Admin stores per event: a lu.ma URL, a type, and a status. Title/date/time/venue/
  cover/description come from Luma.
- `api/luma.js` reads `LUMA_API_KEY`: `entity/lookup?slug=` -> event id, then
  `event/get?id=` for details. Client falls back to stored fields without the key.
- Luma has no sold-out field, so status is a manual admin toggle; tickets link to lu.ma.

## What needs YOU before fully live (next round)

1. Live editing without git pushes -> a shared store (Vercel KV / Upstash Redis).
2. Luma Plus plan + `LUMA_API_KEY` env var in Vercel.
3. Tutorial view tracking -> same store.
4. Real media to replace placeholders.
