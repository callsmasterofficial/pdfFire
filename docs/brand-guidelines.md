# PDFfire — Brand Identity & Style Guidelines

> **Brand Name:** PDFfire  
> **Brand Tagline:** PDF tools that just work.  
> **Brand Personality:** Modern, bold, trustworthy, fast, privacy-focused, professional.  
> **Core Theme:** Ember orange, charcoal black, warm off-white, and neutral gray.

---

## 1. Brand Identity & Name

- **Official Name:** **PDFfire** (camel-cased with bold `PDF` and ember `fire` in wordmarks).
- **Tagline:** *"PDF tools that just work."*
- **Positioning:** High-performance, client-side in-browser PDF manipulation. 100% private, zero uploads, zero backend tracking.

---

## 2. Color Palette & Design Tokens

Adapt semantic tokens via CSS variables. Never scatter arbitrary hardcoded hex codes across components.

| Token | Hex Value | Semantic Role |
| :--- | :--- | :--- |
| **`--brand-primary`** | `#FF7047` | Primary actions, CTA buttons, active highlights, brand mark |
| **`--brand-primary-hover`** | `#E65332` | Hover and active button states |
| **`--brand-accent`** | `#E66A3C` | Secondary brand emphasis and icon accents |
| **`--brand-bg` (Light)** | `#FAF7F2` | Warm off-white primary light background |
| **`--brand-bg` (Dark)** | `#171614` | Deep charcoal primary dark background |
| **`--brand-surface` (Light)**| `#FFFFFF` | Light cards, modals, and input fields |
| **`--brand-surface` (Dark)** | `#201E1B` | Dark cards, panels, and tool containers |
| **`--brand-surface-elevated`**| `#292622` | Elevated dark popovers and floating menus |
| **Primary Text (Light)** | `#26231F` | High-contrast dark charcoal text on light surfaces |
| **Primary Text (Dark)** | `#F5F0E8` | High-contrast warm off-white text on dark surfaces |
| **Muted Text (Light)** | `#77716A` | Secondary descriptions and metadata in light theme |
| **Muted Text (Dark)** | `#B0A79C` | Secondary descriptions and metadata in dark theme |
| **Border (Light)** | `#E6DED4` | Clean structural dividers in light theme |
| **Border (Dark)** | `#39342F` | Subtle borders and container edges in dark theme |
| **Success** | `#467A50` | Offline indicator, successful downloads, checkmarks |
| **Error / Destructive** | `#C44242` | Form errors, corrupted document warnings, delete actions |

---

## 3. Logo Assets & Usage

All official brand assets reside in `/public/brand/`, `/public/icons/`, and root `/public/`:

```text
public/
  icon.svg                     # Standard app icon & PWA icon
  brand/
    pdffire-mark-light.svg     # Standalone mark for light theme (navbar, footer, favicon)
    pdffire-mark-dark.svg      # Standalone mark for dark theme (favicon)
  icons/
    favicon.ico                # Multi-resolution ICO (16x16 + 32x32 embedded)
    favicon.svg                # Dynamic theme-adaptive browser tab icon
    favicon-16x16.png          # 16x16 pixel favicon
    favicon-32x32.png          # 32x32 pixel favicon
    apple-touch-icon.png       # 180x180 iOS Home Screen touch icon
    icon-192.png               # 192x192 standard PWA app icon
    icon-512.png               # 512x512 high-resolution app icon
    icon-maskable-512.png      # 512x512 PWA maskable icon (safe area padded)
```
### When to Use Each Variant:
- **`pdffire-mark-light.svg`:** Application navigation header and footer in light mode, light-mode browser tab favicon.
- **`icon.svg` / `pdffire-mark-dark.svg`:** Navigation header and footer in dark mode, dark-mode browser tab favicon, and installable PWA app icon.
- **`icons/icon-maskable-512.png`:** PWA installable maskable icon with safe area padding.
- **`icons/favicon.ico` / PNGs:** Browser tab fallbacks across desktop and mobile devices.

---

## 4. Typography Guidelines

- **Primary Font:** System-native sans-serif stack with Geist/Inter:
  `font-family: var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Font:** Geist Mono / JetBrains Mono for hashes, byte counts, and diagnostics:
  `font-family: var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace`
- **Hierarchy:**
  - H1: `text-4xl` to `text-6xl`, font-weight 800, tracking tight (`tracking-tight`)
  - H2: `text-2xl` to `text-3xl`, font-weight 700
  - Body: `text-sm` to `text-base`, font-weight 400–500, leading relaxed
  - Captions/Badges: `text-xs`, font-weight 600

---

## 5. Icon Sizing & Safe Areas

- **Minimum Size:** The standalone document-flame symbol retains geometric legibility down to `16×16 px`.
- **Navbar Lockup:** Symbol displayed at `32×32 px` (`size-8`) alongside `text-xl` font wordmark.
- **Footer Lockup:** Symbol displayed at `20×20 px` (`size-5`) alongside `font-bold` brand text.
- **Maskable Icon Safe Area:** For PWA icons, the central document symbol is scaled within the 70% inner circle (minimum 15% outer margin) to avoid clipping under dynamic OS icon masks.

---

## 6. Visual Consistency Rules

1. **Strategic Orange:** Use `#FF7047` purposefully for interactive elements, highlights, and primary actions. Do not paint every background or card orange.
2. **Accessible Contrast:** Always ensure text meets WCAG AA 4.5:1 contrast standards against its respective background.
3. **No Unofficial Assets:** Never use arbitrary emoji or generic icon library flame shapes as the brand mark. Always reference the official SVG assets in `/public/brand/` or `/public/icons/`.
4. **Honest Claims:** Feature copy must accurately reflect the client-side, in-browser capabilities without misleading cloud or server claims.
