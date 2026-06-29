---
title: Always Show Labels Above Fields
impact: CRITICAL
impactDescription: Persistent field identification
tags: forms, labels, accessibility
---

## Always Show Labels Above Fields

**Impact: CRITICAL (labels must not disappear on focus)**

Every input needs a visible, persistent label—typically above the field. Labels support memory, accessibility, and autofill clarity.

**Incorrect:**

Only placeholder text inside the field: "Email address".

**Correct:**

```html
<label for="email">Email address</label>
<input id="email" type="email" autocomplete="email" />
```

Reference: [Adham Dannaway form tip](https://www.linkedin.com/posts/adhamdannaway_ui-design-tip-avoid-form-placeholder-activity-7462872272123621376-5qB5)
