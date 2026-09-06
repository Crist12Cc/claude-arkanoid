# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repo is a placeholder for an Arkanoid/Breakout game to be built with plain HTML, CSS, and JavaScript — zero dependencies, playable in the browser. **The game itself is not implemented yet.** There is no `index.html`, no build tooling, no package manager config, and no tests. Not a git repository.

## What currently exists

- `assets/spritesheet-breakout.png` — the sprite sheet image (paddle, ball, colored blocks, explosion animation frames).
- `assets/spritesheet.js` — sprite-drawing helpers already written against that sheet:
  - `SPRITES` / `EXPLOSION_FRAMES`: pixel coordinates (sx, sy, sw, sh) into the sheet for each sprite (paddle, ball, block colors, per-color explosion frame sequences).
  - `loadSpritesheet(cb)`: loads the PNG once into an offscreen canvas, caching subsequent callback invocations (`ssLoaded`/`ssCallbacks`) so the image is decoded only once.
  - `drawSprite(ctx, name, x, y, w, h)`: draws a named sprite; block colors are addressed as `block_<color>` (e.g. `block_red`), which resolves into `SPRITES.blocks`.
  - `drawFrame(ctx, frame, x, y, w, h)`: draws a single explosion animation frame object directly.
- `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3` — sound effects, not yet wired into any code.

## Working in this repo

- Since there is no game loop, canvas setup, or HTML entry point yet, building the game means creating these from scratch — there is no existing architecture to follow beyond the sprite helpers above.
- Keep to the zero-dependency constraint stated in the README: plain HTML/CSS/JS, no frameworks, no npm packages, no bundler.
- Reuse `assets/spritesheet.js` as-is for rendering rather than re-deriving sprite coordinates; call `loadSpritesheet()` before the first `drawSprite`/`drawFrame` call.
- There are no build, lint, or test commands to run — verify changes by opening the HTML file directly in a browser.
