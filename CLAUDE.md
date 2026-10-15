# Every Drop Home — Project Brief for Claude Code

A one-button, side-scrolling web game (Chrome-dino style) for charity: water. The player is a yellow jerry can walking at real human pace, jumping obstacles to deliver clean water to villages. A casual run lasts ~3 minutes and ends on a Donate call-to-action.

**Stack:** plain HTML, CSS, vanilla JavaScript (ES modules), HTML canvas. No frameworks, no build step. Serve with a local server (e.g. VS Code Live Server); ES module imports fail over `file://`.

**Priority:** keep it simple and always playable. Done is better than perfect.

---

## Project structure

```
every-drop-home/
├── index.html
├── css/style.css          # screens, buttons, HUD overlay, brand colors
├── js/
│   ├── main.js            # entry point: wires layers, runs the game loop
│   ├── config.js          # ALL tuning numbers (see Game spec below)
│   ├── state.js           # game state object + reset()
│   ├── input.js           # Space / tap / hold → jump intents
│   ├── player.js          # jerry can: jump physics, hitbox, invincibility timer
│   ├── rules.js           # water, deliveries, scoring, endings
│   ├── world/
│   │   ├── spawner.js     # segment rules → places obstacles and pickups
│   │   ├── entities.js    # rock, bush, branch, puddle, refill, filter, village
│   │   └── collision.js   # AABB checks between can and entities
│   ├── render/
│   │   ├── renderer.js    # draws world; camera converts meters → pixels
│   │   └── effects.js     # splash, sparkle, ripple, brown tint
│   ├── ui.js              # DOM screens: start, HUD, delivery pop-up, end
│   └── storage.js         # high score in localStorage (try/catch)
└── assets/{images,audio}/
```

## Architecture rules

- **Only `rules.js` changes water and score.** Collision reports what was hit; rules decides what it means.
- **Renderer and UI only read state**, never change it.
- **Input never moves the can directly**; it sets intents that `player.js` applies.
- **All positions are in meters.** Only `renderer.js` converts to pixels (1 m ≈ 200–250 px).
- **All numbers live in `config.js`.** No magic numbers elsewhere.
- **Use delta time (`dt`, seconds)** for all movement so speed is identical on 60 Hz and 120 Hz screens.
- **HUD, pop-ups and screens are DOM elements** layered over the canvas, not drawn on it.

Game loop order each frame (only while `phase === 'playing'` for steps 1–4):
1. `input.apply(player)` 2. `player.update(dt)` 3. `world.update(dt, state)` + `world.collide(player)` 4. `rules.update(hits, state)` 5. `renderer.draw(...)` 6. `ui.update(state)`

State phases: `start` → `playing` ⇄ `paused` → `ended`.

---

## Game spec

### Movement and controls
- Constant speed **1.2 m/s**; never changes. Difficulty comes from obstacle frequency and type only.
- Tap / Space = short jump (clears rocks). Hold = high jump (clears bushes). Branches hang low: do NOT jump (walk under).
- Pause: Esc or P, or pause button.
- First 5 m of every run are empty.

### Water
- Start: **5 levels** (5 × 4 L = 20 L), clean.
- Hit an obstacle: **−1 level**, then **1 s invincibility**.
- Refill drop: **+½ level**, max 5.
- Land in a polluted puddle: water becomes dirty (amount unchanged). Jumping over is safe.
- Filter: dirty → clean.
- Village: automatic delivery, **−1 level**, points banked, pop-up shown ~2 s (doesn't pause play).
- Run ends when water reaches 0.

### Fixed positions
| Element | Position |
|---|---|
| Villages | every 60 m (60, 120, 180 …); no obstacles from 5 m before to 5 m after |
| Refills | 15 m + every 30 m (15, 45, 75 …); never inside a village safe zone |
| Filters | 1 per segment, ~50 m into it (50, 110, 170 …) |
| Puddles | none in segment 1; random 20–40 m into each later segment; 2 per segment from segment 4 |

### Obstacle spawning (segment = 60 m between villages; difficulty steps up at each village)
| Segment | Distance | Gap between obstacles | New types |
|---|---|---|---|
| 1 | 0–60 m | 6–9 m | rocks only |
| 2 | 60–120 m | 4–7 m | bushes (high jump), first puddle |
| 3 | 120–180 m | 3–5 m | two-rock combo, branches |
| 4 | 180–240 m | 2.5–4 m | combos (rock→branch, bush→rock), 2 puddles |
| 5+ | 240 m+ | shrinks 10% per segment, floor **1.8 m** | weighted toward combos |

Refill placement gets riskier: seg 1 low/open; seg 2 floating above a rock; seg 3+ high (held jump) or just before a branch. Filters follow the same pattern one segment later.

Spawner fairness rules:
- No obstacle within 1.5 m of a refill, filter or puddle.
- No two high-jump obstacles closer than 2.5 m.
- No branch directly after a puddle.
- Random gaps within each segment's range.

### Scoring
```
score = (floor(distance_m / 10) + 10 * cleanDeliveries + 5 * dirtyDeliveries) * multiplier
multiplier = 1.5 if happy ending, else 1
```
High score saved in `localStorage`.

### Endings
- **Happy ending:** last water delivered at a village → "You delivered all 20 liters!", ×1.5 bonus.
- **Spilled ending:** last water spilled from a hit → "The can ran dry before the next village." (gentle, encouraging, never guilt-driven).

### Screens
- **Start:** charity: water logo above title, yellow jerry can hero, how to jump, high score, yellow Start button.
- **HUD:** water gauge top-left (5 levels, half steps, brown when dirty), distance top-right (whole meters), villages delivered, pause button.
- **Delivery pop-up:** "4 liters delivered!" + points + impact line (statistics must come from charitywater.org; use placeholder text until sourced).
- **End:** ending message, distance, liters delivered, clean vs dirty deliveries, score + high score, one sourced fact, **Donate** (primary, yellow, links to https://www.charitywater.org/) and **Play again** (secondary).
- **Play again** resets immediately: distance 0, water 5 clean, score/deliveries 0, entities cleared, back to segment 1. High score persists.

---

## Branding

| Color | Hex | Use |
|---|---|---|
| Signature yellow | `#FFC907` | jerry can, Start/Donate buttons, distance number, accents (~10% of screen) |
| Navy | `#003366` | HUD panels, headlines, can outline, shading, branches |
| Dusty blue | `#77A8BB` | sky (fading to cream at horizon), clean water in gauge |
| Cream | `#FFF7E1` | screen backgrounds, pop-up cards |
| Peach | `#FED8C1` | far hills |
| Terracotta | `#BF6C46` | ground; darkened for dirty water and puddles |
| Light gray | `#CBCCD1` | rocks (navy shading) |
| Near-black | `#1A1A1A` | body text, text on yellow buttons |
| Muted teal | `#2A8C88` / shadow `#1F6B68` / highlight `#00A19D` | bushes |

Balance: 60% cream/peach/dusty blue, 30% navy/terracotta, 10% yellow.

Contrast rules: never white text on yellow; never yellow text on cream; navy↔cream is safe at any size.

Typography: bold clean sans-serif headlines (Montserrat or Nunito Sans via Google Fonts). Tone: hopeful, energetic, never guilt-driven.

Key message under the Donate button: "100% of public donations go directly to water projects."

Effects: blue splash on hits, sparkle on refills, brown tint for dirty water, ripple when a filter cleans it; play on both the can and the gauge. Can has squash-and-stretch on jumps and a small slosh on landing. Include a reduced-motion option.

---

## Build order (keep the game playable after each step)

1. Can jumps on a blank canvas (input + player)
2. Rocks scroll by, collisions detected (world)
3. Water gauge, hits, spilled game over (state + rules + HUD)
4. Villages, deliveries, scoring, happy ending
5. Refills, puddles, filters, then bushes and branches
6. Start and end screens with branding and Donate link
7. Effects, sounds, polish; responsive scaling for phone and desktop

Use simple colored shapes as placeholders until real art is added to `assets/`.