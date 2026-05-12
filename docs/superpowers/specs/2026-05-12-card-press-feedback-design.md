## Card Press Feedback Design

### Goal

Add consistent press feedback to all visual card surfaces in the mobile app, including cards that are display-only today.

### Scope

This change applies to card-like containers rendered in `account-app-mobile`:

- `SummaryCard`
- Statistics breakdown cards
- Profile info cards
- Details summary strip cards

Existing row-style press targets keep their current structure unless they are also card surfaces.

### Interaction

All card surfaces should respond to touch with:

- slight scale-down while pressed
- reduced shadow while pressed

Display-only cards do not trigger navigation, mutation, or any business action when released.

### Implementation

Introduce one reusable card wrapper that:

- accepts children and base card styles
- supports optional `onPress`
- remains pressable even when `onPress` is omitted, so display-only cards still show feedback
- centralizes the pressed visual treatment

### Verification

- cover the pressed-style helper with a focused automated test
- run the existing local test suite
- run `npm run lint`
- manually verify the updated card surfaces render and press consistently
