# Group E1 — Mobile & PWA Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt Iridium admin web app for mobile (375px+), fix broken PWA install flow, eliminate iOS input zoom, add splash screen, preserving desktop experience untouched.

**Architecture:** All changes are frontend-only. New shared primitives (`Sheet`, `ResponsiveDialog`, `useMediaQuery`) introduced first; then each feature section layers on top. `md:` (768px) is the single breakpoint — below is mobile, above is desktop. Verification is manual via `pnpm web:build` + Chrome DevTools device mode (no test infrastructure in this project).

**Tech Stack:** React + Vite + TypeScript, Tailwind v4, shadcn/ui, radix-ui primitives, vite-plugin-pwa, phosphor-icons.

**Spec:** `docs/superpowers/specs/2026-04-05-group-e1-mobile-pwa-design.md`

**Build command:** `pnpm web:build` (root) — runs `tsc -b && vite build` for `@iridium/web`.
**Dev command:** `pnpm web:dev` — opens `http://localhost:5173`.

**External artifact (user-provided):** Icon files in `apps/web/public/icons/` — may not exist when tasks run. Build must succeed regardless. PWA install prompt will not activate until icons land, but the app functions normally.

---

## Task 1: Add shadcn Sheet primitive

**Files:**
- Create: `apps/web/src/shared/ui/sheet.tsx`

- [ ] **Step 1: Install via shadcn CLI, controlling the path**

Run from repo root:
```bash
pnpm --filter @iridium/web dlx shadcn@latest add sheet
```

The CLI historically placed files in the wrong location (`apps/web/@/shared/ui/...`) during Group A. Watch its output. If the file ends up anywhere other than `apps/web/src/shared/ui/sheet.tsx`, **manually move it** with `mv` to the correct path.

If the CLI fails or creates a broken file, abort and use Step 1b instead.

- [ ] **Step 1b (fallback): Write the file directly**

If CLI did not produce a clean `apps/web/src/shared/ui/sheet.tsx`, write it manually with these exact contents (taken from shadcn/ui canonical source):

```tsx
"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

const sheetVariants = cva(
  "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 border-b",
        bottom:
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 border-t",
        left: "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right:
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: { side: "right" },
  }
)

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants>) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm web:build`
Expected: PASS. Sheet is imported nowhere yet — this verifies the file compiles standalone.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/shared/ui/sheet.tsx
git commit -m "feat(ui): add shadcn Sheet primitive"
```

---

## Task 2: Create `useMediaQuery` hook

**Files:**
- Create: `apps/web/src/shared/lib/use-media-query.ts`

- [ ] **Step 1: Write the hook**

Create `apps/web/src/shared/lib/use-media-query.ts`:

```ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/shared/lib/use-media-query.ts
git commit -m "feat(lib): add useMediaQuery hook"
```

---

## Task 3: Create `ResponsiveDialog` wrapper

**Files:**
- Create: `apps/web/src/shared/ui/responsive-dialog.tsx`

- [ ] **Step 1: Write the wrapper**

Create `apps/web/src/shared/ui/responsive-dialog.tsx`:

```tsx
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/ui/sheet';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { cn } from '@/shared/lib/utils';

const DESKTOP_QUERY = '(min-width: 768px)';

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children}
    </Sheet>
  );
}

interface ResponsiveDialogContentProps extends React.ComponentProps<'div'> {
  className?: string;
}

export function ResponsiveDialogContent({
  className,
  children,
  ...props
}: ResponsiveDialogContentProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    );
  }
  return (
    <SheetContent
      side="bottom"
      className={cn(
        'flex flex-col rounded-t-2xl max-h-[92vh] p-0 gap-0',
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted" aria-hidden="true" />
      {children}
    </SheetContent>
  );
}

export function ResponsiveDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return <DialogHeader className={className} {...props} />;
  }
  return (
    <SheetHeader className={cn('sticky top-0 bg-background border-b border-border p-4 z-10', className)} {...props} />
  );
}

export function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return <DialogTitle className={className} {...props} />;
  }
  return <SheetTitle className={className} {...props} />;
}

export function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return <DialogDescription className={className} {...props} />;
  }
  return <SheetDescription className={className} {...props} />;
}

export function ResponsiveDialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto p-4 md:p-0 md:pt-2',
        className,
      )}
      {...props}
    />
  );
}

export function ResponsiveDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return <DialogFooter className={className} {...props} />;
  }
  return (
    <SheetFooter
      className={cn('sticky bottom-0 bg-background border-t border-border p-4', className)}
      {...props}
    />
  );
}
```

Note: `ResponsiveDialogBody` is a new concept — a scrollable middle region between sticky header and footer. On desktop it's a simple div (no stickiness needed). Consumers wrap form fields in it.

- [ ] **Step 2: Verify `dialog.tsx` exports `DialogDescription` and `DialogFooter`**

Read `apps/web/src/shared/ui/dialog.tsx`. If either is missing from its exports, add them. If they don't exist as components, remove the imports from `responsive-dialog.tsx` and don't export the corresponding wrappers (or add them to `dialog.tsx` as well — both are standard shadcn exports).

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/shared/ui/responsive-dialog.tsx apps/web/src/shared/ui/dialog.tsx
git commit -m "feat(ui): add ResponsiveDialog wrapping Dialog/Sheet by breakpoint"
```

---

## Task 4: Fix Input and Select font sizes (iOS zoom)

**Files:**
- Modify: `apps/web/src/shared/ui/input.tsx`
- Modify: `apps/web/src/shared/ui/select.tsx`
- Modify: `apps/web/src/features/auth/register-form.tsx`

- [ ] **Step 1: Update Input cva variants**

In `apps/web/src/shared/ui/input.tsx`, replace the `size` variants inside `inputVariants`:

```tsx
const inputVariants = cva(
  "flex w-full rounded-lg border border-input bg-card text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-base md:text-xs",
        md: "h-10 px-3 text-base md:text-sm",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: { size: "md" },
  }
)
```

Only the `sm` and `md` rows change. `lg` is already 16px.

- [ ] **Step 2: Update SelectTrigger base className**

In `apps/web/src/shared/ui/select.tsx`, find the `SelectTrigger` function (around line 25). Its base className contains `text-sm` — replace it with `text-base md:text-sm`:

```tsx
className={cn(
  "flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-base md:text-sm text-foreground whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none cursor-pointer hover:border-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
  className
)}
```

Only one word changes: `text-sm` → `text-base md:text-sm`.

- [ ] **Step 3: Audit and fix IMaskInput in register-form**

In `apps/web/src/features/auth/register-form.tsx`, find the `IMaskInput` component (phone field). Its `className` is a long hardcoded string. If it contains `text-sm` without a responsive prefix, replace with `text-base md:text-sm`. If it contains `text-base` already without further responsive handling, leave alone. Search for the substring `text-base md:text-sm` in the file — if missing, add it.

Typical IMaskInput className after fix:
```tsx
className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base md:text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
```

- [ ] **Step 4: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Open `http://localhost:5173` in Chrome DevTools, toggle device mode to iPhone 12 Pro (390×844). Navigate to `/login`. Tap the login field — viewport must NOT zoom. Tap password field — same. Repeat for `/register` including the phone field.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/shared/ui/input.tsx apps/web/src/shared/ui/select.tsx apps/web/src/features/auth/register-form.tsx
git commit -m "fix(ui): set 16px min font-size on inputs for iOS Safari zoom prevention"
```

---

## Task 5: Splash screen in index.html

**Files:**
- Modify: `apps/web/index.html`

- [ ] **Step 1: Replace `apps/web/index.html` contents**

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Iridium TMS</title>
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#3765F6" />
    <style>
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
    </style>
  </head>
  <body>
    <div id="root">
      <div class="iridium-splash">
        <div class="iridium-splash__logo">
          <span class="iridium-splash__brand">Iridium</span>
          <span class="iridium-splash__subtitle">Система управления перевозками</span>
        </div>
        <div class="iridium-splash__spinner" aria-hidden="true"></div>
      </div>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Note: Task 6 (PWA) will rewrite parts of this file again (meta tags, remove `<link rel="manifest">`). The splash stays.

- [ ] **Step 2: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 3: Manual verification**

Run `pnpm web:dev`, reload `http://localhost:5173` (Cmd+Shift+R for hard reload). Before React mounts, splash should be visible for ~100-500ms showing the dark gradient, "Iridium" wordmark, subtitle, and spinning loader. React mount replaces it with the app.

- [ ] **Step 4: Commit**

```bash
git add apps/web/index.html
git commit -m "feat(ui): inline HTML splash screen during initial app load"
```

---

## Task 6: PWA configuration with vite-plugin-pwa

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/index.html`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/vite-env.d.ts`
- Delete: `apps/web/public/manifest.json`

- [ ] **Step 1: Install vite-plugin-pwa**

Run:
```bash
pnpm --filter @iridium/web add -D vite-plugin-pwa
```

Expected: `vite-plugin-pwa` appears in `apps/web/package.json` devDependencies.

- [ ] **Step 2: Configure vite.config.ts**

Replace the contents of `apps/web/vite.config.ts` with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

`globPatterns` intentionally excludes `png` so missing icon files do not fail precache.

- [ ] **Step 3: Delete old manifest**

```bash
rm apps/web/public/manifest.json
```

- [ ] **Step 4: Update index.html meta tags**

In `apps/web/index.html`, replace the `<head>` section (preserving the `<style>` splash block from Task 5):

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Iridium TMS</title>
  <meta name="theme-color" content="#3765F6" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Iridium" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
  <style>
    /* ... all splash CSS from Task 5 unchanged ... */
  </style>
</head>
```

The `<link rel="manifest">` is removed — `vite-plugin-pwa` injects its own `<link rel="manifest" href="/manifest.webmanifest">` during build.

- [ ] **Step 5: Register service worker in main.tsx**

At the top of `apps/web/src/main.tsx`, add:

```ts
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
```

Place it after the existing imports but before the `createRoot` call.

- [ ] **Step 6: Add virtual module types**

In `apps/web/src/vite-env.d.ts`, add at the top (before any existing content):

```ts
/// <reference types="vite-plugin-pwa/client" />
```

If `vite-env.d.ts` does not exist at that path, create it with just that single reference line.

- [ ] **Step 7: Typecheck**

Run: `pnpm web:build`
Expected: PASS. The build output should include `manifest.webmanifest`, `sw.js`, and `workbox-*.js` files in `dist/`. Missing icon PNG files do not cause errors (we excluded them from globPatterns).

If the build fails with an error about missing icons, check the error message — `vite-plugin-pwa` may want at least `includeAssets: []` explicitly set. Add `includeAssets: []` to the VitePWA config as a no-op explicit empty.

- [ ] **Step 8: Manual verification**

Run `pnpm web:dev`. Open Chrome DevTools → Application → Manifest. The loaded manifest should show "Iridium — Система управления перевозками" with `theme_color: #3765F6`. Service worker status should be "activated and is running".

- [ ] **Step 9: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/vite.config.ts apps/web/index.html apps/web/src/main.tsx apps/web/src/vite-env.d.ts
git rm apps/web/public/manifest.json
git commit -m "feat(pwa): add vite-plugin-pwa with service worker and iOS meta tags"
```

---

## Task 7: Split AdminSidebar into Content/Desktop/Drawer

**Files:**
- Modify: `apps/web/src/widgets/admin-sidebar/ui.tsx`

- [ ] **Step 1: Replace `admin-sidebar/ui.tsx` with the three-export structure**

```tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  Gauge, Truck, FileText, Users, Car, Buildings, MapPin, Package, UserGear,
  CaretLeft, CaretRight,
} from '@phosphor-icons/react';
import { useUnit } from 'effector-react';
import { cn } from '@/shared/lib/utils';
import { $isAdmin } from '@/entities/session/model';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/shared/ui/sheet';

const STORAGE_KEY = 'iridium-sidebar-collapsed';

const MAIN_NAV = [
  { to: '/', label: 'Дашборд', icon: Gauge },
  { to: '/trips', label: 'Рейсы', icon: Truck },
  { to: '/waybills', label: 'Накладные', icon: FileText },
  { to: '/drivers', label: 'Водители', icon: Users },
  { to: '/vehicles', label: 'Транспорт', icon: Car },
  { to: '/contractors', label: 'Контрагенты', icon: Buildings },
  { to: '/routes', label: 'Маршруты', icon: MapPin },
  { to: '/cargos', label: 'Грузы', icon: Package },
];

const ADMIN_NAV = [
  { to: '/users', label: 'Пользователи', icon: UserGear },
];

interface AdminSidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  /** Forces always-expanded layout regardless of collapsed state (used in drawer) */
  forceExpanded?: boolean;
  showCollapseToggle?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebarContent({
  collapsed = false,
  onNavigate,
  forceExpanded = false,
  showCollapseToggle = false,
  onToggleCollapse,
}: AdminSidebarContentProps) {
  const isAdmin = useUnit($isAdmin);
  const location = useLocation();

  const items = isAdmin ? [...MAIN_NAV, ...ADMIN_NAV] : MAIN_NAV;

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const expanded = forceExpanded || !collapsed;

  return (
    <>
      {/* Logo + optional collapse toggle */}
      <div className={cn('flex items-center p-4', expanded ? 'justify-between' : 'justify-center')}>
        <Link to="/" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            I
          </div>
          {expanded && <span className="font-bold text-foreground text-lg">Iridium</span>}
        </Link>
        {expanded && showCollapseToggle && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CaretLeft size={16} />
          </button>
        )}
      </div>

      {!expanded && showCollapseToggle && onToggleCollapse && (
        <div className="flex justify-center px-2 mb-2">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CaretRight size={16} />
          </button>
        </div>
      )}

      {expanded && (
        <div className="px-4 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Основное</span>
        </div>
      )}

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={!expanded ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl transition-colors',
                expanded ? 'px-3 py-3 text-base md:text-sm' : 'justify-center px-0 py-2.5',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon size={20} weight={active ? 'fill' : 'regular'} className="shrink-0" />
              {expanded && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn('p-3 border-t border-border', !expanded && 'flex justify-center')}>
        <ThemeToggle collapsed={!expanded} />
      </div>
    </>
  );
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-card rounded-2xl m-3 border border-border transition-all duration-300 ease-in-out overflow-hidden shrink-0',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <AdminSidebarContent
        collapsed={collapsed}
        showCollapseToggle
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
    </aside>
  );
}

interface AdminSidebarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSidebarDrawer({ open, onOpenChange }: AdminSidebarDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-screen max-w-none p-0 flex flex-col bg-card border-none"
      >
        <SheetTitle className="sr-only">Навигация</SheetTitle>
        <AdminSidebarContent
          forceExpanded
          onNavigate={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
```

Changes versus original:
- Navigation item padding becomes `px-3 py-3 text-base md:text-sm` when expanded (bigger tap target on mobile)
- Navigation items call `onNavigate` prop on click (used by drawer to close itself)
- `AdminSidebar` desktop variant uses `hidden md:flex` so it disappears below 768px
- New `AdminSidebarDrawer` wraps the same content in a fullscreen `Sheet side="left"` (`w-screen max-w-none`)
- `SheetTitle` with `sr-only` class is required by Radix Dialog a11y, user won't see it

- [ ] **Step 2: Typecheck**

Run: `pnpm web:build`
Expected: PASS. The sidebar disappears on mobile viewports — navigation becomes unreachable until Task 8 wires the drawer. That's OK, intermediate state.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/widgets/admin-sidebar/ui.tsx
git commit -m "refactor(sidebar): split into Content/Desktop/Drawer exports"
```

---

## Task 8: Wire hamburger + drawer into AdminLayout

**Files:**
- Modify: `apps/web/src/app/layouts/admin-layout.tsx`

- [ ] **Step 1: Replace admin-layout.tsx**

```tsx
import { useState } from 'react';
import { Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { List } from '@phosphor-icons/react';
import { AdminSidebar, AdminSidebarDrawer } from '@/widgets/admin-sidebar/ui';
import { getMeFn } from '@/entities/session/api';
import { sessionSet } from '@/entities/session/model';

export function AdminLayout() {
  const { data: user } = useQuery({
    queryKey: ['session', 'me'],
    queryFn: getMeFn,
  });

  useEffect(() => {
    if (user) sessionSet(user);
  }, [user]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <AdminSidebarDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-4 md:p-6 min-w-0">
        {/* Mobile header: hamburger + brand */}
        <header className="md:hidden flex items-center gap-3 mb-4 pb-3 border-b border-border">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-foreground transition-colors"
            aria-label="Открыть меню"
          >
            <List size={24} weight="bold" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              I
            </div>
            <span className="font-bold text-foreground">Iridium</span>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
```

Changes:
- Desktop sidebar `AdminSidebar` renders (it handles its own `hidden md:flex`)
- Mobile `AdminSidebarDrawer` rendered unconditionally, its own Sheet manages visibility via `drawerOpen` state
- New mobile-only `<header>` with hamburger + brand appears inside `<main>` at the top (visible only below 768px via `md:hidden`)
- Hamburger toggles `drawerOpen`
- Main padding reduced on mobile (`p-4 md:p-6`) for more content space

- [ ] **Step 2: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 3: Manual verification**

Run `pnpm web:dev`. Open in Chrome DevTools:
- **Desktop (1280×800)**: sidebar visible on left, no hamburger, no mobile header
- **Mobile (iPhone 12 390×844)**: sidebar hidden, hamburger + "Iridium" visible at top of main, click hamburger → fullscreen drawer slides in from left with all nav items, click any item → navigates + drawer closes

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/layouts/admin-layout.tsx
git commit -m "feat(layout): mobile hamburger header + sidebar drawer wiring"
```

---

## Task 9: DataTable mobile card layout (shared infrastructure)

**Files:**
- Modify: `apps/web/src/shared/ui/data-table/index.tsx`
- Create: `apps/web/src/shared/ui/data-table/default-card.tsx`

- [ ] **Step 1: Create default card renderer**

Create `apps/web/src/shared/ui/data-table/default-card.tsx`:

```tsx
import { flexRender, type Row, type Cell } from '@tanstack/react-table';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';

/**
 * Default mobile card renderer used when a page does not provide its own.
 * Shows the first non-service column as title, the next two as subtitle.
 */
export function DefaultMobileCard<TData>({ row }: { row: Row<TData> }) {
  const cells = row.getVisibleCells() as Cell<TData, unknown>[];
  const dataCells = cells.filter((c) => c.column.id !== 'select' && c.column.id !== 'actions');
  const [titleCell, ...rest] = dataCells;
  const subtitle = rest.slice(0, 2);
  const footer = rest.slice(2);

  const selectCell = cells.find((c) => c.column.id === 'select');
  const actionsCell = cells.find((c) => c.column.id === 'actions');

  return (
    <Card
      className={cn(
        'p-4 gap-3',
        row.getIsSelected() && 'ring-2 ring-primary',
      )}
    >
      <div className="flex items-start gap-3">
        {selectCell && (
          <div className="pt-1">{flexRender(selectCell.column.columnDef.cell, selectCell.getContext())}</div>
        )}
        <div className="flex-1 min-w-0">
          {titleCell && (
            <div className="font-semibold text-foreground text-base truncate">
              {flexRender(titleCell.column.columnDef.cell, titleCell.getContext())}
            </div>
          )}
          {subtitle.length > 0 && (
            <div className="text-sm text-muted-foreground truncate mt-0.5">
              {subtitle.map((cell) => (
                <span key={cell.id} className="[&:not(:first-child)]:before:content-['·_'] [&:not(:first-child)]:before:mx-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              ))}
            </div>
          )}
        </div>
        {actionsCell && (
          <div>{flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}</div>
        )}
      </div>
      {footer.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {footer.map((cell) => {
            const header = cell.column.columnDef.header;
            const headerLabel = typeof header === 'string' ? header : cell.column.id;
            return (
              <div key={cell.id} className="flex flex-col">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">{headerLabel}</span>
                <span className="text-foreground">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Update DataTable to render cards on mobile**

In `apps/web/src/shared/ui/data-table/index.tsx`, modify the props interface to add `mobileCardRenderer`:

```tsx
import { type Row } from '@tanstack/react-table';
import { DefaultMobileCard } from './default-card';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterOptions?: { key: string; label: string; options: { value: string; label: string }[] }[];
  onCreateClick?: () => void;
  createLabel?: string;
  isLoading?: boolean;
  mobileCardRenderer?: (row: Row<TData>) => React.ReactNode;
}
```

Then add the prop to the destructure:
```tsx
export function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Поиск...',
  filterOptions,
  onCreateClick,
  createLabel = 'Добавить',
  isLoading,
  mobileCardRenderer,
}: DataTableProps<TData>) {
```

Inside the JSX, wrap the existing `<div className="rounded-xl border border-border bg-card flex-1 grid">` block with `hidden md:grid` to hide it on mobile, then add a mobile-only block right after it:

```tsx
{/* Desktop table */}
<div className="hidden md:grid rounded-xl border border-border bg-card flex-1">
  <div className="overflow-x-auto">
    <Table>
      {/* existing Table contents unchanged */}
    </Table>
  </div>
</div>

{/* Mobile cards */}
<div className="md:hidden space-y-3 flex-1">
  {isLoading ? (
    <div className="text-center text-muted-foreground py-8">Загрузка...</div>
  ) : table.getRowModel().rows.length === 0 ? (
    <div className="text-center text-muted-foreground py-8">Нет данных</div>
  ) : (
    table.getRowModel().rows.map((row) => (
      <div key={row.id}>
        {mobileCardRenderer
          ? mobileCardRenderer(row)
          : <DefaultMobileCard row={row} />}
      </div>
    ))
  )}
</div>
```

Note: the original desktop grid wrapper already uses `grid` (from the Group A scroll fix) — preserve that. The class change is adding `hidden md:grid` (previously just `grid`).

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Run `pnpm web:dev`. Open any admin page like `/trips` at desktop resolution — table unchanged. Toggle to iPhone 12 in DevTools — cards appear instead of the table, each showing title + subtitle from the default renderer.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/ui/data-table/index.tsx apps/web/src/shared/ui/data-table/default-card.tsx
git commit -m "feat(data-table): mobile card layout with default renderer"
```

---

## Task 10: DataTableToolbar mobile two-row layout with filter sheet

**Files:**
- Modify: `apps/web/src/shared/ui/data-table/toolbar.tsx`
- Create: `apps/web/src/shared/ui/data-table/mobile-filter-sheet.tsx`

- [ ] **Step 1: Create mobile filter sheet**

Create `apps/web/src/shared/ui/data-table/mobile-filter-sheet.tsx`:

```tsx
import { type Table } from '@tanstack/react-table';
import { Funnel, X } from '@phosphor-icons/react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

interface MobileFilterSheetProps<TData> {
  table: Table<TData>;
  filterOptions: { key: string; label: string; options: { value: string; label: string }[] }[];
}

export function MobileFilterSheet<TData>({ table, filterOptions }: MobileFilterSheetProps<TData>) {
  const [open, setOpen] = useState(false);

  const activeCount = filterOptions.filter(
    (f) => table.getColumn(f.key)?.getFilterValue() !== undefined,
  ).length;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="relative">
        <Funnel size={16} weight="bold" />
        Фильтры
        {activeCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {activeCount}
          </span>
        )}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[80vh] flex flex-col">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle>Фильтры</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filterOptions.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium">{filter.label}</label>
                <Select
                  value={(table.getColumn(filter.key)?.getFilterValue() as string) ?? '__all__'}
                  onValueChange={(value) =>
                    table
                      .getColumn(filter.key)
                      ?.setFilterValue(value === '__all__' ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Все</SelectItem>
                    {filter.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <SheetFooter className="border-t border-border p-4 flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                filterOptions.forEach((f) => table.getColumn(f.key)?.setFilterValue(undefined));
              }}
              className="flex-1"
            >
              Сбросить
            </Button>
            <Button onClick={() => setOpen(false)} className="flex-1">
              Применить
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

- [ ] **Step 2: Replace DataTableToolbar**

Replace `apps/web/src/shared/ui/data-table/toolbar.tsx` contents:

```tsx
import { type Table } from '@tanstack/react-table';
import { Plus } from '@phosphor-icons/react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { MobileFilterSheet } from './mobile-filter-sheet';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  searchPlaceholder?: string;
  filterOptions?: { key: string; label: string; options: { value: string; label: string }[] }[];
  onCreateClick?: () => void;
  createLabel?: string;
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder,
  filterOptions,
  onCreateClick,
  createLabel,
}: DataTableToolbarProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: search + create button */}
      <div className="flex items-center gap-3">
        <Input
          variant="search"
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="flex-1 md:max-w-md"
        />

        {/* Desktop: inline filters */}
        {filterOptions?.map((filter) => (
          <Select
            key={filter.key}
            value={(table.getColumn(filter.key)?.getFilterValue() as string) ?? '__all__'}
            onValueChange={(value) =>
              table.getColumn(filter.key)?.setFilterValue(value === '__all__' ? undefined : value)
            }
          >
            <SelectTrigger className="hidden md:flex w-[180px] h-10">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Все</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        <div className="hidden md:block flex-1" />

        {selectedCount > 0 && (
          <span className="hidden md:inline text-sm text-muted-foreground">
            Выбрано: {selectedCount}
          </span>
        )}

        {onCreateClick && (
          <Button onClick={onCreateClick}>
            <Plus size={18} />
            <span className="hidden md:inline">{createLabel}</span>
          </Button>
        )}
      </div>

      {/* Row 2: mobile filter sheet trigger */}
      {filterOptions && filterOptions.length > 0 && (
        <div className="md:hidden">
          <MobileFilterSheet table={table} filterOptions={filterOptions} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Manual verification**

On `/admin/trips` or `/admin/vehicles` (have filterOptions): desktop shows inline filter selects, mobile shows two-row layout with "+ icon-only" create button and "Фильтры" button below opening a bottom sheet with the filters.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/ui/data-table/toolbar.tsx apps/web/src/shared/ui/data-table/mobile-filter-sheet.tsx
git commit -m "feat(data-table): mobile two-row toolbar with filter sheet"
```

---

## Task 11: Per-page mobile card renderers — users, drivers, vehicles

**Files:**
- Modify: `apps/web/src/pages/admin/users.tsx`
- Modify: `apps/web/src/pages/admin/drivers.tsx`
- Modify: `apps/web/src/pages/admin/vehicles.tsx`

For each file, add a `mobileCardRenderer` that renders a `Card` with page-specific content.

- [ ] **Step 1: users.tsx mobile card**

In `apps/web/src/pages/admin/users.tsx`, import `Card` at the top (if not already):
```tsx
import { Card } from '@/shared/ui/card';
import type { Row } from '@tanstack/react-table';
```

Add inside `UsersPage` component, after the `columns` memo:
```tsx
const mobileCardRenderer = (row: Row<User>) => {
  const user = row.original;
  return (
    <Card className={cn('p-4 gap-2', row.getIsSelected() && 'ring-2 ring-primary')}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
          aria-label="Выбрать"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">{user.fullName}</div>
          <div className="text-sm text-muted-foreground truncate">{user.login}</div>
        </div>
        <RowActions>
          {user.status === 'PENDING' && (
            <RowActionItem onClick={() => handleApprove(user.id)} icon={CheckCircle} label="Активировать" />
          )}
          {user.status === 'ACTIVE' && (
            <RowActionItem onClick={() => handleBlock(user.id)} icon={Prohibit} label="Заблокировать" />
          )}
          <RowActionItem
            onClick={() => toast.info('Увольнение будет добавлено позже')}
            icon={UserMinus}
            label="Уволить"
            variant="destructive"
          />
        </RowActions>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mt-1">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Роль</div>
          <div className="text-foreground"><RoleBadge role={user.role} /></div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Статус</div>
          <Badge variant={statusVariant[user.status] ?? 'neutral'}>
            {USER_STATUS_LABELS[user.status] ?? user.status}
          </Badge>
        </div>
        {user.phone && (
          <div className="col-span-2">
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Телефон</div>
            <div className="text-foreground">{user.phone}</div>
          </div>
        )}
      </div>
    </Card>
  );
};
```

Add `cn` to imports if not present:
```tsx
import { cn } from '@/shared/lib/utils';
```

Then pass to `<DataTable>`:
```tsx
<DataTable
  columns={columns}
  data={users ?? []}
  isLoading={isLoading}
  searchPlaceholder="Поиск пользователей..."
  filterOptions={filterOptions}
  onCreateClick={() => setDialogOpen(true)}
  createLabel="Добавить"
  mobileCardRenderer={mobileCardRenderer}
/>
```

- [ ] **Step 2: drivers.tsx mobile card**

In `apps/web/src/pages/admin/drivers.tsx`, add imports:
```tsx
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import type { Row } from '@tanstack/react-table';
```

Inside `DriversPage` after the `columns` memo:
```tsx
const mobileCardRenderer = (row: Row<User>) => {
  const driver = row.original;
  const vehicle = vehicleByDriver.get(driver.id);
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">{driver.fullName}</div>
          <div className="text-sm text-muted-foreground truncate">{driver.phone ?? '—'}</div>
        </div>
        <Badge variant={statusVariant[driver.status] ?? 'neutral'}>
          {USER_STATUS_LABELS[driver.status] ?? driver.status}
        </Badge>
      </div>
      {vehicle && (
        <div className="text-xs">
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Привязанное ТС</div>
          <div className="text-foreground">{vehicle}</div>
        </div>
      )}
    </Card>
  );
};
```

Pass prop to DataTable (add to existing usage):
```tsx
<DataTable
  columns={columns}
  data={drivers ?? []}
  isLoading={isLoading}
  searchPlaceholder="Поиск водителей..."
  mobileCardRenderer={mobileCardRenderer}
/>
```

- [ ] **Step 3: vehicles.tsx mobile card**

In `apps/web/src/pages/admin/vehicles.tsx`, add `Card` and `cn` and `Row` imports as above.

Inside `VehiclesPage` after the `columns` useMemo:
```tsx
const mobileCardRenderer = (row: Row<Vehicle>) => {
  const v = row.original;
  return (
    <Card className={cn('p-4 gap-2', row.getIsSelected() && 'ring-2 ring-primary')}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
          aria-label="Выбрать"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">{v.brand} {v.model}</div>
          <div className="text-sm text-muted-foreground truncate">{v.licensePlate}</div>
        </div>
        <RowActions>
          {v.status !== 'ACTIVE' && (
            <RowActionItem onClick={() => handleSetStatus(v.id, 'ACTIVE')} icon={CheckCircle} label="Активировать" />
          )}
          {v.status !== 'IN_REPAIR' && (
            <RowActionItem onClick={() => handleSetStatus(v.id, 'IN_REPAIR')} icon={Wrench} label="Отправить на ремонт" />
          )}
          {v.status !== 'INACTIVE' && (
            <RowActionItem onClick={() => handleSetStatus(v.id, 'INACTIVE')} icon={Prohibit} label="Деактивировать" variant="destructive" />
          )}
        </RowActions>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Тип владения</div>
          <div className="text-foreground">{OWNERSHIP_LABELS[v.ownershipType] ?? v.ownershipType}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Статус</div>
          <Badge variant={statusVariant[v.status] ?? 'neutral'}>
            {VEHICLE_STATUS_LABELS[v.status] ?? v.status}
          </Badge>
        </div>
        {v.trailerPlate && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Прицеп</div>
            <div className="text-foreground">{v.trailerPlate}</div>
          </div>
        )}
        {v.assignedDriver && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Водитель</div>
            <div className="text-foreground truncate">{v.assignedDriver.fullName}</div>
          </div>
        )}
      </div>
    </Card>
  );
};
```

Pass prop:
```tsx
<DataTable
  columns={columns}
  data={vehicles ?? []}
  isLoading={isLoading}
  searchPlaceholder="Поиск транспорта..."
  filterOptions={filterOptions}
  onCreateClick={() => setDialogOpen(true)}
  createLabel="Добавить"
  mobileCardRenderer={mobileCardRenderer}
/>
```

- [ ] **Step 4: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/users.tsx apps/web/src/pages/admin/drivers.tsx apps/web/src/pages/admin/vehicles.tsx
git commit -m "feat(pages): mobile card renderers for users, drivers, vehicles"
```

---

## Task 12: Per-page mobile card renderers — trips, waybills, routes

**Files:**
- Modify: `apps/web/src/pages/admin/trips.tsx`
- Modify: `apps/web/src/pages/admin/waybills.tsx`
- Modify: `apps/web/src/pages/admin/routes.tsx`

**Note:** `trips.tsx`, `waybills.tsx`, and `routes.tsx` currently define `columns` at module scope (not inside the component). For this task, those files keep module-scope columns — the `mobileCardRenderer` is a separate module-scope function (or inline arrow) passed to DataTable.

- [ ] **Step 1: trips.tsx mobile card**

In `apps/web/src/pages/admin/trips.tsx`, add imports at the top:
```tsx
import { Card } from '@/shared/ui/card';
import type { Row } from '@tanstack/react-table';
```

Add a module-scope render function after the `columns` array:

```tsx
function renderTripCard(row: Row<Trip>) {
  const trip = row.original;
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
          aria-label="Выбрать"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">{trip.driver.fullName}</div>
          <div className="text-sm text-muted-foreground truncate">
            {trip.route.senderContractor.name} → {trip.route.receiverContractor.name}
          </div>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">ТС</div>
          <div className="text-foreground">{trip.vehicle.licensePlate}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Груз</div>
          <div className="text-foreground truncate">{trip.cargo.name}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">ТТН</div>
          <div className="text-foreground">{trip.waybill?.ttnNumber ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Дата</div>
          <div className="text-foreground">{new Date(trip.assignedAt).toLocaleDateString('ru-RU')}</div>
        </div>
      </div>
    </Card>
  );
}
```

Pass to DataTable:
```tsx
<DataTable
  columns={columns}
  data={trips ?? []}
  isLoading={isLoading}
  searchPlaceholder="Поиск по водителю, маршруту..."
  filterOptions={[{ key: 'status', label: 'Статус', options: statusFilterOptions }]}
  onCreateClick={() => setCreateOpen(true)}
  createLabel="Создать рейс"
  mobileCardRenderer={renderTripCard}
/>
```

- [ ] **Step 2: waybills.tsx mobile card**

In `apps/web/src/pages/admin/waybills.tsx`, add imports:
```tsx
import { Card } from '@/shared/ui/card';
import type { Row } from '@tanstack/react-table';
```

Add module-scope render function after `columns`:

```tsx
function renderWaybillCard(row: Row<Waybill>) {
  const wb = row.original;
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
          aria-label="Выбрать"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">ТТН {wb.ttnNumber}</div>
          <div className="text-sm text-muted-foreground truncate">{wb.driverFullName}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Вес (т)</div>
          <div className="text-foreground">{Number(wb.weight).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Вес налива (т)</div>
          <div className="text-foreground">{Number(wb.loadWeight).toFixed(2)}</div>
        </div>
        <div className="col-span-2">
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Маршрут</div>
          <div className="text-foreground truncate">
            {wb.trip.route.senderContractor.name} → {wb.trip.route.receiverContractor.name}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Дата</div>
          <div className="text-foreground">
            {new Date(wb.submittedAt).toLocaleString('ru-RU', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
```

Pass to DataTable:
```tsx
<DataTable
  columns={columns}
  data={waybills ?? []}
  isLoading={isLoading}
  searchPlaceholder="Поиск по ТТН, водителю..."
  mobileCardRenderer={renderWaybillCard}
/>
```

- [ ] **Step 3: routes.tsx mobile card**

In `apps/web/src/pages/admin/routes.tsx`, add imports:
```tsx
import { Card } from '@/shared/ui/card';
import type { Row } from '@tanstack/react-table';
```

Add module-scope render function:

```tsx
function renderRouteCard(row: Row<Route>) {
  const r = row.original;
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
          aria-label="Выбрать"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">
            {r.senderContractor.name} → {r.receiverContractor.name}
          </div>
          <div className="text-sm text-muted-foreground truncate">{truncate(r.loadingAddress)}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Адрес выгрузки</div>
          <div className="text-foreground">{truncate(r.unloadingAddress)}</div>
        </div>
        {r.description && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Описание</div>
            <div className="text-foreground">{r.description}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
```

Pass to DataTable:
```tsx
<DataTable
  columns={columns}
  data={routes ?? []}
  isLoading={isLoading}
  searchPlaceholder="Поиск маршрутов..."
  onCreateClick={() => setDialogOpen(true)}
  createLabel="Добавить"
  mobileCardRenderer={renderRouteCard}
/>
```

- [ ] **Step 4: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/trips.tsx apps/web/src/pages/admin/waybills.tsx apps/web/src/pages/admin/routes.tsx
git commit -m "feat(pages): mobile card renderers for trips, waybills, routes"
```

---

## Task 13: Per-page mobile card renderers — contractors, cargos

**Files:**
- Modify: `apps/web/src/pages/admin/contractors.tsx`
- Modify: `apps/web/src/pages/admin/cargos.tsx`

- [ ] **Step 1: contractors.tsx mobile card**

Imports:
```tsx
import { Card } from '@/shared/ui/card';
import type { Row } from '@tanstack/react-table';
```

Render function at module scope:

```tsx
function renderContractorCard(row: Row<Contractor>) {
  const c = row.original;
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
          aria-label="Выбрать"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">{c.name}</div>
          <div className="text-sm text-muted-foreground truncate">{c.inn ?? '—'}</div>
        </div>
        <Badge variant={typeVariant[c.type] ?? 'neutral'}>
          {CONTRACTOR_TYPE_LABELS[c.type] ?? c.type}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {c.contactPhone && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Телефон</div>
            <div className="text-foreground truncate">{c.contactPhone}</div>
          </div>
        )}
        {c.contactPerson && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Контактное лицо</div>
            <div className="text-foreground truncate">{c.contactPerson}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
```

Pass:
```tsx
<DataTable
  columns={columns}
  data={contractors ?? []}
  isLoading={isLoading}
  searchPlaceholder="Поиск контрагентов..."
  filterOptions={filterOptions}
  onCreateClick={() => setDialogOpen(true)}
  createLabel="Добавить"
  mobileCardRenderer={renderContractorCard}
/>
```

- [ ] **Step 2: cargos.tsx mobile card**

Imports:
```tsx
import { Card } from '@/shared/ui/card';
import type { Row } from '@tanstack/react-table';
```

Render function:

```tsx
function renderCargoCard(row: Row<Cargo>) {
  const c = row.original;
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
          aria-label="Выбрать"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">{c.name}</div>
          <div className="text-sm text-muted-foreground truncate">{c.technicalSpec ?? '—'}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {c.unCode && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">UN код</div>
            <div className="text-foreground">{c.unCode}</div>
          </div>
        )}
        {c.hazardClass && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Класс</div>
            <div className="text-foreground">{c.hazardClass}</div>
          </div>
        )}
        {c.packagingMethod && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Упаковка</div>
            <div className="text-foreground truncate">{c.packagingMethod}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
```

Pass:
```tsx
<DataTable
  columns={columns}
  data={cargos ?? []}
  isLoading={isLoading}
  searchPlaceholder="Поиск грузов..."
  onCreateClick={() => setDialogOpen(true)}
  createLabel="Добавить"
  mobileCardRenderer={renderCargoCard}
/>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Manual verification (all 8 pages)**

Open `http://localhost:5173` in Chrome DevTools at iPhone 12. Navigate to `/trips`, `/waybills`, `/users`, `/drivers`, `/vehicles`, `/contractors`, `/cargos`, `/routes`. Each page should show card list instead of table. Cards should be readable, not clipped, with appropriate per-page fields.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/contractors.tsx apps/web/src/pages/admin/cargos.tsx
git commit -m "feat(pages): mobile card renderers for contractors, cargos"
```

---

## Task 14: Migrate create-trip and users dialogs to ResponsiveDialog

**Files:**
- Modify: `apps/web/src/features/create-trip/ui.tsx`
- Modify: `apps/web/src/pages/admin/users.tsx`

For each dialog, replace `Dialog` → `ResponsiveDialog`, wrap the form to include header + body + footer, move submit button to footer.

- [ ] **Step 1: create-trip dialog**

In `apps/web/src/features/create-trip/ui.tsx`, replace imports:
```tsx
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/shared/ui/responsive-dialog';
import { DialogTrigger } from '@/shared/ui/dialog';
```

(Keep `DialogTrigger` from `dialog.tsx` — there's no `ResponsiveDialogTrigger` since trigger semantics are the same in both Dialog and Sheet at the Radix level.)

Replace the JSX return:
```tsx
return (
  <ResponsiveDialog open={open} onOpenChange={setOpen}>
    {controlledOpen === undefined && (
      <DialogTrigger asChild>
        <Button>Создать рейс</Button>
      </DialogTrigger>
    )}
    <ResponsiveDialogContent>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Новый рейс</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-4">
          {/* existing form fields unchanged: Маршрут, Водитель, ТС, Груз */}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter className="flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Создание...' : 'Создать'}
          </Button>
        </ResponsiveDialogFooter>
      </form>
    </ResponsiveDialogContent>
  </ResponsiveDialog>
);
```

The four `<Controller>` fields move INSIDE `ResponsiveDialogBody`. The existing submit buttons move into `ResponsiveDialogFooter`.

Note on the `DialogTrigger` usage: `DialogTrigger` is from `@radix-ui/react-dialog`. `SheetTrigger` is also from `@radix-ui/react-dialog` (they share primitives). On mobile, `ResponsiveDialog` renders a `<Sheet>` (which uses the same Dialog primitive internally), so `DialogTrigger` as asChild still works as the sheet trigger. No separate trigger wrapper needed.

- [ ] **Step 2: users.tsx create dialog**

In `apps/web/src/pages/admin/users.tsx`, replace the `Dialog` imports with `ResponsiveDialog`:

```tsx
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/shared/ui/responsive-dialog';
```

Replace the Dialog JSX:
```tsx
<ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <ResponsiveDialogContent>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Новый пользователь</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="space-y-4">
        {/* all the existing space-y-4 form field divs */}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="submit" className="w-full" disabled={createUser.isPending}>
          {createUser.isPending ? 'Создание...' : 'Создать'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Manual verification**

On mobile: navigate to `/trips`, click `+` → create trip dialog slides up from bottom as a sheet with drag handle, form scrolls if tall, "Создать" button sticky at bottom. Same for `/users`. On desktop: centered modal as before.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/create-trip/ui.tsx apps/web/src/pages/admin/users.tsx
git commit -m "feat(dialogs): migrate create-trip and users to ResponsiveDialog"
```

---

## Task 15: Migrate vehicles, routes, contractors, cargos dialogs to ResponsiveDialog

**Files:**
- Modify: `apps/web/src/pages/admin/vehicles.tsx`
- Modify: `apps/web/src/pages/admin/routes.tsx`
- Modify: `apps/web/src/pages/admin/contractors.tsx`
- Modify: `apps/web/src/pages/admin/cargos.tsx`

Same migration pattern as Task 14: replace `Dialog*` with `ResponsiveDialog*`, wrap form to include Header + Body + Footer, move submit button to Footer.

- [ ] **Step 1: vehicles.tsx**

Replace Dialog imports with ResponsiveDialog equivalents. Restructure the dialog JSX:

```tsx
<ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <ResponsiveDialogContent>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Новое транспортное средство</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="space-y-4">
        {/* All existing form field divs: Марка, Модель, Госномер, Прицеп, Тип владения, Водитель, Разрешённые грузы */}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="submit" className="w-full" disabled={createVehicle.isPending}>
          {createVehicle.isPending ? 'Создание...' : 'Создать'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

- [ ] **Step 2: routes.tsx**

Same pattern:

```tsx
<ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <ResponsiveDialogContent>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Новый маршрут</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="space-y-4">
        {/* Отправитель, Получатель, Адрес погрузки, Адрес выгрузки, Описание */}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="submit" className="w-full" disabled={createRoute.isPending}>
          {createRoute.isPending ? 'Создание...' : 'Создать'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

- [ ] **Step 3: contractors.tsx**

```tsx
<ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <ResponsiveDialogContent>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Новый контрагент</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="space-y-4">
        {/* Название, ИНН, Тип, Юр. адрес, Факт. адрес, Телефон, Контактное лицо */}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="submit" className="w-full" disabled={createContractor.isPending}>
          {createContractor.isPending ? 'Создание...' : 'Создать'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

- [ ] **Step 4: cargos.tsx**

```tsx
<ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <ResponsiveDialogContent>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Новый груз</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="space-y-4">
        {/* Название, ТУ, UN код, Класс опасности, Упаковка */}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="submit" className="w-full" disabled={createCargo.isPending}>
          {createCargo.isPending ? 'Создание...' : 'Создать'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

- [ ] **Step 5: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 6: Manual verification**

On mobile, open each create dialog (vehicles, routes, contractors, cargos). All should slide up as bottom sheets with sticky header + sticky submit button. Forms scroll between them.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/admin/vehicles.tsx apps/web/src/pages/admin/routes.tsx apps/web/src/pages/admin/contractors.tsx apps/web/src/pages/admin/cargos.tsx
git commit -m "feat(dialogs): migrate remaining admin create dialogs to ResponsiveDialog"
```

---

## Task 16: PageHeader and chart widget responsive polish

**Files:**
- Modify: `apps/web/src/widgets/page-header/ui.tsx`
- Modify: `apps/web/src/widgets/trips-per-week/ui.tsx`
- Modify: `apps/web/src/widgets/transport-volume/ui.tsx`

- [ ] **Step 1: PageHeader responsive layout**

Replace `apps/web/src/widgets/page-header/ui.tsx`:

```tsx
import { UserPopover } from '@/shared/ui/user-popover';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
        )}
      </div>
      <div className="hidden md:block">
        <UserPopover />
      </div>
    </div>
  );
}
```

Changes:
- Title shrinks on mobile (`text-xl md:text-2xl`)
- Title and description get `truncate` to prevent wrapping
- `UserPopover` hidden on mobile (`hidden md:block`) — user info already accessible via the drawer menu

- [ ] **Step 2: TripsPerWeek tooltip mobile constraints**

In `apps/web/src/widgets/trips-per-week/ui.tsx`, find the `TripsTooltip` component. Update its root div className:

```tsx
<div className="grid min-w-[12rem] max-w-[90vw] max-h-[50vh] overflow-y-auto items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
```

Adds `max-w-[90vw] max-h-[50vh] overflow-y-auto` so long driver lists don't exceed viewport or clip.

- [ ] **Step 3: Chart tick formatters for mobile**

Both `trips-per-week/ui.tsx` and `transport-volume/ui.tsx` have `XAxis` with `tickFormatter={(value) => value.slice(0, 3)}`. 2-letter Russian weekday abbreviations already fit (`.slice(0,3)` leaves them intact). No change needed to the formatter — verify during manual testing.

If labels overlap on 375px during verification: lower `tickMargin` from 10 to 4, or use `interval="preserveStartEnd"` to show fewer ticks.

- [ ] **Step 4: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 5: Manual verification**

On mobile (iPhone SE 375×667):
- Dashboard page header: title "Доброе утро, Низамов Василий Олегович" truncates with ellipsis if needed, no collision with profile area (since profile is hidden on mobile)
- Admin page headers: same truncation behavior
- TripsPerWeek chart: hover a bar with multiple drivers — tooltip does not exceed 90% of viewport width, scrolls internally if driver list is tall
- Both charts: weekday labels don't overlap; if they do, apply the fallback from Step 3

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/widgets/page-header/ui.tsx apps/web/src/widgets/trips-per-week/ui.tsx apps/web/src/widgets/transport-volume/ui.tsx
git commit -m "feat(widgets): responsive PageHeader and chart tooltip constraints"
```

---

## Final Verification

- [ ] **Full build**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Comprehensive mobile walkthrough**

Run `pnpm web:dev`, open Chrome DevTools, iPhone 12 Pro profile. Walk through:

1. **Splash screen** — hard reload (Cmd+Shift+R). Splash visible briefly before app mounts.
2. **Login** — tap login field → no viewport zoom. Form fits 390px width.
3. **Dashboard** — hamburger visible in top-left, page header truncates gracefully. All widgets readable.
4. **Drawer** — tap hamburger → fullscreen drawer slides in from left. All 9 nav items visible with icons and labels. Tap any item → navigates + drawer closes.
5. **Trips table** — cards instead of table, each with driver name, route, status badge, grid of ТС/Груз/ТТН/Дата. Checkbox selection works.
6. **Create trip** — tap `+` → bottom sheet slides up with drag handle, form fields, sticky Cancel + Create buttons at bottom. Form scrolls if content taller than sheet.
7. **Other pages** — verify vehicles, users, drivers, contractors, cargos, routes, waybills all have functional mobile layouts (table → cards, dialog → sheet).
8. **PWA** — Chrome DevTools → Application → Manifest: name "Iridium — Система управления перевозками", theme cobalt. Service worker "activated and running".
9. **Desktop sanity** — resize to 1280×800: sidebar back, tables back, dialogs centered, nothing broken.

- [ ] **Build artifact inspection**

After `pnpm web:build`, check that `apps/web/dist/` contains:
- `manifest.webmanifest` (generated by vite-plugin-pwa)
- `sw.js`
- `workbox-*.js`
- `index.html` with splash markup and meta tags intact
