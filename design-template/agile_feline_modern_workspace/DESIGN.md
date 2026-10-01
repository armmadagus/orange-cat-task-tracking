---
name: Agile Feline Modern Workspace
colors:
  surface: '#f9f9ff'
  surface-dim: '#cadbfc'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dfe8ff'
  surface-container-highest: '#d6e3ff'
  on-surface: '#0a1c34'
  on-surface-variant: '#424655'
  inverse-surface: '#21314a'
  inverse-on-surface: '#ecf0ff'
  outline: '#737687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d7'
  primary: '#004dc5'
  on-primary: '#ffffff'
  primary-container: '#0b63f6'
  on-primary-container: '#f0f1ff'
  inverse-primary: '#b3c5ff'
  secondary: '#8e4e00'
  on-secondary: '#ffffff'
  secondary-container: '#fe9317'
  on-secondary-container: '#643600'
  tertiary: '#005d7a'
  on-tertiary: '#ffffff'
  tertiary-container: '#00779c'
  on-tertiary-container: '#e4f4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa5'
  secondary-fixed: '#ffdcc1'
  secondary-fixed-dim: '#ffb778'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#6c3a00'
  tertiary-fixed: '#c0e8ff'
  tertiary-fixed-dim: '#6fd2ff'
  on-tertiary-fixed: '#001e2b'
  on-tertiary-fixed-variant: '#004d66'
  background: '#f9f9ff'
  on-background: '#0a1c34'
  surface-variant: '#d6e3ff'
  blue-800: '#073AB5'
  surface-bg: '#F6F8FC'
  surface-card: '#FFFFFF'
  border-subtle: '#D8E2F0'
  status-todo: '#64748B'
  status-progress: '#0B63F6'
  status-done: '#10B981'
  status-overdue: '#EF4444'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The brand personality merges modern project utility with an approachable, warm identity. Built for high-throughput product and engineering teams, the interface removes administrative friction through visual clarity, structured modularity, and high-contrast typography. The emotional response evokes confidence, agility, and order without the clinical sterility typical of legacy enterprise trackers.

The design movement is **Modern Functionalism with Tactile Accents**:
- Crisp, content-centric panels framed by crisp, low-saturation dividers.
- High-contrast typography optimized for multi-script parity (Thai and Latin).
- Purposeful chromatic punctuation where functional brand blues carry the systematic operational load, while vibrant feline orange delivers high-impact highlights and decisive primary calls-to-action.
- Accessible information architecture adhering strictly to WCAG 2.2 AA standards, ensuring status communication is never conveyed by color alone.

## Colors

The palette balances authoritative structure with vibrant, intentional focus:

- **Primary (`#0B63F6` - Blue 600)**: Serves as the core workhorse for interactive anchors, active tabs, progress indicators, selected states, and navigational highlights.
- **Secondary (`#FF9418` - Orange 500)**: Reserved strictly for conversion levers, creation triggers (e.g., "Create Task", "Launch Sprint"), and priority attention badges. Due to contrast constraints against white surfaces (contrast ratio ~2.21:1), Orange 500 must **never** be used for light text on white or light backgrounds. When Orange 500 is applied as a background fill, foreground text and icons must use `#10213A` (Ink) to guarantee WCAG 2.2 AA compliance.
- **Tertiary (`#22BDF3` - Blue 400)**: Used for informational accents, secondary category tags, sub-metrics, and hover states of primary elements.
- **Neutral (`#10213A` - Ink)**: Provides solid contrast for body and heading typography across clean surfaces.
- **Canvas & Structure**: Surfaces transition seamlessly between `#F6F8FC` (App Canvas / Layout Backdrops) and `#FFFFFF` (Card Containers, Tables, Sheet Drawers), outlined by `#D8E2F0` to maintain clean spatial separation without heavy visual weight.
- **Status Semantics**:
  - `status-todo` (`#64748B`): Slate/Blue gray for queued items.
  - `status-progress` (`#0B63F6`): Blue 600 representing active velocity.
  - `status-done` (`#10B981`): Emerald green confirming resolution.
  - `status-overdue` (`#EF4444`): Unmistakable alert crimson, paired with an alert icon to avoid color-only reliance.

## Typography

The typography leverages a robust system font stack anchored by **Inter** for Latin metrics, falling back gracefully to **Noto Sans Thai** and **Sukhumvit Set** for localized Thai rendering. This provides unified x-height, distinct numeral clarity for timeline schedules, and legible Thai vowel marks.

- **Headlines & Display**: Strong, grounded weights (600 and 700) anchor workspace and dashboard views. Tightened letter spacing prevents header sprawl in information-dense views.
- **Body & Data Grid**: Standard 14px body text (`body-md`) powers task rows, descriptions, and comments, striking an optimal balance between density and comfort.
- **Labels & Micro-indicators**: Set between 11px and 13px with medium-to-semibold weights to ensure metadata (tags, progress counts like `2/4`, short dates) remains legible against Kanban card containers.

## Layout & Spacing

The layout is built on a 4px/8px incremental rhythm configured for rapid scanning and multi-view task workflows.

### Grid & View Mechanics
- **Desktop (≥ 1024px)**: Uses a persistent 260px collapsible sidebar coupled with an open-flow fluid grid layout (`gutter-desktop: 1.5rem`). Kanban boards horizontally extend with equal column widths (280px minimum), while Gantt and List layouts support split panes with sticky identifier columns.
- **Tablet (768px – 1023px)**: Sidebar shifts to an icon rail or collapsible overlay. Main canvas margins scale to `1.5rem`. Data grids and timelines enable horizontal swiping with fixed left reference headers.
- **Mobile (< 768px)**: Standard margins contract to `1rem`. The navigation collapses into a full-height bottom sheet/drawer. Kanban boards abandon multi-column horizontal sprawl in favor of segmented status tabs (`To Do` | `In Progress` | `Done`), isolating single columns for rapid vertical triage.

### Spatial Rhythm Tokens
- `space-xxs` (4px): Inner badge padding, icon-to-text inline spacing, and progress indicator gaps.
- `space-xs` (8px): Form input padding, small list item spacing, and compact chip insets.
- `space-sm` (12px): Standard Kanban card vertical padding, toolbar gaps.
- `space-md` (16px): Content card padding, table row heights, drawer section separators.
- `space-lg` (24px): Structural component margins and sheet boundaries.
- `space-xl` (32px) and `space-2xl` (48px): Page section delimiters and dashboard metric grouping.

## Elevation & Depth

Visual hierarchy uses crisp, structured tonal layering augmented by soft, low-contrast shadows rather than heavy skeuomorphic shading.

- **Level 0 (Base Canvas)**: Background `#F6F8FC`. Completely flat with zero elevation.
- **Level 1 (Card & Board Surfaces)**: Background `#FFFFFF`, border `1px solid #D8E2F0`, shadow `0 1px 3px rgba(16, 33, 58, 0.04), 0 1px 2px rgba(16, 33, 58, 0.02)`. Applied to Kanban task cards, list tables, and dashboard modules.
- **Level 2 (Hover & Drag States)**: Shadow `0 10px 15px -3px rgba(16, 33, 58, 0.08), 0 4px 6px -2px rgba(16, 33, 58, 0.04)`, border color `#0B63F6` at 40% opacity. Provides tangible elevation when cards are actively dragged via `dnd-kit`.
- **Level 3 (Dropdowns & Popovers)**: Background `#FFFFFF`, border `1px solid #D8E2F0`, shadow `0 12px 24px -4px rgba(16, 33, 58, 0.12)`.
- **Level 4 (Task Detail Drawers & Modals)**: Elevated slide-out sheets anchored at the right viewport edge. Shadow `-6px 0 24px rgba(16, 33, 58, 0.12)`. Backdrops use a neutral translucent overlay (`rgba(16, 33, 58, 0.4)`) with a `backdrop-blur(4px)` treatment.

## Shapes

The design system applies a disciplined, geometric shape scale that feels friendly yet structurally solid:

- **Base Radius (`8px` - `rounded-md`)**: Applied to all foundational interactive elements—buttons, text inputs, status badges, dropdown options, and subtask rows.
- **Container Radius (`12px` - `rounded-lg`)**: Applied to Kanban cards, floating toolbars, modal windows, and dashboard summary widgets.
- **Structural Radius (`20px` - `rounded-xl`)**: Applied to large panel groupings, context drawer top corners on mobile, and segmented view-switcher pill containers.
- **Full Radius (`9999px` - `rounded-full`)**: Strictly reserved for user avatars, unread count indicators, and standalone icon roundels.

## Components

### Buttons
- **Primary CTA**: Background `#FF9418` (Orange 500), text `#10213A` (Ink, SemiBold), border radius `8px`. Hover background scales to `#E88310`. Active state scales down to `0.98`. Focus ring: 2px offset with `#0B63F6`.
- **Standard Primary**: Background `#0B63F6` (Blue 600), text `#FFFFFF`, border radius `8px`. Hover background `#073AB5`.
- **Secondary / Ghost**: Background `#FFFFFF`, border `1px solid #D8E2F0`, text `#10213A`. Hover background `#F6F8FC` with border `#0B63F6`.
- **Icon Buttons**: Minimum 36x36px hit target with centered iconography. Explicit `aria-label` required for screen reader accessibility.

### Cards & Kanban Tiles
- **Container**: White `#FFFFFF` fill, `1px solid #D8E2F0` border, `12px` radius. Padding: `12px 14px`.
- **Content Hierarchy**: Priority status badge on top right, project tag top left, followed by the Task Title in `body-md` (Semibold, `#10213A`). Footer displays subtask completion ratio (`2/4`), due date indicator, and assignee avatar.
- **Overdue Visuals**: Overdue cards gain a `1.5px` border in `#EF4444`, a soft tinted date badge (`#FEE2E2` fill, `#B91C1C` text), and an alert warning icon.

### Chips & Badges
- **Status Chips**: Height `24px`, radius `6px`, padding `0 8px`, typography `label-sm`.
  - *To Do*: `#F1F5F9` background, `#475569` text.
  - *In Progress*: `#EFF6FF` background, `#0B63F6` text.
  - *Done*: `#ECFDF5` background, `#059669` text.
- **Filter Chips**: Pill shape, border `1px solid #D8E2F0`, background `#FFFFFF`. Selected state transitions to `#0B63F6` background with `#FFFFFF` text.

### Form Inputs & Inline Fields
- **Text Inputs**: Height `40px`, radius `8px`, border `1px solid #D8E2F0`, background `#FFFFFF`, text `#10213A`. Placeholder text `#94A3B8`. Active focus triggers a 1.5px `#0B63F6` border with a subtle `0 0 0 3px rgba(11, 99, 246, 0.12)` halo.
- **Inline Editable Headings**: Borderless by default with hover affordance (subtle `#F6F8FC` background and ghost outline). Editing state renders a continuous `#0B63F6` baseline outline with immediate auto-save feedback.

### Checkboxes & Selection
- **Checkboxes**: 18x18px box, radius `4px`, border `1.5px solid #D8E2F0`. Checked state renders `#0B63F6` fill with an accessible white checkmark. Completed subtasks apply an automatic strike-through and mute text color to `#94A3B8`.

### Task Detail Drawer
- Contextual right-aligned panel (`540px` wide on desktop, `100vw` on mobile). Fixed header with rapid status change dropdown, task priority selector, and close trigger. Body section features a high-fidelity rich-text description area and a hierarchical subtask breakdown list with drag re-ordering.