---
title: Ensure Text Contrast ≥ 4.5:1
impact: CRITICAL
impactDescription: WCAG AA for readable body text
tags: color, accessibility, contrast, wcag
---

## Ensure Text Contrast ≥ 4.5:1

**Impact: CRITICAL (small text must be readable for low vision)**

Meet WCAG 2.1 Level AA:

- **Small text** (≤18px regular, or ≤14px bold): minimum **4.5:1** contrast against background
- **Large text** (>18px bold or >24px regular): minimum **3:1**

**Incorrect:**

Light grey `#999` body text on white (~2.8:1). Thin light-weight captions on photos without background treatment.

**Correct:**

Dark grey body text ≥4.5:1. On photos: semi-opaque backing or text shadow to reach contrast. Validate with WebAIM Contrast Checker or DevTools.

Reference: [16 UI design tips](https://www.adhamdannaway.com/blog/ui-design/ui-design-tips)
