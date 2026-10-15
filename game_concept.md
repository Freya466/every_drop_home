# Every Drop Home — Game Concept

Oct 14, 2026 · @Freya

Every Drop Home is a one-button, side-scrolling web game where a yellow jerry can walks a real-speed route, jumping obstacles to deliver clean water to villages. A casual run lasts about 3 minutes and ends on a donate call-to-action for charity: water.

## Concept and mission fit

The player is the jerry can itself, walking at real human pace on a long route to deliver water. Using the can instead of a person keeps gameplay playful and avoids depicting someone struggling; the serious message is saved for the end screen.

- **Format:** endless side-scroller in the style of the Chrome offline dino game, with original art and a water-based twist
- **Audience:** young people playing on phones or laptops, in short sessions
- **Session length:** about 3 minutes for a casual player, long enough to care and short enough to finish before attention drops
- **Mission link:** the can's water is both its health and its score, so every mistake visibly costs water and every delivery feels like it matters
- **Goal:** the player leaves the game understanding that clean water takes effort to deliver, and taps Donate

## Core loop and controls

The can walks forward automatically; the player's only job is to time jumps.

1. The can auto-scrolls at a constant 1.2 m/s.
2. Tap the screen or press Space to jump; hold for a higher jump.
3. Clear obstacles, collect refills and filters, avoid landing in polluted puddles.
4. Reach a village every 60 m to deliver water and bank points.
5. The run ends when the can is empty, either spilled or delivered.

| Input | Desktop | Mobile |
| --- | --- | --- |
| Short jump | Tap Space | Tap |
| High jump | Hold Space | Press and hold |
| Pause | Esc or P | Pause button, top corner |

## Water system

The can holds 5 water levels, matching a standard 20 L jerry can at 4 L per level. The water gauge is the health bar: the run ends when it reaches zero.

| Event | Effect on water | Notes |
| --- | --- | --- |
| Start of run | 5 levels (20 L) | Full, clean water |
| Hit an obstacle | −1 level (4 L) | Splash animation; 1 s of invincibility after |
| Collect a refill drop | +½ level (2 L) | Every 30 m; cannot exceed 5 levels |
| Land in a polluted puddle | No change in amount | Water turns dirty (brown tint) |
| Pass through a filter | No change in amount | Dirty water turns clean again |
| Deliver at a village | −1 level (4 L) | Points banked, reward message |

Dirty water only matters at delivery: a dirty delivery scores half. This makes the filter before each village worth reaching.

## Speed and camera

The can always moves at 1.2 m/s, average human walking speed, so the distance counter shows meters a real person would walk. Speed never changes; difficulty comes only from obstacle frequency and type.

- A 3-minute run covers about 216 m, so every interval in this plan is sized for that scale
- Perceived speed comes from pixels per second, not meters, so the camera is zoomed in: 1 m ≈ 200–250 px
- At that scale the world scrolls at roughly 240–300 px/s, close to the dino game's starting speed, and the can stays large on screen
- The distance counter sits in the top corner and shows whole meters

## Villages and endings

A village appears every 60 m. Delivery is automatic on arrival: the can drops one level (4 L), a short reward message appears, and the delivery points are banked.

- Example messages: "4 liters delivered! A family can cook and drink today." / "Clean water delivered: that's a day of drinking water for two people." Any statistic used is checked against charity: water's site before launch
- Each village is a 10 m safe zone (5 m either side) with no obstacles, so the moment feels calm

The game has two endings, depending on how the can empties.

| Ending | Trigger | Screen tone | Score effect |
| --- | --- | --- | --- |
| Happy ending | The last water is delivered at a village | Celebration: "You delivered all 20 liters!" | Final total × 1.5 |
| Spilled ending | The last water spills from a hit | Gentle: "The can ran dry before the next village." | No bonus |

A player with 1 level left who reaches a village earns the happy ending just by surviving to it, which gives weaker players a clear goal.

## Scoring

Score rewards water delivered, not water kept, because every run ends with an empty can.

| Source | Points |
| --- | --- |
| Distance | 1 point per 10 m (whole meters, rounded down) |
| Clean delivery | +10 |
| Dirty delivery | +5 |
| Happy ending | Final total × 1.5 |

```latex
\text{Score} = \left( \left\lfloor \frac{d}{10} \right\rfloor + 10\,n_{\text{clean}} + 5\,n_{\text{dirty}} \right) \times m
```

Here d is distance in meters, n\_clean and n\_dirty are the number of clean and dirty deliveries, and m is 1.5 for a happy ending or 1 otherwise.

| Player | Distance | Deliveries | Ending | Score |
| --- | --- | --- | --- | --- |
| Casual | 216 m → 21 pts | 2 clean, 1 dirty → +25 | Spilled (×1) | 46 |
| Skilled | 400 m → 40 pts | 6 clean → +60 | Happy (×1.5) | 150 |

The high score is saved in the browser so players can try to beat it.

## Screens

The game needs four screens; these are the starting point for Step 2 wireframes.

| Screen | Contents | Primary action |
| --- | --- | --- |
| Start | Title, one-line premise, how to jump (tap / Space), high score, charity: water logo | Start walking |
| Gameplay HUD | Distance counter (top corner, right), water gauge (top-corner, left) (5 levels, half-level steps, brown when dirty), villages delivered, pause button | Jump |
| Delivery pop-up | "4 liters delivered!", points earned, short impact line; shown for about 2 s without stopping play | None (auto-dismiss) |
| End screen | Ending type (happy or spilled), distance walked, liters delivered, clean vs dirty deliveries, score and high score, one sourced contrast line about real water collection | Donate (primary), Play again (secondary) |

The Donate button links to charity: water's donation page and appears only after the player has felt the run, never before it.

## Visual direction

The signature yellow jerry can is the hero; everything else stays warm and minimal so it pops.

- **The can:** squash-and-stretch on jumps, a small slosh when it lands
- **Landscape:** flat, warm illustrated layers with parallax; terrain shifts by segment (dry plains → hills → villages with a well)
- **Feedback:** blue splash on hits, sparkle on refills, brown tint for dirty water, a ripple when a filter cleans it. On all these effects on both the jerry can itself, and the water gauge meter.
- **Brand use:** charity: water yellow and the jerry can as anchors; the rest of the art is original
- **Type and tone:** friendly, rounded type; hopeful copy, never guilt-driven

## Branding

The game uses charity: water's extended palette: soft, warm neutrals for the world, navy for structure, and signature yellow saved for what matters most. This keeps screens easy on the eyes while the jerry can and the Donate button stand out.

**Color balance (60-30-10)**

- **60%:** cream, peach and dusty blue for backgrounds and sky
- **30%:** navy and terracotta for UI panels and ground
- **10%:** yellow for the jerry can and main buttons

**Palette**

| Color | Hex | Role |
| --- | --- | --- |
| Signature yellow | #FFC907 | Jerry can, Start and Donate buttons, distance number, small accents |
| Navy | #003366 | HUD panels, headlines, can outline, shading |
| Dusty blue | #77A8BB | Sky, clean water in the gauge |
| Cream | #FFF7E1 | Screen backgrounds, pop-up cards, horizon |
| Peach | #FED8C1 | Far hills |
| Terracotta | #BF6C46 | Ground; darkened for dirty water and puddles |
| Light gray | #CBCCD1 | Rocks |
| Near-black | #1A1A1A | Body text, text on yellow buttons |
| Muted teal | #2A8C88 (shadow #1F6B68, highlight #00A19D) | Bushes |

**Color by element**

| Element | Color treatment |
| --- | --- |
| Sky | Dusty blue fading to cream at the horizon |
| Far hills | Peach |
| Ground | Terracotta |
| Jerry can | Yellow with a navy outline, so it stays crisp against the pale horizon |
| Rocks | Light gray with navy shading |
| Bushes | Muted teal body, darker teal shadow, full brand teal only on a few top edges; darker value signals a taller obstacle |
| Branches | Navy silhouette |
| Clean water (gauge) | Dusty blue |
| Dirty water and puddles | Darkened terracotta (muddy brown) |
| HUD panels | Navy with cream text; distance number in yellow |
| Delivery pop-up | Cream card, navy text, small yellow jerry-can icon or accent bar |
| Start and end screens | Cream background, navy bold headlines |
| Start and Donate buttons | Yellow with near-black text |
| Play again button | Navy outline, navy text |

**Brand touchpoints by screen**

- **Start screen:** charity: water logo above the title, yellow jerry can as the hero image, yellow Start button, hopeful tagline ("Every drop you carry counts.")
- **Gameplay:** the yellow jerry can is on screen the whole game; village wells carry a small yellow jerry-can icon
- **Delivery pop-up:** "4 liters delivered!" plus a real-world impact line sourced from charitywater.org
- **End screen:** logo near the call-to-action; yellow Donate button linking to charitywater.org; the key message "100% of public donations go directly to water projects" directly beneath it

**Typography and tone**

- Clean, bold sans-serif headlines (for example Montserrat or Nunito Sans); regular weight for body text
- Copy is short, hopeful and energetic; the spilled ending encourages another try and is never guilt-driven

**Contrast rules**

- Never white text on yellow; use near-black or navy
- Never yellow text on cream; use yellow as an icon or accent bar instead
- Navy on cream and cream on navy are safe at any size
- Late-game check: in a busy screenshot, the can should catch the eye before the bushes; if not, darken the bushes a step

**Brand checklist**

| Checklist item | Where it appears |
| --- | --- |
| Yellow appears in the UI | Jerry can, Start and Donate buttons, distance number, pop-up accent |
| Logo or name visible | Start screen and end screen |
| Real-world impact message | Delivery pop-ups and the end-screen fact |
| Link or CTA to charitywater.org | Yellow Donate button on the end screen |
| Consistent palette, fonts and tone | Extended brand palette, bold sans-serif, hopeful copy |

The Step 4 brief lists #FFC700 yellow and #00A19D teal. The game uses charity: water's extended palette instead (#FFC907 yellow is visually identical) for a warmer, gentler look, with brand teal kept as a highlight on the bushes.

## Technical build notes

The prototype is a single web page built with HTML, CSS and vanilla JavaScript, with no framework needed.

- **Rendering:** HTML canvas with a `requestAnimationFrame` loop; positions stored in meters and converted to pixels at draw time
- **Collision:** simple rectangle (AABB) checks between the can and each obstacle or pickup
- **Spawning:** a spawner reads the current segment's rules (below) and places objects ahead of the camera
- **Input:** keyboard (Space) and touch (tap / hold) mapped to the same jump logic
- **Storage:** high score in `localStorage`, wrapped in try/catch so the game still runs if storage is blocked
- **Accessibility:** one-button play, a reduced-motion option, readable contrast on the HUD
- **Responsive:** the canvas scales to fit both phone and desktop screens

## Spawn and difficulty plan

The world is built in 60 m segments, one per village, and difficulty steps up each time the player delivers water. Each village is a breather; after it, the terrain visibly gets rougher. This gives the game a natural rhythm and makes each difficulty jump feel earned rather than random.

All positions are in meters, so the plan scales directly with the fixed walking speed of 1.2 m/s.

## Fixed intervals

Villages, refills and filters sit at the same positions every run; puddles are placed randomly within a set window.

| Element | Position | Notes |
| --- | --- | --- |
| Villages | 60, 120, 180, 240 m … | Safe zone with no obstacles from 5 m before to 5 m after, so the delivery moment is calm |
| Refills (+½ level) | 15, 45, 75, 105 m … (every 30 m, offset from villages) | Never land inside a village safe zone |
| Filters | One per segment, about 50 m into it (50, 110, 170 m …) | Just before each village, so a careful player can clean water right before delivering |
| Polluted puddles | None in segment 1; a random spot 20–40 m into each segment after; 2 per segment from segment 4 on | Jumping over is safe. Landing in one taints the water but does not spill it |

Filters stay at one per segment while puddles increase, so clean water gets harder to keep and the filter becomes the thing worth protecting.

## Obstacle frequency by segment

Obstacles spawn with a random gap drawn from the current segment's range, and the range tightens at each village.

Types of obstacles (in increasing height):

- rocks (short jump)
- bushes (high jump)
- branches (don't jump)

| Segment | Distance | Time | Gap between obstacles | Approx. count | New this segment |
| --- | --- | --- | --- | --- | --- |
| 1 | 0–60 m | 0:00–0:50 | 6–9 m (5–7.5 s) | \~6 | rocks only; first 5 m empty |
| 2 | 60–120 m | 0:50–1:40 | 4–7 m (3.3–6 s) | \~9 | bushes (need a held jump); first puddle |
| 3 | 120–180 m | 1:40–2:30 | 3–5 m (2.5–4 s) | \~12 | two-rocks combo; low branches (do not jump) |
| 4 | 180–240 m | 2:30–3:20 | 2.5–4 m (2–3.3 s) | \~15 | Combos (rock → branch, bush → rock); 2 puddles |
| 5+ | 240 m + | 3:20 + | Shrinks 10% per segment, floor 1.8 m | \~16–20 | Weighted toward combos |

The 1.8 m floor (about 1.5 s) is the hardest the game ever gets. It is the shortest gap where a player can land and react to the next obstacle, so skilled runs get intense without becoming impossible.

## Refill and filter risk

Refills get harder to grab as the run goes on; filters follow the same pattern one segment later, so cleaning water stays a real decision in the late game.

| Segment | Refill placement |
| --- | --- |
| 1 | Low, open ground; a small hop collects it |
| 2 | Floating above a rock, so jumping the rock collects it |
| 3+ | High (needs a held jump) or just before a branch, so grabbing it carelessly risks a hit |

## Fairness rules for the spawner

- No obstacle within 1.5 m of a refill, filter or puddle, so pickups never force a guaranteed hit
- No two held-jump obstacles closer than 2.5 m
- No branch directly after a puddle, because jumping the puddle would carry the can into the branch
- 1 second of invincibility after any hit
- Random gaps within each range, so no two runs are identical

## Sanity check against the 3-minute target

A casual player's run lasts about 2:40–3:05, which hits the target. This assumes about one hit per segment (rising to 1.5 later) and half the refills caught, starting from 5 levels.

| After | Water left |
| --- | --- |
| Segment 1 | 4 levels |
| Segment 2 | 2.5 levels |
| Segment 3 | 0.5 levels |
| Segment 4 | Spills out around 190–220 m |

A skilled player who catches every refill and rarely gets hit reaches segment 5 or beyond, where the shrinking gaps eventually end the run.
