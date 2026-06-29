---
title: Place Hints Above the Field
impact: MEDIUM
impactDescription: Hints below get covered by keyboards
tags: forms, hints, mobile
---

## Place Hints Above the Field

**Impact: MEDIUM (mobile autofill and keyboard occlusion)**

Helper text belongs between the label and input—not below the field where on-screen keyboards and browser autofill menus cover it.

**Incorrect:**

```
[Label]
[Input                    ]
Hint text hidden by keyboard ▼
```

**Correct:**

```
[Label]
Format: MM/DD/YYYY
[Input                    ]
```

Reference: [Adham Dannaway form tip](https://www.linkedin.com/posts/adhamdannaway_ui-design-tip-avoid-form-placeholder-activity-7462872272123621376-5qB5)
