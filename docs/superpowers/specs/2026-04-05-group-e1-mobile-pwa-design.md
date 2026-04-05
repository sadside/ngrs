# Group E1 — Mobile & PWA Polish Design Spec

**Date:** 2026-04-05
**Scope:** Iridium TMS frontend (`apps/web`) mobile adaptation, PWA configuration, and UX polish for small-screen usage.

## Goal

Make the Iridium admin web app fully usable and visually polished on mobile devices (375px width and up) while preserving the existing desktop experience. Fix the broken PWA install flow. Eliminate the iOS Safari input zoom regression. Add a splash screen covering the initial mount gap.

Group E1 contains seven independent sections that share a single spec because they are all purely frontend work on related concerns (mobile UX). They can ship together or be split across multiple PRs during implementation.

## Constraints and decisions

- **Responsive breakpoint:** `md:` (768px). Below → mobile layout. At or above → desktop layout. No separate tablet layout.
- **Minimum supported viewport:** 375×667 (iPhone SE). Layouts below 375px are out of scope.
- **Design quality bar:** Mobile layouts must look as polished as desktop. "Mobile" is not synonymous with "stripped down". Same typography tokens, same spacing rhythm, same attention to detail.
- **Sheet primitive:** All mobile overlays use a new `shared/ui/sheet.tsx` based on `@radix-ui/react-dialog` (added via shadcn CLI). Not hand-written.
- **Icon files are external:** Icon PNGs live outside this spec's scope — user provides them via realfavicongenerator.net. Implementation must not block on missing icons; build must succeed without them.
- **No offline-first:** Service worker caches static assets and short-TTL API responses, but full offline mode (driver sync queue, conflict resolution) is a separate future spec.
- **No custom install prompt UI:** The browser's native install banner is sufficient. Custom "Install app" button is YAGNI.

---

## Section 1 — Sidebar → Fullscreen Drawer on Mobile

### Problem

`AdminSidebar` has fixed width (`w-64` expanded, `w-[72px]` collapsed) with no responsive behavior. At 375px viewport, the expanded sidebar takes 68% of the screen; the collapsed variant still eats 19%. No hamburger, no drawer, no way to hide navigation for more content space.

### Solution

Split rendering by breakpoint:

- **Desktop (`md:` and above):** unchanged — sticky `<aside>` with collapse toggle and localStorage persistence.
- **Mobile (below `md:`):** sidebar hidden entirely. `AdminHeader` shows a hamburger button (`List` icon from phosphor). Clicking it opens a **fullscreen** sheet (100vw × 100vh, no visible backdrop because the sheet covers the entire viewport) containing the same navigation content.

### Fullscreen drawer content structure

The drawer preserves full desktop sidebar quality:

- Close button (X) in the top-right corner — the only visible chrome above the content
- Iridium logo block at the top (same brand treatment as auth pages)
- Full navigation list (all 9 items), each with icon + label + active-state highlight
- Larger vertical gap between items than desktop (mobile tap targets)
- User profile card at the bottom: avatar circle with initials + full name + role badge
- `ThemeToggle` and `Logout` button in the footer

Active route highlight matches desktop styling (primary background + subtle glow), adjusted only in size/padding for touch comfort.

### Behavior

- Clicking any navigation item triggers the route change AND closes the drawer automatically
- Swipe-from-edge gesture closes the drawer (handled natively by Radix Dialog primitive)
- Open state is component-local (`useState`) — not persisted across sessions

### Component split

`apps/web/src/widgets/admin-sidebar/ui.tsx` is refactored from a single component into three exports that share one content definition:

- `AdminSidebarContent` — pure JSX of the navigation list + profile + footer, accepts `onNavigate?: () => void` callback (used to close the drawer after clicks)
- `AdminSidebar` — existing desktop `<aside>` version, wraps `AdminSidebarContent` with no `onNavigate`
- `AdminSidebarDrawer` — new component: `<Sheet side="left">` with `className="w-screen max-w-none"` making it fullscreen, wraps `AdminSidebarContent` with `onNavigate={() => setOpen(false)}`, exposes `open` / `onOpenChange` props

### Files

- **Create:** `apps/web/src/shared/ui/sheet.tsx` — shadcn Sheet primitive. Install via `pnpm dlx shadcn@latest add sheet`; if the CLI places the file in the wrong path (prior incident with `apps/web/@/...`), copy the canonical file from shadcn documentation directly via `Write` tool.
- **Modify:** `apps/web/src/widgets/admin-sidebar/ui.tsx` — split into three exports as described.
- **Modify:** `apps/web/src/widgets/admin-header/ui.tsx` — add hamburger button (`md:hidden`) on the left, with `useState<boolean>` lifted to manage drawer open state; pass open/setOpen to `AdminSidebarDrawer` mounted at the layout level (or render the drawer here directly and pass a ref up).
- **Modify:** `apps/web/src/app/layouts/admin-layout.tsx` — wrap desktop sidebar with `hidden md:flex`, render `AdminSidebarDrawer` unconditionally (internal state manages visibility).

---

## Section 2 — Tables → Mobile Cards

### Problem

All 8 admin pages use `DataTable` rendering as a classic HTML `<table>`. At 375px viewport, even with the horizontal scroll fix applied in Group A, a 5-8 column table requires constant sideways scrolling and is hostile to touch. Users cannot scan content.

### Solution

`DataTable` internally switches to a card layout on mobile. Each row becomes a visual `Card` with vertically arranged fields. Table remains unchanged on desktop.

### API addition

`DataTable` props gain one optional new field:

```ts
interface DataTableProps<TData> {
  // ... existing props
  mobileCardRenderer?: (row: Row<TData>) => ReactNode;
}
```

- If `mobileCardRenderer` is provided, the mobile layout calls it for each row.
- If omitted, a **default card renderer** is used — it reads the first three non-service columns (skipping `select` and `actions`) and renders the first as a bold title, the other two as muted subtitle text. This ensures every existing page "just works" on mobile without code changes, before custom renderers are added.

### Card design standard

Each row card follows this layout (uses the existing `Card` component from `@/shared/ui/card`):

```
┌────────────────────────────────────────┐
│ [✓]  Main field (bold, text-base)    ⋯ │  ← checkbox | title | RowActions
│       Secondary field (text-sm muted)  │
│                                         │
│  Label: value     Label: value         │  ← 2-column grid, text-xs labels
│  Label: value     Label: value         │
│                                         │
│  [Status badge]              date      │  ← footer row with badge + meta
└────────────────────────────────────────┘
```

- Cards rendered in a single column with `gap-3` between them
- Entire card is clickable only if the page has an `onView` / `onEdit` handler (otherwise cards are just display blocks)
- Selected cards get `ring-2 ring-primary` highlight
- Floating bulk-actions bar (from Group A) remains at the bottom when rows are selected — already works on mobile

### Per-page mobile card renderers

Custom renderers are added to all 8 pages. Exact field layout per page:

| Page | Title | Subtitle | Grid (2 cols) | Footer |
|---|---|---|---|---|
| **trips** | `driver.fullName` | `route.sender → route.receiver` (truncate) | ТС plate + Груз name; ТТН number | status badge + formatted `assignedAt` |
| **waybills** | ТТН number | driver full name | Вес, Вес налива; Маршрут truncated | formatted `submittedAt` datetime |
| **users** | Full name | login | Роль, Телефон | status badge + created date |
| **drivers** | Full name | phone | Привязанное ТС (full) | status badge |
| **vehicles** | `brand model` | license plate | Тип владения, Прицеп | status badge + assigned driver |
| **contractors** | name | ИНН | Телефон, Контактное лицо | type badge |
| **cargos** | name | ТУ | UN код, Класс опасности, Упаковка (3 items wrap) | — |
| **routes** | `sender → receiver` | truncated loadingAddress | Адрес выгрузки, Описание | — |

### Mobile toolbar

The existing `DataTableToolbar` (search + filter chips + create button) becomes two rows on mobile:

- **Row 1:** search input `flex-1` + create button icon-only (`+` icon, `md:` recovers the text label)
- **Row 2 (conditional):** if `filterOptions` present, a "Фильтры" button with a badge showing active filter count. Clicking opens a `Sheet side="bottom"` containing the same filter controls.

On desktop the toolbar remains a single row as before.

### Files

- **Modify:** `apps/web/src/shared/ui/data-table/index.tsx` — add `mobileCardRenderer` prop, render mobile card grid (`<div className="md:hidden space-y-3">...</div>`) alongside the existing desktop `<div className="hidden md:block">` table block
- **Create:** `apps/web/src/shared/ui/data-table/default-card.tsx` — default renderer for pages without a custom one
- **Create:** `apps/web/src/shared/ui/data-table/mobile-filter-sheet.tsx` — Sheet containing the filter controls when toolbar is in mobile mode
- **Modify:** `apps/web/src/shared/ui/data-table/toolbar.tsx` — two-row mobile layout with icon-only create button and "Фильтры" sheet trigger
- **Modify:** all 8 admin page files (`trips.tsx`, `waybills.tsx`, `users.tsx`, `drivers.tsx`, `vehicles.tsx`, `contractors.tsx`, `cargos.tsx`, `routes.tsx`) — pass `mobileCardRenderer` prop matching the per-page table above

---

## Section 3 — Dialogs → ResponsiveDialog (Sheet on Mobile)

### Problem

Existing `Dialog` has partial mobile adaptation (`max-w-[calc(100%-2rem)]` caps width at viewport minus 32px padding), but it remains a centered modal with fixed max-height. For forms with 5+ fields (create vehicle, create route, create user), this feels cramped on 375×667 screens.

### Solution

Introduce `ResponsiveDialog` — a thin wrapper component with the same API as `Dialog`. Internally selects between `Dialog` (desktop) and `Sheet side="bottom"` (mobile) via a `useMediaQuery` hook.

### API

Mirrors existing `Dialog` completely so migration is mechanical:

```tsx
<ResponsiveDialog open={open} onOpenChange={setOpen}>
  <ResponsiveDialogContent>
    <ResponsiveDialogHeader>
      <ResponsiveDialogTitle>Новый рейс</ResponsiveDialogTitle>
    </ResponsiveDialogHeader>
    {/* form content */}
    <ResponsiveDialogFooter>
      <Button type="submit">Создать</Button>
    </ResponsiveDialogFooter>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

Each `ResponsiveDialog*` wrapper delegates to its `Dialog*` or `Sheet*` counterpart depending on breakpoint.

### Mobile Sheet appearance

- `side="bottom"` with `rounded-t-2xl`
- `max-h-[92vh]` (8vh headroom for drag handle visibility)
- Drag handle: `w-10 h-1 bg-muted rounded-full` centered at the top of the sheet (visual affordance for swipe gesture)
- Header sticky at top (title + close button)
- Content `overflow-y-auto` between header and footer
- Footer sticky at bottom with `border-t` separator, contains submit button

### Migration

Form structure inside each dialog needs slight rework — the `<form>` element must wrap `ResponsiveDialogContent` (not just its body) so that a sticky submit button in `ResponsiveDialogFooter` can trigger the form via normal HTML submission. Fields move inside the scrollable middle region; buttons move into the footer.

### useMediaQuery hook

New `apps/web/src/shared/lib/use-media-query.ts` — ~10 lines, uses `window.matchMedia` + `useState` + `useEffect` to track viewport width:

```ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
```

Used as `const isDesktop = useMediaQuery('(min-width: 768px)');` inside `ResponsiveDialog`.

### Migration targets (files using `Dialog`)

1. `features/create-trip/ui.tsx` — create trip
2. `pages/admin/users.tsx` — create user
3. `pages/admin/vehicles.tsx` — create vehicle
4. `pages/admin/routes.tsx` — create route
5. `pages/admin/contractors.tsx` — create contractor
6. `pages/admin/cargos.tsx` — create cargo
7. `features/submit-waybill/ui.tsx` — waybill submission (driver PWA; audit usage to confirm it uses Dialog)

Each: replace `Dialog` → `ResponsiveDialog`, `DialogContent` → `ResponsiveDialogContent`, etc. Restructure form to wrap content and place submit button in footer.

### Files

- **Create:** `apps/web/src/shared/lib/use-media-query.ts` — the hook
- **Create:** `apps/web/src/shared/ui/responsive-dialog.tsx` — the wrapper
- **Modify:** 7 files listed above — Dialog → ResponsiveDialog migration plus form restructure

### Non-goals

- Not modifying `Dialog` or `Sheet` primitives — they remain as-is
- Not migrating confirmation/alert dialogs (if any exist) — only create/edit forms
- Not changing form logic (validation, submit handlers, react-hook-form usage)

---

## Section 4 — PWA Configuration

### Problem

- `apps/web/public/manifest.json` references `/icons/icon-192.png` and `/icons/icon-512.png`, but the `public/icons/` directory is empty. PWA install is broken.
- `theme_color` in manifest = `#ffa600` (orange from the original palette, obsoleted by the V2 redesign to cobalt/mint)
- No service worker; no `vite-plugin-pwa`
- Missing iOS-specific meta tags (`apple-mobile-web-app-capable`, `apple-touch-icon`, etc.)

### External artifact assumption

The user provides icon files via realfavicongenerator.net and places them in `apps/web/public/icons/` at some point. The implementation does **not** block on their presence — build must pass whether or not the files exist. Without icons, the PWA install banner won't appear (browser validation), but the app functions normally and the build succeeds.

Expected icon file set (user will generate):
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `maskable-icon-512.png` (512×512 with safe zone)
- `apple-touch-icon.png` (180×180)
- `favicon-32.png` (32×32)
- `favicon-16.png` (16×16)

### vite-plugin-pwa configuration

Add `vite-plugin-pwa` to `apps/web/package.json` (devDependency). Configure in `apps/web/vite.config.ts`:

```ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Do NOT list icons in includeAssets — they may not exist at build time.
      // vite-plugin-pwa will gracefully skip missing files referenced only in manifest.
      manifest: {
        name: 'Iridium — Система управления перевозками',
        short_name: 'Iridium',
        description: 'Транспортная система для управления рейсами и накладными',
        theme_color: '#3765F6',
        background_color: '#181D25',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // png intentionally excluded from globPatterns to avoid build failure when icons missing
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
    }),
  ],
});
```

Note: `globPatterns` deliberately excludes `png` so missing icon files do not fail the workbox precache step. Icons get served at runtime from `public/icons/` directly — they're just not precached by the service worker.

### Delete the old manifest

`apps/web/public/manifest.json` is deleted. `vite-plugin-pwa` generates its own `manifest.webmanifest` from the `manifest` config block. Having both would conflict.

### index.html updates

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#3765F6" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Iridium" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
<!-- <link rel="manifest"> removed — vite-plugin-pwa injects automatically -->
```

`viewport-fit=cover` enables full-screen layouts on iPhone X+ (no white bars around the notch).

### Service worker registration

In `apps/web/src/main.tsx`, add:

```ts
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });
```

The plugin handles `beforeinstallprompt` internally and shows the native install banner. No custom UI needed.

### TypeScript support

Add to `apps/web/src/vite-env.d.ts`:

```ts
/// <reference types="vite-plugin-pwa/client" />
```

### Files

- **Modify:** `apps/web/package.json` — add `vite-plugin-pwa` to `devDependencies`
- **Modify:** `apps/web/vite.config.ts` — import and configure `VitePWA`
- **Delete:** `apps/web/public/manifest.json`
- **Modify:** `apps/web/index.html` — meta tags, icon links, remove old manifest link
- **Modify:** `apps/web/src/main.tsx` — `registerSW()` call
- **Modify:** `apps/web/src/vite-env.d.ts` — plugin client types reference
- **External (user):** files in `public/icons/` — implementation does not block on their presence

### Non-goals

- Not offline-first for API data (only short-TTL NetworkFirst cache)
- Not push notifications
- Not custom install prompt UI

---

## Section 5 — Splash Screen

### Problem

On initial app load, users see a blank screen (white or dark depending on browser default) for roughly 50–500ms between HTML parse and React mount + first auth query resolution. This feels unresponsive.

### Solution

Inline HTML/CSS splash screen inside `<div id="root">` in `index.html`. When React mounts via `createRoot().render(...)`, it replaces the root's children with the React tree, causing the splash to disappear automatically. Zero JavaScript, zero framework overhead — the splash is visible from the moment HTML parsing completes.

### Structure

`index.html` body becomes:

```html
<div id="root">
  <div class="iridium-splash">
    <div class="iridium-splash__logo">
      <span class="iridium-splash__brand">Iridium</span>
      <span class="iridium-splash__subtitle">Система управления перевозками</span>
    </div>
    <div class="iridium-splash__spinner" aria-hidden="true"></div>
  </div>
</div>
```

### Styles

Inline `<style>` block in `<head>`:

```css
.iridium-splash {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #181D25 0%, #1E2530 50%, #3765F6 200%);
  color: #F2F3F6;
  font-family: -apple-system, system-ui, sans-serif;
  z-index: 9999;
}

.iridium-splash__logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: iridium-pulse 2s ease-in-out infinite;
}

.iridium-splash__brand {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #3765F6 0%, #70FC8E 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.iridium-splash__subtitle {
  font-size: 14px;
  color: #606E80;
  font-weight: 500;
}

.iridium-splash__spinner {
  margin-top: 32px;
  width: 32px;
  height: 32px;
  border: 2px solid rgba(55, 101, 246, 0.2);
  border-top-color: #3765F6;
  border-radius: 50%;
  animation: iridium-spin 0.8s linear infinite;
}

@keyframes iridium-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes iridium-spin {
  to { transform: rotate(360deg); }
}
```

### Visual effect

- Diagonal dark gradient background from obsidian (`#181D25`) through card (`#1E2530`) to cobalt (`#3765F6`) — consistent with the app's dark-default theme
- "Iridium" wordmark in gradient cobalt → mint text fill (matching the app's primary accents)
- "Система управления перевозками" subtitle in muted grey
- Circular spinner below the logo using only borders + `rotate()` keyframe (no network-loaded SVG)
- Subtle opacity pulse on the whole logo block (2s cycle)

### Files

- **Modify:** `apps/web/index.html` — add `<style>` block in `<head>`, add splash markup inside `<div id="root">`

No new files. No build config changes. Single-file diff.

### Non-goals

- No React-level `Suspense` splash — inline HTML is sufficient for the initial mount gap
- No fade-out animation — React mount replaces the DOM instantly; adding a fade would require JavaScript coordination
- No route-change splash — that's handled by per-widget skeletons (from Group A)

---

## Section 6 — Input 16px Font-Size Fix

### Problem

iOS Safari (and Safari on iPadOS) zooms the viewport whenever the user focuses an `<input>`, `<textarea>`, or `<select>` with computed `font-size` less than 16px. This breaks mobile UX — users lose their layout position on every form interaction.

Current state (confirmed via recon):
- `Input` default size = `text-sm` (14px) — triggers zoom
- `Input` size `sm` = `text-xs` (12px) — triggers zoom
- `Input` size `lg` = `text-base` (16px) — safe
- `Textarea` = `text-base md:text-sm` — already correct (16px mobile, 14px desktop)
- `Select` trigger from shadcn — `text-sm` default, likely triggers zoom
- `IMaskInput` in `RegisterForm` phone field — className needs audit

### Solution

Apply the same responsive pattern that `Textarea` already uses: `text-base` on mobile, `text-sm` on `md:` and above. Users on mobile get 16px (iOS-safe), users on desktop keep 14px (compact, matches surrounding typography).

### Input component changes

In `apps/web/src/shared/ui/input.tsx`, update the `cva` size variants:

| size | Before | After |
|---|---|---|
| `sm` | `h-8 px-3 text-xs` | `h-8 px-3 text-base md:text-xs` |
| `md` (default) | `h-10 px-3 text-sm` | `h-10 px-3 text-base md:text-sm` |
| `lg` | `h-12 px-4 text-base` | `h-12 px-4 text-base` (no change) |

Note: `sm` input on mobile will visually have a slightly taller text than before relative to the field height. Acceptable trade-off — zoom bug is worse than a minor visual quirk on a rarely-used compact size.

### Select trigger

In `apps/web/src/shared/ui/select.tsx`, locate the base `SelectTrigger` className (contains `text-sm` currently). Replace with `text-base md:text-sm`.

### IMaskInput audit

In `apps/web/src/features/auth/register-form.tsx`, the `IMaskInput` component has a long inline `className`. Audit it during implementation: if it contains `text-sm` or similar without a responsive prefix, add `text-base md:text-sm`. If it already has the pattern, leave it.

### Ad hoc audits

During implementation, grep for `text-sm` and `text-xs` in:
- `src/shared/ui/` — other input-like primitives
- `src/pages/` — any raw `<input>` / `<textarea>` / `<select>` not using the `Input` component

For each match on an input-like element, add `text-base md:text-sm`.

### Verification

After implementation, open the app in Chrome DevTools device mode set to iPhone 12 (or any iOS profile). Tap each input in login, register, and each create dialog. The viewport should NOT zoom. If it does, trace the specific field and apply the pattern.

### Files

- **Modify:** `apps/web/src/shared/ui/input.tsx` — update cva size variants
- **Modify:** `apps/web/src/shared/ui/select.tsx` — update `SelectTrigger` className
- **Modify:** `apps/web/src/features/auth/register-form.tsx` — audit and possibly fix `IMaskInput`
- **Audit (find + possibly modify):** other files matching `text-sm` / `text-xs` on `<input>`/`<textarea>`/`<select>` elements

### Non-goals

- No global CSS `!important` override
- No unified 16px across desktop
- No change to the underlying sizing scale / cva structure

---

## Section 7 — Dashboard Widgets, PageHeader, Admin Header Responsive Audit

### Problem

Group A extracted the dashboard into widgets with basic responsive grids (`grid-cols-1 lg:grid-cols-2`, `grid-cols-2 lg:grid-cols-5`). These work at a coarse layout level but several sub-components still have issues at 375px:

- Recharts `ChartContainer` uses `aspect-video` (16:9) which produces ~320×180 chart on 375px — tick labels may overlap, driver tooltip list may exceed viewport width
- `PageHeader` combines title + description + user profile in one flex row; long titles (e.g. greeting with user name) can collide with the profile card
- `AdminHeader` may contain elements that don't fit on 375px
- `DataTableToolbar` flex row overflows with search + filters + create button at 375px (partly addressed in Section 2)

### Solution: Audit + targeted patches

Unlike Sections 1–6, this section is not a single architectural change. It is a list of audit points and specific patches per affected file.

### Patch 1: Chart tick formatters on mobile

Both `TripsPerWeek` and `TransportVolume` use 7-day x-axis labels. On 375px the full 2-char weekday labels (пн, вт, ...) may overlap. Check during implementation:
- If labels overlap, change `tickFormatter={(value) => value.slice(0, 3)}` to use single-character labels on mobile via `useMediaQuery` or keep as-is if they fit with smaller `tickMargin`.
- Chart container height can increase on mobile (`h-[200px] md:h-auto`) for better readability.

### Patch 2: TripsPerWeek custom tooltip constraints

The `TripsTooltip` component (added in the Group A follow-up) can render a long driver list. On mobile it can exceed viewport width.

- Add `max-w-[90vw] max-h-[50vh] overflow-y-auto` to the tooltip root div
- Optionally cap the driver list to top 5 with a "+N больше" suffix if there are more

### Patch 3: PageHeader responsive layout

`apps/web/src/widgets/page-header/ui.tsx` currently renders title + description on the left and user profile on the right in a single flex row.

- On mobile: convert to `flex-col sm:flex-row` so title wraps under the profile, OR hide the profile text on mobile and show only the avatar with initials (profile info is already in the drawer from Section 1).
- Implementation decision left for implementer based on visual check during build: if the profile block is small enough (just an avatar), keep it in the row; if it has full name + role, stack on mobile.

### Patch 4: AdminHeader responsive

`apps/web/src/widgets/admin-header/ui.tsx` — after Section 1 adds the hamburger button, audit remaining elements for mobile fit. Likely patches:
- Profile block: hide name/role text below `sm:`, show only avatar
- Any secondary buttons: hide or move to the drawer

### Patch 5: DataTable toolbar two-row mobile layout

Already specified in Section 2. Reiterated here for completeness:
- Row 1: search (flex-1) + create button (icon-only on mobile)
- Row 2 (conditional): "Фильтры" sheet trigger with active-count badge

### Files

- **Modify:** `apps/web/src/widgets/trips-per-week/ui.tsx` — tooltip max-w/max-h, possibly tick formatter
- **Modify:** `apps/web/src/widgets/transport-volume/ui.tsx` — possibly tick formatter
- **Modify:** `apps/web/src/widgets/page-header/ui.tsx` — responsive layout
- **Modify:** `apps/web/src/widgets/admin-header/ui.tsx` — beyond hamburger, handle profile/secondary elements
- **Modify:** `apps/web/src/shared/ui/data-table/toolbar.tsx` — two-row mobile layout (shared with Section 2)

### Non-goals

- Not migrating charts to a different library
- Not adding swipe/pinch gesture support for charts
- Not building entirely separate mobile chart components — same chart, adjusted parameters

---

## Testing

No new test infrastructure. Each section is verified manually in Chrome DevTools device mode using at least these profiles:
- iPhone SE (375×667) — minimum supported
- iPhone 12 Pro (390×844) — common modern iPhone
- iPad Mini (768×1024) — exactly at `md:` breakpoint
- Desktop (1280×800) — desktop layout intact

Per-section acceptance checks:
- **§1:** Hamburger button visible below 768px, drawer opens fullscreen, nav click navigates + closes drawer, X button closes
- **§2:** Below 768px tables render as cards, all 8 pages have their per-page renderer, checkbox selection works, filter sheet opens from toolbar
- **§3:** All 7 create dialogs open as bottom sheets on mobile, drag handle visible, submit button sticky at bottom, form scrolls
- **§4:** `pnpm web:build` passes with or without icon files, generated `manifest.webmanifest` has cobalt theme, `registerSW` loads without errors in console
- **§5:** Hard reload shows splash briefly before app mounts; splash background matches app dark theme
- **§6:** Focus any input on iPhone profile — no viewport zoom
- **§7:** Charts fit 375px width, tooltip doesn't overflow, page header doesn't collide with profile, toolbar fits on two rows if needed

## File summary

**Created (~6 files):**
- `apps/web/src/shared/ui/sheet.tsx`
- `apps/web/src/shared/ui/responsive-dialog.tsx`
- `apps/web/src/shared/lib/use-media-query.ts`
- `apps/web/src/shared/ui/data-table/default-card.tsx`
- `apps/web/src/shared/ui/data-table/mobile-filter-sheet.tsx`

**Modified (~25 files):**
- Layout: `apps/web/src/app/layouts/admin-layout.tsx`
- Widgets: `admin-sidebar/ui.tsx`, `admin-header/ui.tsx`, `page-header/ui.tsx`, `trips-per-week/ui.tsx`, `transport-volume/ui.tsx`
- Shared UI: `input.tsx`, `select.tsx`, `data-table/index.tsx`, `data-table/toolbar.tsx`
- Pages (cards + responsive): `trips.tsx`, `waybills.tsx`, `users.tsx`, `drivers.tsx`, `vehicles.tsx`, `contractors.tsx`, `cargos.tsx`, `routes.tsx`
- Features (Dialog → ResponsiveDialog): `create-trip/ui.tsx`, `auth/register-form.tsx` (IMaskInput), `submit-waybill/ui.tsx` (if applicable)
- Config: `package.json`, `vite.config.ts`, `index.html`, `main.tsx`, `vite-env.d.ts`

**Deleted:**
- `apps/web/public/manifest.json`
