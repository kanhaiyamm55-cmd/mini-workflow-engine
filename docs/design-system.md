# UI Design System
## Principles
1. Clear hierarchy and low-friction task actions.
2. Text labels always accompany status and priority colour.
3. Responsive layouts for narrow mobile screens and desktop.
4. Visible feedback for loading, empty, success and error states.
5. Respect reduced-motion preferences.
## Tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| Background | #f4f7f6 | #101918 | Page |
| Surface | #ffffff | #192522 | Panels and cards |
| Text | #142321 | #edf5f1 | Body |
| Primary | #0f766e | #0f766e | Primary actions |
| Border | #e2e9e6 | #2a3a35 | Dividers |
| Spacing | 4px base | 4px base | Layout |
## Components and states
- Buttons: primary and secondary; hover, focus and disabled.
- Inputs/selects: default, focus and validation error.
- Task card: title, description, status chip, priority chip, actions.
- Dialog: create/edit form and task detail; close and cancel controls.
- List: loading, empty, ready and error states.
- Timeline: chronological activity events with action and timestamp.
## Accessibility
Semantic headings, form labels, live region for notices, accessible dialog labels, keyboard-operable buttons and native controls. Reduced motion is respected. Contrast should be rechecked before any brand palette changes.
## Responsive layout
Three summary cards on desktop and mobile; task cards stack actions on small screens. Filter controls wrap below 760px.
