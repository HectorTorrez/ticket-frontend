# Practical UI Guidelines

**Version 1.0.0**  
Based on [Practical UI](https://www.practical-ui.com/) by Adham Dannaway  
June 2026

> **Note:**  
> This document is for agents and LLMs implementing or reviewing user interfaces.  
> Guidelines are synthesized from publicly published Practical UI materials.  
> Purchase the book for the full 100+ guidelines with visual examples.

---

## Abstract

Logic-driven UI design guide containing 40+ rules across 8 categories, prioritized from foundational principles to component-specific patterns. Each rule includes rationale aligned with usability, accessibility (WCAG 2.1 AA), and cognitive load reduction. Use objective criteria—not subjective aesthetics—to make design decisions.

---

## Table of Contents

1. [Fundamentals](#1-fundamentals) — **CRITICAL**
2. [Less Is More](#2-less-is-more) — **HIGH**
3. [Colour](#3-colour) — **HIGH**
4. [Layout and Spacing](#4-layout-and-spacing) — **HIGH**
5. [Typography](#5-typography) — **HIGH**
6. [Copywriting](#6-copywriting) — **MEDIUM-HIGH**
7. [Forms](#7-forms) — **MEDIUM-HIGH**
8. [Buttons](#8-buttons) — **MEDIUM-HIGH**

---

## 1. Fundamentals

**Impact: CRITICAL**

### Core philosophy

- Every interface detail needs a **logical purpose**—not "it looks nice."
- **Minimize cognitive load** and interaction cost: fewer distractions, familiar patterns, clear grouping.
- **Good accessibility is good usability**—design for low vision, colour blindness, and motor limitations from the start.
- Build a **design system** of spacing tokens, type styles, and component variants to decide faster and stay consistent.

### Group related elements

Four grouping methods (strongest → subtle):

1. Same container
2. Proximity (spacing)
3. Similar appearance
4. Continuous alignment

Prefer spacing over containers when grouping is already clear.

### Visual hierarchy

Use size, weight, colour, contrast, spacing, position, and depth to show importance. The primary action should be the most prominent element. Validate with the **Squint Test** (blur or step back—is hierarchy obvious?).

### Consistency

Similar elements look and work similarly. Icons: pick one style (stroke weight, fill rules). Non-interactive elements must not look like buttons.

### Common patterns

Use familiar conventions (labels above fields, underlined links, standard nav). Deviate only with reason and extra clarity (labels, hints).

---

## 2. Less Is More

**Impact: HIGH**

- Remove borders, backgrounds, and lines that don't structure content.
- **Minimal ≠ simple**—don't hide labels or critical actions for aesthetics.
- Keep important actions **visible** when space allows; overflow menus reduce discoverability.
- Remove redundant containers when spacing/alignment already groups content.

---

## 3. Colour

**Impact: HIGH**

### Purposeful colour

Start greyscale. Add colour for meaning—usually **interactivity** (links, primary buttons) or **semantic status** (error, success).

### Contrast requirements (WCAG 2.1 AA)

| Element | Minimum ratio |
|---------|---------------|
| Small text (≤18px regular) | **4.5:1** |
| Large text (>18px bold or >24px regular) | **3:1** |
| UI components (buttons, inputs, icons) | **3:1** (shape) |
| Button label text | **4.5:1** |

### Don't rely on colour alone

Add underlines for links, underlines/fills for selected tabs, icons + text for errors. Colour-blind users must distinguish states without hue.

### Avoid disabled-looking buttons

Light grey fills on secondaries read as inactive. Use outline or text buttons instead.

---

## 4. Layout and Spacing

**Impact: HIGH**

### Law of proximity

Spacing reflects relationship: tight within groups, loose between groups. Nested rectangles: smallest gaps innermost.

### Spacing scale (8pt grid)

Define tokens—example:

| Token | px |
|-------|-----|
| xs | 8 |
| sm | 16 |
| md | 24 |
| lg | 32 |
| xl | 48 |
| 2xl | 64 |

Use 4pt increments for dense UIs. Never nudge one pixel at a time.

### Alignment

Prefer **one alignment** per section (usually left for LTR). Mixed alignments increase complexity.

### 8pt grid

Heights, padding, and gutters snap to 8px multiples (48px button height = 6×8).

---

## 5. Typography

**Impact: HIGH**

| Guideline | Recommendation |
|-----------|----------------|
| Typefaces | One **sans-serif** family |
| X-height | Prefer tall lowercase for small UI text |
| Weights | **Regular + bold** only (semi-bold optional) |
| Body colour | **Dark grey**, not pure `#000` |
| Line length | **40–80 characters** |
| Line height | **≥ 1.5** for body |
| Alignment | **Left** for long text |
| Uppercase | Avoid except very short labels |
| Large headings | Slightly **tighten** letter-spacing |

---

## 6. Copywriting

**Impact: MEDIUM-HIGH**

- **Descriptive headings** summarize sections—not vague "Details."
- Headings must make sense **out of context** (screen reader heading lists).
- Break dense text with **headings and bullets**.
- Write concisely; one job per label (label labels, hint hints).

---

## 7. Forms

**Impact: MEDIUM-HIGH**

### Labels

Always show persistent **labels above fields**. Never replace labels with placeholders.

### Placeholder problems

Disappears on focus, looks like filled value, low contrast. Exception: search fields with accessible name + 4.5:1 placeholder contrast.

### Hints

Place helper text **between label and field**—not below (hidden by keyboards/autofill).

---

## 8. Buttons

**Impact: MEDIUM-HIGH**

### Three weights

| Weight | Role | Style cue |
|--------|------|-----------|
| Primary | Most important action | Solid fill |
| Secondary | Alternatives | Outline |
| Tertiary | Low priority / de-emphasized destructive | Text |

### Rules

- **One primary** per view when possible
- **48×48pt** minimum target; **16pt** gap between adjacent buttons
- Shape **≥3:1** contrast; text **≥4.5:1**
- Hierarchy by fill/outline—not colour alone
- Consistent shapes across weights
- `<button>` for actions, `<a href>` for navigation regardless of appearance

### Common mistakes to avoid

- Primary + secondary differing only by hue
- Light grey secondary looking disabled
- Tertiary styled as plain text with no affordance
- Identical styles with <3:1 inter-button contrast

---

## Review Checklist

When auditing UI, check in this order:

1. **Contrast** — text 4.5:1, UI 3:1
2. **Colour independence** — links underlined, states not hue-only
3. **Hierarchy** — squint test; one primary button
4. **Grouping** — proximity spacing; redundant containers removed
5. **Forms** — visible labels; hints above fields
6. **Typography** — line height, measure, weights
7. **Consistency** — icons, radii, button shapes

Output issues as: `location: problem → fix (rule-id)`

---

## References

1. [Practical UI](https://www.practical-ui.com/)
2. [16 UI design tips](https://www.adhamdannaway.com/blog/ui-design/ui-design-tips)
3. [14 logic-driven UI tips](https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14)
4. [Button design tips](https://www.adhamdannaway.com/blog/ui-design/button-design-tips)
5. [WCAG 2.1 Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
