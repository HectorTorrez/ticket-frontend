---
title: Use a Spacing Scale
impact: HIGH
impactDescription: Faster decisions, consistent rhythm
tags: layout, spacing, design-tokens
---

## Use a Spacing Scale

**Impact: HIGH (avoids arbitrary pixel nudging)**

Define t-shirt-sized spacing tokens on an **8pt grid** (use **4pt** increments for dense interfaces). Larger steps should grow proportionally—like a type scale.

**Example scale (8pt base):**

| Token | Value |
|-------|-------|
| xs | 8px |
| sm | 16px |
| md | 24px |
| lg | 32px |
| xl | 48px |
| 2xl | 64px |

**Incorrect:**

Ad-hoc values: 13px, 19px, 27px scattered through the UI.

**Correct:**

Pick from tokens only. Map Tailwind/CSS variables to the scale. Align to 8px grid for layout grids.

Reference: [14 UI design tips](https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14)
