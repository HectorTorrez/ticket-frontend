---
title: Consistent Button Shapes
impact: MEDIUM
impactDescription: Same function, same appearance
tags: buttons, consistency
---

## Consistent Button Shapes

**Impact: MEDIUM (mixed shapes imply different behavior)**

Buttons with the same function should share shape (radius, height, padding). Don't mix pill primary with square secondary without reason.

**Incorrect:**

Primary: pill radius 9999px. Secondary: 4px radius square. Users wonder if they behave differently.

**Correct:**

Shared border-radius token, height token, and padding scale across all button weights.

Reference: [Button design tips](https://www.adhamdannaway.com/blog/ui-design/button-design-tips)
