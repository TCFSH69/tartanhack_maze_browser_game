# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based maze game built as a single `index.html` file (no build system, no dependencies). The player navigates a 100x100 randomly generated tile map using keyboard (WASD/arrows) or touch input. The core mechanic is **microphone-driven "sonar"**: the player's mic volume (quantized 0–10) determines how many tiles ahead are illuminated in the player's facing direction, with walls shown in red when hit by the light ray.

## Running

Open `index.html` directly in a browser, or serve it with any static file server (e.g., `python3 -m http.server`). Microphone access is required — the game starts when the user clicks "Start Game" and grants mic permission.

## Architecture (single file)

All code lives in `index.html` in one `<script>` block, organized into sections:

1. **Initialization** — Canvas, map dimensions (`mapWidth`/`mapHeight`), `player`/`goal` objects, audio globals
2. **Map generation** (`generateMap`) — Random 20% wall density with border walls; guarantees open start at (1,1) and places a goal at least 10 tiles away
3. **Audio pipeline** (`initAudio`, `updateMic`) — Web Audio API: `getUserMedia` → `AnalyserNode` → frequency data → average amplitude → `micLevel` (0–10)
4. **Game logic** (`move`) — Grid-based movement with collision detection and win condition
5. **Rendering** (`draw`, `gameLoop`) — Camera follows player; only visible tiles are drawn; sonar raycasting illuminates tiles in facing direction based on `micLevel`

## Key Mechanics

- **Sonar lighting**: In `draw()`, a ray is cast from the player in their last-moved direction for `micLevel` tiles. Yellow highlights path tiles; red highlights the first wall hit. No sound = no visibility ahead.
- **Camera**: Viewport is centered on the player with pixel offsets calculated each frame.
- **Input**: Keyboard (WASD/arrows) and touch (tap relative to screen center for 4-directional movement).

## Code Language

Comments in the source are written in Traditional Chinese (繁體中文).
