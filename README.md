# Your Little World

Your Little World is an original local-first consistency game. Completing a scheduled real-life activity changes the hillside. Each habit reserves a clearing, and the cottage and common areas grow as several habits contribute.

## Run locally

Use Node.js 22.13+ on the Node 22 line or Node.js 24+. Node 20.20 is also supported for local development.

```sh
npm ci
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Vite with hot reload and the development time-travel tool |
| `npm run typecheck` | Check source, tests, and configuration with strict TypeScript |
| `npm run lint` | Run ESLint with TypeScript and React rules |
| `npm test` | Run Vitest unit and React Testing Library interaction tests |
| `npm run test:watch` | Run those tests as files change |
| `npm run build` | Type-check and build the production PWA into `dist/` |
| `npm run preview` | Serve the existing production build |
| `npm run test:e2e` | Build and test the production app in desktop and mobile Chromium |

Install Chromium once with `npx playwright install chromium`. The end-to-end suite starts a local preview on port 4173.

### Play through construction locally

In the dev server, open **Development time travel** beneath the current view. Add a daily habit, complete it, and advance the simulated date to try later stages. Switching back to real time restores the clock and keeps the sessions you logged. Use a separate browser profile or export a backup before experimenting with an existing world. The control and its module are excluded from production builds.

For the offline experience, build and open the production preview online once. After the service worker activates, the four views, terrain and cottage art, and local check-ins work offline. Install from your browser’s controls where offered. The worker installs updated caches in the background and uses the new build on the next reload. Check-ins and settings are saved as soon as their actions succeed.

## Cloudflare Pages deployment

### Git integration

In Cloudflare’s Workers & Pages dashboard, create a Pages project from your Git repository. Select your production branch and use these settings.

| Setting | Value |
| --- | --- |
| Framework preset | React (Vite) |
| Root directory | Repository root |
| Build command | `npm run build` |
| Build output | `dist` |
| Node.js | Set `NODE_VERSION` to 22 or 24 on a supported current release |

The build is static and hash routes work with a single entry page. See [Cloudflare’s React deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/) and its [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/).

### Direct Upload

Run `npm ci` and `npm run build`, then upload the `dist` folder to a Direct Upload Pages project in the dashboard. With Wrangler, authenticate and run `npx wrangler pages deploy dist`. See [Cloudflare’s Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## Feature checklist

- [x] Responsive world-first layout with an expandable mobile habits panel and a bounded zoomable map
- [x] Habit creation and editing, category suggestions, chosen weekdays, minute minimums, pause and resume
- [x] One qualifying check-in per scheduled local date, intentional skips, and undo from today or recent history
- [x] Three reservable clearings, eight permanent construction stages, and seven configured building archetypes
- [x] Per-building vitality, recovery, and two shared world milestones that require contributions from multiple habits
- [x] Journal, streaks, completion rate over up to 30 scheduled opportunities, lifetime totals, and recent history
- [x] Local migration, validated JSON export and restore, and coordinated writes where browser Web Locks are available
- [x] Original artwork, reduced-motion preferences, optional completion sound, installable PWA, and offline play
- [x] Development-only time travel, unit and interaction coverage, and a browser test that advances a guitar habit across calendar dates

## Architecture

```text
src/
  app/           Routing, app state, branding, accessibility, and development clock
  components/    Shared controls, check-ins, and the habit editor
  domain/        Date semantics, schedule history, world actions, progression, and vitality
  data/          Local repository, backup validation, and v1 ledger migration
  views/         World, Habits, Journal, Progress, and Settings
  world/         SVG viewport, authored scene coordinates, camera, layers, and building visuals
public/world/    Optimized terrain and cottage artwork
tests/e2e/       Production navigation, offline play, and guitar construction lifecycle
```

- **Domain.** Commands receive an explicit instant. A completion stores the scheduled local date, UTC timestamp, tracking unit, and amount. Schedule changes apply prospectively. Editing or pausing after a resolved check-in starts the next day.
- **Consistency.** Intentional skips, paused dates, and unscheduled dates are excused in rate, streak, and vitality calculations. Today becomes a miss only after the local day ends. Changing time zone applies to future check-ins and keeps existing date labels.
- **Construction.** `src/domain/progressionConfig.ts` contains the eight thresholds (1, 2, 4, 7, 10, 14, 21, 35), reveal stage, archetype registry, and shared goals. A one-time journal event preserves each achievement. Undo corrects the session count and keeps earned construction and shared upgrades.
- **Storage.** The repository saves one versioned snapshot to browser storage and keeps future synchronization behind the repository interface. Restore validates the backup and asks for confirmation before replacing the local world. A failed read leaves the saved copy available for recovery.
- **Rendering.** The view maps progression to scene data. `WorldScene` composes terrain, cottage, construction clearings, stage geometry, vitality, ambient effects, and accessible overlays in one coordinate system. Interactive buildings share their base footprint as stage pieces are added. Stable artwork and the SVG objects stay aligned during pan and zoom.
- **Brand.** Change `src/app/brand.ts` to update the app title, description, theme metadata, and manifest.

## Known limitations and next milestone

- The prototype has three persistent sites and shows 14 days of per-habit history. Device storage is per browser origin. Use JSON backup for transfer or recovery.
- The supplied attachment contained the text brief. The terrain and cottage were composed from its written direction. Construction uses hand-authored SVG geometry, and archetypes share structural components with different rooflines, finishes, and features.
- The PWA build-tool chain reports four moderate npm audit findings inherited through Workbox. The affected packages are development dependencies.

The next milestone is a visual pass against the mockup. Use the existing `1536 × 1024` scene layout to tune the frame and entrance positions. If adding painted building art, supply transparent overlays per archetype and construction stage with one fixed contact point, identical scale, upper-left lighting, and independent window, foliage, and overgrowth layers. That keeps progression and vitality transitions aligned.

## Artwork generation

The built-in image generation tool produced the two original illustrations. Project assets are [`public/world/valley.webp`](public/world/valley.webp) and [`public/world/cottage.webp`](public/world/cottage.webp). The game renders the cottage, building stages, map controls, and effects separately from the terrain.

<details>
<summary>Terrain generation prompt</summary>

> Use case: illustration-story. Asset type: original hand-painted indie-game hillside valley environment plate for a playable SVG layered scene. Landscape 3:2 aspect. Full bleed, no text, no UI, no people, no buildings or ruins, no markers. Framing: looking gently downhill into a beautiful European fairytale valley, a high three-quarter painterly game camera with enough horizon for hazy pale teal mountains in the top quarter. A grassy central knoll at 50% x and 56% y with a completely empty flat grass clearing for a cottage sprite, an ochre walking path softly curling around it from the lower left, splitting toward a small wooden pedestrian bridge on the right. A narrow reflective turquoise stream meanders from the middle right down to the lower right. Broad rounded meadow on the lower left at 25% x,76% y, smaller open protected meadow at 73% x,60% y near stream, third empty grass clearing at 39% x,40% y, all resting on grass and suitable for small building sprites. Deep diverse forests wrap the left and right edges with mossy firs and round oaks, scattered flowering blush trees and wildflowers at the edges, warm shafts of late afternoon sunlight from upper left, layered atmospheric depth, meticulously hand-painted gouache and natural brush textures, miniature storybook detail, sophisticated olive sap greens, muted cyan, golden sunlight, shadows in dark forest greens. Cosy, lush, grounded. Detailed natural forms, professional highly composed game environment art. Preserve spacious grass clearings, do not fill them with trees. Avoid generic flat vector art, vector borders, dark heavy vignette, text, overlays or graphical interface.

</details>

<details>
<summary>Cottage generation prompt</summary>

> Use case: illustration-story. Asset type: transparent PNG game sprite, the central cottage only. Create one beautiful little fairy-tale hillside cottage with golden ochre timber and warm creamy rough stone plaster, a mossy terracotta hand-tiled hip and gable roof, a rough stone chimney, glowing small amber mullioned windows, a dark carved teal painted door, lavender in a small terracotta pot and a few tiny wildflowers at the base. Front facade faces down-left slightly and right wall visible, gently elevated three-quarter game view, light from upper left, slightly subdued edges with painterly gouache brushwork, luminous professional hand-painted European storybook indie game style, intensely detailed natural materials. Isolated single asset on fully transparent background with tight framing and 6% margin. No environment, sky, backdrop, detached objects, text or UI, no ground except very tiny organic foliage by the base, no smoke so it can be animated separately. Generous visual silhouette and two visible sides, easily readable as a small game sprite. No photorealism, no black outlines, no plastic textures.

</details>
