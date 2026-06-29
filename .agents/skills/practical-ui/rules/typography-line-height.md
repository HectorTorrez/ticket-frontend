---
title: Use Line Height ≥ 1.5 for Body Text
impact: HIGH
impactDescription: Prevents re-reading the same line
tags: typography, line-height, readability
---

## Use Line Height ≥ 1.5 for Body Text

**Impact: HIGH (vertical rhythm aids reading)**

Set body `line-height` to at least **1.5** (150%). Comfortable range: **1.5–2** for long text. Headings can use tighter leading (1.2–1.3).

**Incorrect:**

`line-height: 1` (100%) on multi-line descriptions—lines collide visually.

**Correct:**

```css
p { line-height: 1.5; } /* or 1.6 for long articles */
h1 { line-height: 1.2; }
```

Reference: [16 UI design tips](https://www.adhamdannaway.com/blog/ui-design/ui-design-tips)
