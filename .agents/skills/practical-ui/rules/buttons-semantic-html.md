---
title: Use Semantic HTML for Actions vs Navigation
impact: HIGH
impactDescription: Screen reader and keyboard correctness
tags: buttons, links, accessibility, html
---

## Use Semantic HTML for Actions vs Navigation

**Impact: HIGH (appearance can blur; semantics must not)**

Visual style can make links look like buttons and vice versa—that's OK if semantics are correct:

- **`<button>`** (or `type="button"`/`submit`) for in-page actions
- **`<a href="...">`** for navigation to another URL/route

**Incorrect:**

```html
<div onclick="save()">Save</div>
<a href="#" onclick="deleteItem()">Delete</a>
```

**Correct:**

```html
<button type="submit">Save</button>
<a href="/settings">Settings</a>
<button type="button" class="btn-tertiary">Delete</button>
```

Reference: [Button design tips](https://www.adhamdannaway.com/blog/ui-design/button-design-tips)
