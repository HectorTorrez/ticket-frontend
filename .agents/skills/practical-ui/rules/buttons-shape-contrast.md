---
title: Button Shape Contrast ≥ 3:1
impact: CRITICAL
impactDescription: Vision-impaired users must see the button
tags: buttons, contrast, accessibility
---

## Button Shape Contrast ≥ 3:1

**Impact: CRITICAL (shape must be visible independent of label)**

The button boundary (fill or border) needs ≥3:1 contrast against its background. Text inside needs ≥4.5:1. If two buttons share the same style, inter-button contrast must also be ≥3:1.

**Incorrect:**

Secondary button: `#f5f5f5` fill on `#ffffff` (~1.1:1)—invisible shape.

**Correct:**

Visible border ≥3:1, or sufficient fill contrast. Validate with contrast checker on the shape, not just text.

Reference: [Button design tips](https://www.adhamdannaway.com/blog/ui-design/button-design-tips)
