---
name: practical-ui
description: Logic-driven UI design guidelines from Practical UI by Adham Dannaway. Use when designing, building, or reviewing interfaces for usability, accessibility, spacing, typography, colour, forms, buttons, and copywriting. Triggers on UI implementation, design system work, form design, button styling, or accessibility audits.
metadata:
  author: adham-dannaway
  version: "1.0.0"
  source: https://www.practical-ui.com/
---

# Practical UI

Logic-driven interface design guidelines from [Practical UI](https://www.practical-ui.com/) by Adham Dannaway. Use objective rules—not gut feeling—to design intuitive, accessible interfaces.

## When to Apply

Reference these guidelines when:
- Building or reviewing UI components (buttons, forms, cards, navigation)
- Choosing spacing, typography, or colour in CSS/Tailwind/design tokens
- Writing interface copy (headings, labels, errors, empty states)
- Auditing accessibility (contrast, touch targets, colour-blind indicators)
- Simplifying cluttered interfaces or fixing unclear hierarchy

## Philosophy

1. Every design detail should have a **logical purpose**, not just aesthetic preference.
2. **Good accessibility means good usability**—design for everyone.
3. **Minimize cognitive load** and interaction cost: fewer choices, clearer grouping, familiar patterns.
4. Start with **black, white, and grey**; add colour only where it conveys meaning (usually interactivity).
5. Use a **design system** of predefined spacing, type, and component styles for faster, consistent decisions.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Fundamentals | CRITICAL | `fundamentals-` |
| 2 | Less Is More | HIGH | `simplicity-` |
| 3 | Colour | HIGH | `color-` |
| 4 | Layout and Spacing | HIGH | `layout-` |
| 5 | Typography | HIGH | `typography-` |
| 6 | Copywriting | MEDIUM-HIGH | `copy-` |
| 7 | Forms | MEDIUM-HIGH | `forms-` |
| 8 | Buttons | MEDIUM-HIGH | `buttons-` |

## Quick Reference

### Fundamentals (CRITICAL)

- `fundamentals-logic-over-opinion` - Base decisions on rationale, not taste
- `fundamentals-consistency` - Similar elements look and work similarly
- `fundamentals-similar-look-similar-function` - Don't style static content like buttons
- `fundamentals-visual-hierarchy` - Present information in order of importance
- `fundamentals-squint-test` - Blur/squint to verify hierarchy
- `fundamentals-common-patterns` - Prefer familiar conventions users already know
- `fundamentals-group-related-elements` - Use proximity, similarity, alignment, containers

### Less Is More (HIGH)

- `simplicity-remove-unnecessary-styles` - Cut decorative borders, backgrounds, lines
- `simplicity-avoid-containers` - Prefer spacing over boxes when grouping is clear
- `simplicity-minimal-vs-simple` - Minimal ≠ simple; don't hide critical actions
- `simplicity-visible-important-content` - Don't bury key actions in overflow menus

### Colour (HIGH)

- `color-purposeful` - Use colour sparingly; avoid decorative colour
- `color-brand-on-interactive` - Reserve brand colour for links and buttons
- `color-no-color-alone` - Add underline, icon shape, or fill for non-colour cues
- `color-text-contrast-45` - Small text ≥ 4.5:1 contrast (WCAG AA)
- `color-ui-contrast-3` - Buttons, inputs, icons ≥ 3:1 shape contrast
- `color-avoid-disabled-looking-grey` - Light grey buttons look inactive

### Layout and Spacing (HIGH)

- `layout-proximity-spacing` - Closer spacing = more related; increase outward
- `layout-spacing-scale` - T-shirt sizes on 8pt grid (4pt for dense UIs)
- `layout-single-alignment` - Prefer one alignment; mixed alignment adds noise
- `layout-8pt-grid` - Align elements to 8pt (or 4pt) increments

### Typography (HIGH)

- `typography-single-sans` - One sans-serif typeface for UI
- `typography-x-height` - Prefer typefaces with taller lowercase (x-height)
- `typography-two-weights` - Regular and bold only (semi-bold optional)
- `typography-no-pure-black` - Dark grey text reduces eye strain on white
- `typography-line-length` - Body text 40–80 characters per line
- `typography-line-height` - Body line-height ≥ 1.5 (150%)
- `typography-left-align` - Left-align long body text (English/LTR)
- `typography-limit-uppercase` - Avoid uppercase except short labels
- `typography-large-text-tracking` - Tighten letter-spacing on large headings

### Copywriting (MEDIUM-HIGH)

- `copy-descriptive-headings` - Headings that summarize the section
- `copy-headings-out-of-context` - Headings must make sense when scanned alone
- `copy-break-into-bullets` - Split dense text with headings and lists

### Forms (MEDIUM-HIGH)

- `forms-labels-above-fields` - Always show persistent labels above inputs
- `forms-avoid-placeholder-as-label` - Placeholders disappear and fail accessibility
- `forms-hints-above-field` - Put helper text above the field, not below

### Buttons (MEDIUM-HIGH)

- `buttons-three-weights` - Primary, secondary, tertiary styles
- `buttons-single-primary` - One primary button per view when possible
- `buttons-48pt-target` - Minimum 48×48pt touch target
- `buttons-spacing-between` - ≥ 8pt between buttons (16pt safer)
- `buttons-shape-contrast` - Button boundary ≥ 3:1 against background
- `buttons-hierarchy-not-color-alone` - Filled vs outline vs text, not colour only
- `buttons-consistent-shapes` - Same shape for same function
- `buttons-semantic-html` - `<button>` for actions, `<a>` for navigation

## How to Review UI

1. Read [AGENTS.md](./AGENTS.md) or the relevant rule file(s) for the task.
2. Identify usability risks: low contrast, unclear hierarchy, colour-only indicators, missing labels.
3. Apply the **Squint Test**: blur or step back—is the primary action obvious?
4. Fix issues in priority order: accessibility contrast → hierarchy → spacing → polish.
5. Output findings as `component/area: issue → recommended fix` with the rule ID.

## Full Compiled Document

For the complete guide with incorrect/correct examples, see [AGENTS.md](./AGENTS.md).

Individual rule files live in [rules/](./rules/) for targeted lookup.

## Attribution

Guidelines synthesized from public Practical UI materials by Adham Dannaway, including [practical-ui.com](https://www.practical-ui.com/) and published UI design articles. Purchase the book for the full 100+ guidelines with visual examples.
