# Veil Logo & Brand Identity

## Concept

Veil is a privacy-first AI DeFi agent. The logo should evoke:
- **Concealment** — something partially hidden, layered
- **Precision** — engineering, cryptographic rigor
- **Motion** — flowing, alive, not static

## Visual Direction

Geometric, orbital, rotating elements. Concentric circles with intersecting lines — evoking encryption, hidden networks, stealth.

## Reference: desengs.com

Source: [github.com/remvze/desengs](https://github.com/remvze/desengs)

The **Lines component** (`src/components/lines.astro`) is the primary reference:
- Pure CSS rotating orbital diagram
- Concentric circles with crossing geometric lines
- Slow rotation (120s and 180s infinite cycles)
- Dashed border rings, hatched pattern outer ring
- Dark semi-transparent background with neutral gray borders
- Uses `@keyframes rotate` for infinite slow rotation
- Includes `mask-image` radial gradient for fade effect

### Implementation Plan

1. Adapt the orbital/geometric animation as the Veil hero visual
2. Place in landing page hero section (above or behind the headline)
3. Use the project's neutral color ramp (c3-c6) — no blue
4. Slow, meditative rotation to suggest hidden activity
5. Pure CSS implementation — no JS animation libraries needed

### Secondary Effects from desengs

- **ShinyText** (`src/components/shiny-text/`) — sweeping light shimmer across text via CSS `background-clip: text` + `@keyframes shine`. Good for the "Veil" wordmark or hero headline.
- **Scroll-responsive rotation** (`src/components/logo/logo.tsx`) — Framer Motion `useScroll()` + `useSpring()` for scroll-linked logo rotation.

## Color Palette

Stay within the Veil design system:
- Lines/strokes: `var(--c3)` to `var(--c5)`
- Animated comet/glow: `var(--c6)` to `var(--c8)`
- Background: `var(--c1)` (near black)
- No accent blue in the logo

## Typography

- Wordmark: Geist Mono, uppercase, tight tracking
- Display: Geist Pixel Square (hero only)

## File Locations

When implemented:
- SVG logo: `public/logo.svg`
- Animated hero component: `src/components/ui/OrbitalLogo.tsx`
- CSS animations: `src/app/globals.css` (add orbital keyframes)
