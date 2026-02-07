# CLAUDE.md

## Project Overview
Chisberg Ink — an interactive "flower arranger" web app where users drag, drop, and rotate
flower sticker images onto a vase card. Built as an art/design toy.

## Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19, TypeScript
- **Canvas**: Konva / react-konva for 2D canvas rendering (drag, rotate, layering)
- **Styling**: Tailwind CSS v4 (via PostCSS)
- **Deployment**: Vercel (uses @vercel/analytics)
- **Font**: Junicode Condensed Italic (custom, loaded externally)

## Project Structure
- `src/app/page.tsx` — Redirects to `/flower-arranger`
- `src/app/flower-arranger/page.tsx` — Main page: flower definitions, state management, localStorage persistence
- `src/components/flower-arranger/ArrangerCanvas.tsx` — Konva Stage with 3 layers: logo/text, cards (sticker sheet + vase), draggable flowers
- `src/components/flower-arranger/DraggableFlower.tsx` — Individual draggable/rotatable flower component
- `src/components/flower-arranger/FlowerPicker.tsx` — (exists but unused currently)
- `src/components/flower-arranger/layout.ts` — All layout constants (image dimensions, padding, positions) in native pixel units
- `public/flower-arranger/` — Static assets: flower PNGs, vase JPG, sticker sheet, logo, background tile

## Key Architecture Details
- Flower positions are stored as **fractions (0-1)** of stage dimensions, not pixels — enables responsive scaling
- Layout uses a coordinate system based on native image dimensions (defined in `layout.ts`), then scales uniformly to fit the viewport
- Three Konva layers: (1) logo/instructions, (2) sticker sheet + vase, (3) draggable flowers
- State persisted to localStorage under keys `flower-arranger-positions` and `flower-arranger-artist-name`
- ArrangerCanvas is dynamically imported with `ssr: false` (Konva requires DOM)

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint

## Style Notes
- No tests currently
- Minimal app — keep things simple, avoid over-abstraction
