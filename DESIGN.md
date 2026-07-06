# Founder Arcade — Design Direction

## Core Idea

Founder Arcade is a comedy visual novel + arcade interlude game about trying to make money without losing your mind.

The game should feel funny, handmade, readable, and character-driven.

It should **not** feel like:
- a generic neon hacker dashboard
- a SaaS app
- a crypto casino
- a random glowing arcade UI
- a prototype with brown boxes everywhere

The game should feel like:
- a black-and-white cartoon storyboard
- a visual novel made from sketchbook drawings
- a funny web game with simple arcade interludes
- a playable comic strip about being cooked by projects

## Visual Style

### Main visual direction

Use a mostly **black, white, and grayscale** visual system.

The world should look like rough cartoon drawings:
- white / off-white backgrounds
- black outlines
- gray shading
- simple hand-drawn shapes
- minimal color
- character sprites as the main visual interest

The style should feel like:
- storyboard sketches
- old Flash cartoon energy
- webcomic panels
- simple educational cartoon characters
- rough but intentional

### Color

Mostly:
- white / off-white
- black
- charcoal
- light gray
- medium gray

Accent colors should be rare.

Allowed accents:
- Money: muted yellow/gold
- Energy: muted green
- Hype: muted blue
- Danger / damage: muted red

Use accents only for:
- HUD stats
- pickups
- damage feedback
- important UI states

Do not use random neon gradients.

## Layout

### Visual Novel scenes

VN scenes should use:

1. Full-screen background
2. Character sprite in foreground
3. Bottom dialogue box
4. Speaker name tag
5. Choice buttons above dialogue or inside a clean choice layer
6. Small HUD in a corner

The background can be a simple grayscale line-art scene.

Example background types:
- messy bedroom desk
- coworking cafe
- pitch room
- bug chaos screen
- demo day stage

The scene should feel like a comic panel, not a dashboard.

### Dialogue Box

The dialogue box should:
- sit near the bottom
- be readable
- use off-white or white fill
- have black border
- use subtle gray shadow
- feel like a comic / visual novel text box

Avoid:
- excessive transparency
- glowing borders
- cyberpunk panels
- random layered boxes

### Character Sprites

Character sprites are the soul of the game.

Use simple full-body cartoon sprites:
- neutral
- explaining
- panicked
- celebrating
- skeptical

Characters should be shown large enough to matter.

The active speaker should be bright and clear.
Non-speakers can be dimmed slightly.

## HUD

Visible stats only:

1. Money
2. Energy
3. Hype

HUD should be small and game-like.

Recommended layout:
- Top-left: player card / avatar
- Top-right: Money
- Small bars for Energy and Hype

Do not show extra stats like:
- Delusion
- Technical Debt
- Reputation

If needed internally, map them into Money / Energy / Hype.

## Minigame Style

Minigames should also use the black/white sketchbook direction.

They should not look like unfinished debug canvases.

### Shared minigame frame

Each minigame should have:
- clear title
- short funny subtitle
- readable score/timer
- clean play area
- result screen

The play area should feel like a drawn game board:
- black outlines
- white/gray background
- simple shaded entities
- only pickups/enemies use small color accents

## Minigame Rules

### Investor Pong

Investor Pong should feel stable and smooth.

No teleporting ball.
No shaking at the start.
No multiple animation loops.

Use:
- stable paddle
- stable ball
- predictable reset after misses
- screen shake only on actual miss/hit if needed

### Scope Creep Maze

Scope Creep Maze should feel like a simple maze game.

Problems to avoid:
- enemies stuck in place
- enemies floating randomly without purpose
- unreadable icons
- debug-looking grid

Enemies:
- Scope Creep
- Bug
- Burnout
- Notification

They should:
- move through open tiles
- not pass through walls
- occasionally move toward the player
- be visibly dangerous

Player should:
- collect Users, Feedback, Money, Focus
- lose Energy/hits when touching enemies
- get brief invulnerability after damage

Focus Mode:
- slows enemies
- visibly changes the enemy state

### Bug Blaster

Bug Blaster should feel like a simple shooter.

Problems to avoid:
- screen shaking at game start
- weird jitter
- enemies spawning too close to the bottom
- unclear projectiles
- unclear hit feedback

Only shake the screen when:
- the player gets hit
- an enemy reaches production
- a boss appears

Do not shake at game start.

## Game Feel

The game should feel alive through:
- funny writing
- visible stat changes
- small reaction lines
- clean result screens
- simple transitions
- achievement popups
- character expression changes

Do not rely on visual effects to make it fun.

The comedy should come from:
- choices
- consequences
- character reactions
- absurd startup/project situations

## Writing Tone

Tone should be:
- funny
- specific
- relatable
- slightly pathetic
- not too insider
- not mean-spirited

Good joke territory:
- redesigning instead of shipping
- vague build-in-public posts
- fake productivity
- cofounders who are “idea people”
- bugs before demo day
- scope creep
- investor questions
- making $0 but having “strong vibes”
- adding one more feature
- opening Figma instead of fixing the bug

## Example Ending Tone

### Actually Built Something Useful

Against every incentive, you shipped a thing people understand.

Suspiciously wholesome.

### LinkedIn Thought Leader

You made $0, but your post about resilience did numbers.

### Died in Tutorial Hell

You watched 47 videos and built one navbar.

## Current Priority

Do not add more features.

Priority order:
1. Fix broken minigame behavior.
2. Make the visual style coherent.
3. Use character sprites in VN scenes.
4. Make result screens funny and satisfying.
5. Polish only after the game feels stable.