# Redesign V2 — Foundation (Plan 1/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the amber palette with Rayum-inspired Cobalt/Mint palette, implement dark/light theming, restyle all shared UI components with proper cva variants, set up Storybook, add missing components (Checkbox, DropdownMenu, Pagination, ThemeToggle, UserPopover).

**Architecture:** CSS-first approach — change `index.css` tokens to switch entire app. Components use cva for variants, shadcn/Radix stays as base. ThemeProvider via React context + localStorage + `.light` class on `<html>`. Storybook for visual testing.

**Tech Stack:** Tailwind v4, cva (class-variance-authority), Radix UI, Storybook, Phosphor Icons.

---

## File Structure

```
apps/web/
├── src/
│   ├── index.css                          # REWRITE — new palette, dark/light tokens
│   ├── shared/
│   │   ├── lib/
│   │   │   ├── utils.ts                   # existing, no changes
│   │   │   └── theme.tsx                  # NEW — ThemeProvider + useTheme hook
│   │   ├── ui/
│   │   │   ├── button.tsx                 # MODIFY — new variants (primary/secondary/outline/ghost/danger)
│   │   │   ├── input.tsx                  # MODIFY — add search variant with icon, sizes
│   │   │   ├── badge.tsx                  # MODIFY — new variants (success/warning/danger/info/neutral)
│   │   │   ├── card.tsx                   # MODIFY — add stats/dark variants
│   │   │   ├── select.tsx                 # MODIFY — add filter variant
│   │   │   ├── dialog.tsx                 # MODIFY — restyle for dark theme, add confirm variant
│   │   │   ├── table.tsx                  # MODIFY — remove built-in container, clean for DataTable
│   │   │   ├── tabs.tsx                   # MODIFY — add pill variant
│   │   │   ├── checkbox.tsx               # NEW — via shadcn + restyle
│   │   │   ├── dropdown-menu.tsx          # NEW — via shadcn + restyle
│   │   │   ├── pagination.tsx             # NEW — custom component
│   │   │   ├── theme-toggle.tsx           # NEW — pill Light/Dark switcher
│   │   │   ├── user-popover.tsx           # NEW — avatar + name + dropdown
│   │   │   └── ... (existing unchanged: label, textarea, separator, accordion, sheet, sonner)
│   │   └── ui/__stories__/
│   │       ├── button.stories.tsx
│   │       ├── input.stories.tsx
│   │       ├── badge.stories.tsx
│   │       ├── card.stories.tsx
│   │       ├── dialog.stories.tsx
│   │       ├── select.stories.tsx
│   │       ├── table.stories.tsx
│   │       ├── tabs.stories.tsx
│   │       ├── checkbox.stories.tsx
│   │       ├── dropdown-menu.stories.tsx
│   │       ├── pagination.stories.tsx
│   │       ├── theme-toggle.stories.tsx
│   │       └── user-popover.stories.tsx
├── .storybook/
│   ├── main.ts
│   ├── preview.ts
│   └── preview-head.html
```

---

### Task 1: New CSS Tokens (Dark/Light)

**Files:**
- Rewrite: `apps/web/src/index.css`

- [ ] **Step 1: Replace entire index.css with new palette**

```css
/* apps/web/src/index.css */
@import 'tailwindcss';
@plugin 'tailwindcss-animate';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --radius: 0.5rem;

  /* ===== DARK THEME (default) ===== */
  --color-background: #181D25;
  --color-foreground: #F2F3F6;
  --color-card: #1E2530;
  --color-card-foreground: #F2F3F6;
  --color-popover: #1E2530;
  --color-popover-foreground: #F2F3F6;
  --color-border: #2A3140;
  --color-input: #2A3140;
  --color-ring: #3765F6;
  --color-muted: #2A3140;
  --color-muted-foreground: #606E80;
  --color-primary: #3765F6;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #2A3140;
  --color-secondary-foreground: #F2F3F6;
  --color-accent: #70FC8E;
  --color-accent-foreground: #181D25;
  --color-destructive: #EF4444;
  --color-destructive-foreground: #FFFFFF;
  --color-warning: #F59E0B;
  --color-success: #70FC8E;

  /* Named palette for direct use */
  --color-cobalt: #3765F6;
  --color-mint: #70FC8E;
  --color-obsidian: #181D25;
  --color-ghost: #F2F3F6;
  --color-mist: #606E80;
  --color-danger: #EF4444;
}

/* ===== LIGHT THEME ===== */
.light {
  --color-background: #F2F3F6;
  --color-foreground: #181D25;
  --color-card: #FFFFFF;
  --color-card-foreground: #181D25;
  --color-popover: #FFFFFF;
  --color-popover-foreground: #181D25;
  --color-border: #E3E5E8;
  --color-input: #E3E5E8;
  --color-muted: #E8EAED;
  --color-muted-foreground: #606E80;
  --color-secondary: #E8EAED;
  --color-secondary-foreground: #181D25;
}

/* Scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-muted) transparent;
}
*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb { background: var(--color-muted); border-radius: 3px; }
*::-webkit-scrollbar-thumb:hover { background: var(--color-muted-foreground); }

body {
  font-family: var(--font-sans);
  color: var(--color-foreground);
  background-color: var(--color-background);
}
```

IMPORTANT: Tailwind v4 `@theme` defines the default (dark) tokens. The `.light` class overrides them. Since `@theme` doesn't support nesting `.light`, light overrides go as a regular CSS rule block OUTSIDE `@theme`. Components use semantic tokens (`bg-card`, `text-foreground`, `border-border`) so they automatically adapt.

- [ ] **Step 2: Verify build**

```bash
pnpm --filter @iridium/shared run build && pnpm --filter @iridium/web run build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/index.css
git commit -m "feat: replace palette with Cobalt/Mint, add dark/light theme tokens"
```

---

### Task 2: ThemeProvider

**Files:**
- Create: `apps/web/src/shared/lib/theme.tsx`
- Modify: `apps/web/src/app/providers.tsx`
- Modify: `apps/web/src/app/layouts/driver-layout.tsx`

- [ ] **Step 1: Create ThemeProvider**

```tsx
// apps/web/src/shared/lib/theme.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'iridium-theme';

export function ThemeProvider({ children, forcedTheme }: { children: ReactNode; forcedTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (forcedTheme) return forcedTheme;
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    if (!forcedTheme) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme, forcedTheme]);

  const setTheme = (t: Theme) => {
    if (!forcedTheme) setThemeState(t);
  };

  const toggleTheme = () => {
    if (!forcedTheme) setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Wrap app in ThemeProvider**

Modify `apps/web/src/app/providers.tsx`:

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { useUnit } from 'effector-react';
import { queryClient } from '@/shared/api/query-client';
import { $isDriver } from '@/entities/session/model';
import { ThemeProvider } from '@/shared/lib/theme';
import { router } from './router';

export function Providers() {
  const isDriver = useUnit($isDriver);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position={isDriver ? 'bottom-center' : 'top-right'} richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 3: Force light theme for driver layout**

In `apps/web/src/app/layouts/driver-layout.tsx`, add effect to force light:

```tsx
// At top of DriverLayout component:
useEffect(() => {
  document.documentElement.classList.add('light');
  return () => {
    // Restore previous theme on unmount
    const stored = localStorage.getItem('iridium-theme');
    if (stored !== 'light') {
      document.documentElement.classList.remove('light');
    }
  };
}, []);
```

- [ ] **Step 4: Verify dark theme loads by default**

```bash
pnpm web:dev
```

Open http://localhost:5173 — should have dark background (#181D25).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/lib/theme.tsx apps/web/src/app/providers.tsx apps/web/src/app/layouts/driver-layout.tsx
git commit -m "feat: add ThemeProvider with dark/light toggle, force light for driver"
```

---

### Task 3: Restyle Button Component

**Files:**
- Modify: `apps/web/src/shared/ui/button.tsx`

- [ ] **Step 1: Rewrite button variants**

```tsx
// apps/web/src/shared/ui/button.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-muted text-foreground hover:bg-muted/80",
        outline: "border border-border bg-transparent text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

NOTE: Default variant changed from `default` to `primary`. All existing code that uses `<Button>` without variant now gets primary styling (cobalt blue). Code using `variant="destructive"` needs to change to `variant="danger"`.

- [ ] **Step 2: Search and replace old variant names across all files**

Find all `variant="destructive"` and change to `variant="danger"`.
Find all `variant="default"` and remove (primary is default).
Find all inline button styles like `className="bg-primary-500 hover:bg-primary-600 text-white"` and remove them — the variant handles it.

Run:
```bash
grep -rn 'variant="destructive"' apps/web/src/ --include="*.tsx"
grep -rn 'bg-primary-500' apps/web/src/ --include="*.tsx"
```

Fix each occurrence.

- [ ] **Step 3: Verify build**

```bash
pnpm --filter @iridium/web run build
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat: restyle Button with primary/secondary/outline/ghost/danger variants"
```

---

### Task 4: Restyle Input Component

**Files:**
- Modify: `apps/web/src/shared/ui/input.tsx`

- [ ] **Step 1: Add search variant and sizes**

```tsx
// apps/web/src/shared/ui/input.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { cn } from "@/shared/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg border border-input bg-card text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: { size: "md" },
  }
)

interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  variant?: "default" | "search";
  size?: "sm" | "md" | "lg";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "default", size = "md", type, ...props }, ref) => {
    if (variant === "search") {
      return (
        <div className="relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type={type}
            ref={ref}
            className={cn(inputVariants({ size }), "pl-10", className)}
            {...props}
          />
        </div>
      )
    }

    return (
      <input
        type={type}
        ref={ref}
        className={cn(inputVariants({ size }), className)}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input, inputVariants }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/shared/ui/input.tsx
git commit -m "feat: restyle Input with search variant, sizes, dark theme support"
```

---

### Task 5: Restyle Badge Component

**Files:**
- Modify: `apps/web/src/shared/ui/badge.tsx`

- [ ] **Step 1: Rewrite with semantic variants**

```tsx
// apps/web/src/shared/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        success: "bg-accent/15 text-accent border border-accent/20",
        warning: "bg-warning/15 text-warning border border-warning/20",
        danger: "bg-destructive/15 text-destructive border border-destructive/20",
        info: "bg-primary/15 text-primary border border-primary/20",
        neutral: "bg-muted text-muted-foreground border border-border",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
```

- [ ] **Step 2: Update all Badge usages**

Search for all places where Badge is used with old className-based styling:
- `TripStatusBadge` in `apps/web/src/entities/trip/ui.tsx` — map status to variant (ASSIGNED→neutral, EN_ROUTE→info, LOADING→warning, COMPLETED→success, CANCELLED→danger)
- `RoleBadge` in `apps/web/src/entities/session/ui.tsx` — ADMIN→danger, LOGIST→info, DRIVER→neutral
- User status badges in pages — PENDING→warning, ACTIVE→success, BLOCKED→danger

- [ ] **Step 3: Commit**

```bash
git add apps/web/
git commit -m "feat: restyle Badge with success/warning/danger/info/neutral variants"
```

---

### Task 6: Restyle Card, Dialog, Select, Table, Tabs

**Files:**
- Modify: `apps/web/src/shared/ui/card.tsx`
- Modify: `apps/web/src/shared/ui/dialog.tsx`
- Modify: `apps/web/src/shared/ui/select.tsx`
- Modify: `apps/web/src/shared/ui/table.tsx`
- Modify: `apps/web/src/shared/ui/tabs.tsx`

- [ ] **Step 1: Card — add stats and dark variants**

Add cva to Card component:
- `default`: `bg-card text-card-foreground rounded-xl border border-border`
- `stats`: same but `p-4` built-in
- `dark`: `bg-primary text-primary-foreground rounded-xl` (for first stat card)

- [ ] **Step 2: Dialog — restyle for dark theme**

- DialogOverlay: `bg-black/60 backdrop-blur-sm`
- DialogContent: `bg-card text-card-foreground border border-border rounded-2xl shadow-2xl`
- Ensure animation classes work with tailwindcss-animate

- [ ] **Step 3: Select — restyle trigger and content**

- SelectTrigger: `bg-card border-border text-foreground hover:border-muted-foreground`
- SelectContent: `bg-popover border-border rounded-xl shadow-lg`
- SelectItem: `hover:bg-muted cursor-pointer`
- Add `filter` variant: smaller, `h-8`, for toolbar usage

- [ ] **Step 4: Table — remove built-in container**

Remove the wrapping `<div>` with border/bg from Table component. The DataTable wrapper (Plan 3) will handle that. Table should be a clean `<table>` with just text/spacing styles:
- TableHead: `text-muted-foreground text-xs uppercase tracking-wider font-medium`
- TableRow: `border-b border-border hover:bg-muted/30 transition-colors`
- TableCell: `px-4 py-3`

- [ ] **Step 5: Tabs — add pill variant**

Add cva to TabsList and TabsTrigger:
- `default`: existing shadcn style adapted to dark theme
- `pill`: `bg-muted rounded-full` for TabsList, `rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground` for TabsTrigger

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/shared/ui/
git commit -m "feat: restyle Card, Dialog, Select, Table, Tabs for dark theme"
```

---

### Task 7: New Components (Checkbox, DropdownMenu, Pagination, ThemeToggle, UserPopover)

**Files:**
- Create: `apps/web/src/shared/ui/checkbox.tsx`
- Create: `apps/web/src/shared/ui/dropdown-menu.tsx`
- Create: `apps/web/src/shared/ui/pagination.tsx`
- Create: `apps/web/src/shared/ui/theme-toggle.tsx`
- Create: `apps/web/src/shared/ui/user-popover.tsx`

- [ ] **Step 1: Install shadcn Checkbox and DropdownMenu**

```bash
cd apps/web && npx shadcn@canary add checkbox dropdown-menu popover --yes
```

If files land in wrong directory, move to `src/shared/ui/`. Restyle to match dark theme tokens.

- [ ] **Step 2: Create Pagination component**

```tsx
// apps/web/src/shared/ui/pagination.tsx
import { cn } from "@/shared/lib/utils";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "./button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <CaretLeft size={16} />
      </Button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">...</span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'primary' : 'ghost'}
            size="icon-sm"
            className={cn("text-xs", p === page && "pointer-events-none")}
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </Button>
        )
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <CaretRight size={16} />
      </Button>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '...', total];
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}
```

- [ ] **Step 3: Create ThemeToggle**

```tsx
// apps/web/src/shared/ui/theme-toggle.tsx
import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/shared/lib/theme";
import { cn } from "@/shared/lib/utils";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (collapsed) {
    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }

  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
          theme === 'light' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun size={14} /> Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
          theme === 'dark' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon size={14} /> Dark
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create UserPopover**

```tsx
// apps/web/src/shared/ui/user-popover.tsx
import { CaretDown, SignOut } from "@phosphor-icons/react";
import { useUnit } from "effector-react";
import { useNavigate } from "@tanstack/react-router";
import { $user, sessionCleared } from "@/entities/session/model";
import { Badge } from "./badge";
import { Button } from "./button";
import { ROLE_LABELS } from "@/shared/config/constants";

// Uses Radix Popover — import from shared/ui/popover if installed,
// or use a simple dropdown with state

export function UserPopover() {
  const user = useUnit($user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const roleBadgeVariant = user.role === 'ADMIN' ? 'danger' : user.role === 'LOGIST' ? 'info' : 'neutral';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
      >
        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-foreground leading-none">{user.fullName}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
        </div>
        <CaretDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-popover border border-border rounded-xl shadow-lg p-2 animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-2 border-b border-border mb-2">
              <p className="text-sm font-medium text-foreground">{user.fullName}</p>
              <Badge variant={roleBadgeVariant} size="sm" className="mt-1">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={() => { sessionCleared(); navigate({ to: '/login' }); setOpen(false); }}
            >
              <SignOut size={16} />
              Выйти
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

Note: Add `import { useState } from 'react';` at the top.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/ui/
git commit -m "feat: add Checkbox, DropdownMenu, Pagination, ThemeToggle, UserPopover components"
```

---

### Task 8: Storybook Setup

**Files:**
- Create: `apps/web/.storybook/main.ts`
- Create: `apps/web/.storybook/preview.ts`
- Create: `apps/web/.storybook/preview-head.html`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install Storybook**

```bash
cd /Users/vadimkhalikov/Documents/Development/iridium
pnpm --filter @iridium/web add -D @storybook/react-vite @storybook/addon-essentials @storybook/addon-themes @storybook/blocks storybook
```

Add script to `apps/web/package.json`:
```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build"
```

- [ ] **Step 2: Create Storybook config**

```ts
// apps/web/.storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

```ts
// apps/web/.storybook/preview.ts
import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/index.css';

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        dark: '',
        light: 'light',
      },
      defaultTheme: 'dark',
    }),
  ],
};

export default preview;
```

- [ ] **Step 3: Verify Storybook starts**

```bash
pnpm --filter @iridium/web run storybook
```

Open http://localhost:6006 — should show empty Storybook with theme switcher in toolbar.

- [ ] **Step 4: Commit**

```bash
git add apps/web/.storybook/ apps/web/package.json pnpm-lock.yaml
git commit -m "feat: setup Storybook with dark/light theme switching"
```

---

### Task 9: Stories for All Components

**Files:**
- Create: `apps/web/src/shared/ui/__stories__/button.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/input.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/badge.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/card.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/select.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/dialog.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/tabs.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/checkbox.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/dropdown-menu.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/pagination.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/theme-toggle.stories.tsx`
- Create: `apps/web/src/shared/ui/__stories__/user-popover.stories.tsx`

- [ ] **Step 1: Button stories**

```tsx
// apps/web/src/shared/ui/__stories__/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { Plus, Trash, ArrowRight } from '@phosphor-icons/react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon', 'icon-sm'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: 'Создать рейс', variant: 'primary' } };
export const Secondary: Story = { args: { children: 'Отмена', variant: 'secondary' } };
export const Outline: Story = { args: { children: 'Подробнее', variant: 'outline' } };
export const Ghost: Story = { args: { children: 'Назад', variant: 'ghost' } };
export const Danger: Story = { args: { children: 'Удалить', variant: 'danger' } };
export const WithIcon: Story = { args: { children: <><Plus size={18} /> Добавить</>, variant: 'primary' } };
export const IconOnly: Story = { args: { children: <Trash size={18} />, variant: 'danger', size: 'icon' } };
export const Small: Story = { args: { children: 'Маленькая', size: 'sm' } };
export const Large: Story = { args: { children: 'Большая', size: 'lg' } };
export const Disabled: Story = { args: { children: 'Недоступна', disabled: true } };
```

- [ ] **Step 2: Create stories for remaining components**

Each story file follows the same pattern: Meta with title `UI/{Component}`, argTypes for variant/size controls, multiple exports for each variant. Include:
- Input: Default, Search, Sizes, Disabled
- Badge: Success, Warning, Danger, Info, Neutral
- Card: Default, Stats, Dark
- Select: Default, Filter, With items
- Dialog: Default, Confirm
- Tabs: Default, Pill
- Checkbox: Unchecked, Checked, Disabled
- DropdownMenu: With items
- Pagination: Few pages, Many pages
- ThemeToggle: Expanded, Collapsed
- UserPopover: Admin, Logist

For components that need context (UserPopover needs Effector), wrap in decorator.

- [ ] **Step 3: Verify all stories render in Storybook**

```bash
pnpm --filter @iridium/web run storybook
```

Check each story in both dark and light themes.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/shared/ui/__stories__/
git commit -m "feat: add Storybook stories for all UI components"
```

---

### Task 10: Fix All Pages (Remove Inline Styles, Use Variants)

**Files:**
- All files in `apps/web/src/pages/`
- All files in `apps/web/src/widgets/`
- All files in `apps/web/src/features/`

- [ ] **Step 1: Global search and replace**

Find all inline button styles and replace with variants:
- `className="bg-primary-500 hover:bg-primary-600 text-white"` → remove (default variant is primary)
- `className="bg-primary-500 hover:bg-primary-600 text-white cursor-pointer"` → remove
- `variant="destructive"` → `variant="danger"`
- `variant="default"` → remove

Find all inline badge styles (like `className="bg-green-100 text-green-800"`) and replace with Badge variants.

Find all `bg-white` and `bg-secondary-50` background references — replace with `bg-card` and `bg-background`.

Find all hardcoded colors like `text-secondary-900`, `text-secondary-400`, `border-secondary-100` and replace with semantic tokens:
- `text-secondary-900` → `text-foreground`
- `text-secondary-400` or `text-secondary-500` → `text-muted-foreground`
- `border-secondary-100` or `border-secondary-200` → `border-border`
- `bg-secondary-50` → `bg-background` or `bg-muted`

- [ ] **Step 2: Update TripStatusBadge to use Badge variants**

```tsx
// apps/web/src/entities/trip/ui.tsx
import { Badge } from '@/shared/ui/badge';
import { getTripStatusLabel } from './lib';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  ASSIGNED: 'neutral',
  EN_ROUTE_TO_LOADING: 'info',
  LOADING: 'warning',
  EN_ROUTE_TO_UNLOADING: 'info',
  UNLOADING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export function TripStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? 'neutral'}>
      {getTripStatusLabel(status)}
    </Badge>
  );
}
```

- [ ] **Step 3: Update RoleBadge**

```tsx
// apps/web/src/entities/session/ui.tsx
import { Badge } from '@/shared/ui/badge';
import { ROLE_LABELS } from '@/shared/config/constants';

const ROLE_VARIANT: Record<string, 'danger' | 'info' | 'neutral'> = {
  ADMIN: 'danger',
  LOGIST: 'info',
  DRIVER: 'neutral',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={ROLE_VARIANT[role] ?? 'neutral'}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}
```

- [ ] **Step 4: Remove old color constants**

In `apps/web/src/shared/config/constants.ts`, remove `TRIP_STATUS_COLORS` (no longer needed — Badge variants handle it).

- [ ] **Step 5: Verify build and visual check**

```bash
pnpm --filter @iridium/web run build
```

Start dev server, check login page, dashboard, trips page — all should use dark theme colors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat: replace all inline styles with component variants, semantic tokens"
```

---

### Task 11: Update Login/Register Pages for Dark Theme

**Files:**
- Modify: `apps/web/src/features/auth/login-form.tsx`
- Modify: `apps/web/src/features/auth/register-form.tsx`
- Modify: `apps/web/src/pages/auth/login.tsx`
- Modify: `apps/web/src/pages/auth/register.tsx`

- [ ] **Step 1: Update auth pages background**

Login/register pages should use `bg-background` (dark). The card uses `bg-card`. Remove the gradient background:

```tsx
// apps/web/src/pages/auth/login.tsx
<div className="flex items-center justify-center min-h-screen bg-background">
  <div className="space-y-4">
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold text-primary">Iridium</h1>
      <p className="text-muted-foreground text-sm mt-1">Система управления перевозками</p>
    </div>
    <LoginForm />
    <p className="text-center text-sm text-muted-foreground">
      Нет аккаунта? <Link to="/register" className="text-primary hover:underline">Регистрация</Link>
    </p>
  </div>
</div>
```

- [ ] **Step 2: Update form cards**

Replace `className="w-[520px] border-0 bg-white shadow-xl rounded-2xl"` with `className="w-[480px] bg-card border border-border rounded-2xl"`.

Replace all `text-danger` error messages with `text-destructive`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/auth/ apps/web/src/pages/auth/
git commit -m "feat: restyle login/register for dark theme"
```
