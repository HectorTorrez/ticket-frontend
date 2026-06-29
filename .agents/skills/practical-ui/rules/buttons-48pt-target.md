---
title: Minimum 48×48pt Touch Target
impact: HIGH
impactDescription: Motor accessibility and mobile thumbs
tags: buttons, touch-target, accessibility
---

## Minimum 48×48pt Touch Target

**Impact: HIGH (exceeds WCAG 44px minimum; fits 8pt grid)**

Interactive targets should be at least **48×48pt** (48×48px at 1×). Frequently used actions can be larger. Hit area can extend via padding beyond visible label.

**Incorrect:**

32×32px icon-only buttons. Text links with no vertical padding.

**Correct:**

```css
.btn { min-height: 48px; min-width: 48px; padding-inline: 16px; }
```

Reference: [14 UI design tips](https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14)
