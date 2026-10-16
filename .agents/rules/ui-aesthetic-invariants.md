# UI Aesthetic Invariants & List Styling Guidelines

## 1. Icon Color Uniformity
- All standard navigation, settings, drawer, and list item icons MUST strictly use `var(--text-heading)` (`#0E1326`, deep dark navy slate / black) or inherit `currentColor`.
- Never use ad-hoc primary purple/blue (`#5452EC`) or custom colors on standard list item icons.

## 2. Elimination of Subtitle Clutter in Preference Lists
- Action list rows in preference groups (e.g. Settings, Menus, Drawers) MUST remain clean, single-line items.
- Do NOT insert arbitrary explanatory subtitle captions beneath list item titles.
- Status indicators must use compact pill badges (`.badge-pill`) placed cleanly to the left of the navigation chevron.
