---
title: Tighten Letter-Spacing on Large Headings
impact: LOW
impactDescription: Polishes display type
tags: typography, letter-spacing, headings
---

## Tighten Letter-Spacing on Large Headings

**Impact: LOW (aesthetic refinement for text typefaces)**

Many UI sans serifs were designed for small body text with wide tracking. Large headings often look better with slightly **negative** letter-spacing. Display typefaces may not need adjustment.

**Incorrect:**

32px heading with default loose tracking—letters feel disconnected.

**Correct:**

```css
h1 { letter-spacing: -0.02em; } /* tune per typeface/size */
```

Reference: [14 UI design tips](https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14)
