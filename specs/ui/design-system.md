# Design System

Commit Gear visual language — premium tech culture, dark-mode first.

## Design Philosophy

- **Dark-mode first:** Deep monochromatic grays, not generic purple gradients
- **Terminal heritage:** Mono accents for badges and status flags
- **Restraint:** Hairline borders, subtle motion, no neon glows or heavy drop shadows
- **Scannable commerce:** Product imagery leads; typography supports, never competes

## Color Palette

| Token | Tailwind | Hex | Usage |
|-------|----------|-----|-------|
| `bg-primary` | `zinc-950` | `#09090b` | Page background |
| `bg-surface` | `zinc-900` | `#18181b` | Cards, drawers, modals |
| `bg-elevated` | `zinc-800` | `#27272a` | Hover states, inputs |
| `border-default` | `zinc-800` | `#27272a` | Hairline borders (`border-[1px]`) |
| `border-subtle` | `zinc-700` | `#3f3f46` | Focus rings, dividers |
| `text-primary` | `zinc-100` | `#f4f4f5` | Headings, body |
| `text-secondary` | `zinc-400` | `#a1a1aa` | Captions, metadata |
| `text-muted` | `zinc-500` | `#71717a` | Placeholders, disabled |
| `accent-success` | `emerald-500` | `#10b981` | In-stock badges, success states only |
| `accent-error` | `red-500` | `#ef4444` | Errors, out-of-stock |
| `accent-warning` | `amber-500` | `#f59e0b` | Low stock warnings |

**Rule:** `emerald-500` is reserved for terminal-style success semantics. Never use as primary CTA color.

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | Inter | 600 | `text-4xl` / `text-5xl` |
| Heading | Inter | 600 | `text-xl` / `text-2xl` |
| Body | Inter | 400 | `text-sm` / `text-base` |
| Mono / Badge | JetBrains Mono | 400 | `text-xs` / `text-sm` |
| Price | Inter | 600 | `text-lg` (tabular-nums) |

```css
/* tailwind.config.js fontFamily */
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
}
```

## Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| `page-padding` | `px-6 md:px-12 lg:px-24` | Horizontal page margins |
| `section-gap` | `gap-8 md:gap-12` | Between page sections |
| `card-padding` | `p-4 md:p-6` | Inside product cards |
| `grid-cols-shop` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` | Product grid |

## Borders & Radius

```html
<!-- Standard card frame -->
<div class="border border-zinc-800 rounded-sm bg-zinc-900">

<!-- Product card hover -->
<div class="border border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
```

| Element | Radius |
|---------|--------|
| Cards | `rounded-sm` (2px) |
| Buttons | `rounded-sm` |
| Inputs | `rounded-sm` |
| Images | `rounded-sm` |
| Badges | `rounded-none` (terminal aesthetic) |

## Motion

| Interaction | Property | Duration | Easing |
|-------------|----------|----------|--------|
| Card hover | `border-color`, `opacity` | 200ms | `ease-out` |
| Button hover | `background-color` | 150ms | `ease-out` |
| Drawer slide | `transform` | 250ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Image load | `opacity` | 300ms | `ease-in` |
| Skeleton pulse | `opacity` | 1.5s | `ease-in-out` infinite |

**Prohibited:** bounce animations, neon glows, `scale-110` on hover, parallax scrolling.

## Terminal Badges

Product status badges styled as git commit flags:

```html
<!-- In Stock -->
<span class="font-mono text-xs text-emerald-500 border border-emerald-500/30 px-2 py-0.5">
  git commit -m "In Stock"
</span>

<!-- Low Stock -->
<span class="font-mono text-xs text-amber-500 border border-amber-500/30 px-2 py-0.5">
  git commit -m "Low Stock"
</span>

<!-- Out of Stock -->
<span class="font-mono text-xs text-red-500 border border-red-500/30 px-2 py-0.5">
  git commit -m "Out of Stock"
</span>
```

## Buttons

| Variant | Classes |
|---------|---------|
| Primary | `bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium` |
| Secondary | `border border-zinc-700 text-zinc-100 hover:border-zinc-500` |
| Ghost | `text-zinc-400 hover:text-zinc-100` |
| Destructive | `border border-red-500/50 text-red-500 hover:bg-red-500/10` |

## Images

- Format: WebP preferred (Cloudinary auto-format)
- Aspect ratio: `aspect-square` for product cards, `aspect-[4/3]` for hero
- Loading: skeleton placeholder with `animate-pulse bg-zinc-800`
- Layout shift prevention: explicit `width`/`height` or aspect-ratio container

```html
<div class="aspect-square bg-zinc-800 overflow-hidden">
  <img
    src="..."
    alt="..."
    class="w-full h-full object-cover opacity-0 transition-opacity duration-300"
    onload="this.classList.remove('opacity-0')"
    loading="lazy"
  />
</div>
```

## Icons

Use Lucide React. Size: `w-4 h-4` inline, `w-5 h-5` in buttons. Color: `text-zinc-400`, hover `text-zinc-100`.

## Related

- [Components](components.md)
- [Routes](routes.md)
