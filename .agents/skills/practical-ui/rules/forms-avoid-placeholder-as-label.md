---
title: Don't Use Placeholder as Label
impact: CRITICAL
impactDescription: Placeholders fail memory and contrast
tags: forms, placeholder, accessibility
---

## Don't Use Placeholder as Label

**Impact: CRITICAL (three failure modes)**

Placeholder-as-label problems:

1. Disappears on focus—users forget the field purpose
2. Can look like pre-filled value—skipped fields
3. Low contrast—hard to read; often fails WCAG

**Exception:** Single-purpose fields like search may use placeholder if the field has an accessible `aria-label`/`label` and placeholder contrast ≥4.5:1.

**Incorrect:**

```html
<input placeholder="Full name" />
```

**Correct:**

Label above + optional placeholder for format hint only (`placeholder="Jane Doe"`).

Reference: [Adham Dannaway form tip](https://www.linkedin.com/posts/adhamdannaway_ui-design-tip-avoid-form-placeholder-activity-7462872272123621376-5qB5)
