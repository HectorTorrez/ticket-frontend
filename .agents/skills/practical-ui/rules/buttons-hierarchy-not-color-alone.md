---
title: Button Hierarchy Without Colour Alone
impact: CRITICAL
impactDescription: Colour-blind safe action ranking
tags: buttons, hierarchy, accessibility
---

## Button Hierarchy Without Colour Alone

**Impact: CRITICAL (primary vs secondary must differ by more than hue)**

Users with colour vision deficiency must distinguish button types. Combine fill level, border weight, and size—not hue alone.

**Incorrect:**

Primary blue fill vs secondary light blue fill—same shape, similar weight.

**Correct:**

Primary: solid dark fill, white text. Secondary: 2px outline, transparent fill. Tertiary: text only.

Reference: [Button design tips](https://www.adhamdannaway.com/blog/ui-design/button-design-tips)
