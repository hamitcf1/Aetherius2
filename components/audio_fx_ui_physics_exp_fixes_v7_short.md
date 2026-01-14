# Audio, UI, Physics & EXP Fixes (v7 – Short)

## 1. Level Up Feedback
- Level-up notification must visually resemble Skyrim-style UI.
- Play level-up sound effect on level gain.

---

## 2. Sound Effects (Global)

### UI & Economy
- Purchase button → sound
- Sell button → sound
- Modal open / close → sound
- Button palette must stay in-theme across all UI and modals.

### Inventory & Equipment
- Eating food → sound
- Drinking drinks → sound
- Drinking potions → sound
- Wearing / changing equipment → sound
- Blacksmith upgrade success:
  - Metal impact sound
  - Red/orange spark particles on upgrade button

### Quests
- Quest start → sound
- Quest completion → sound

### Combat
- Weapon attacks → sound
- Defending / blocking → sound
- Shield bash → sound
- Spell casting / impact → sound

Sound effects must work in:
- Hero page
- Adventure
- Inventory
- Bonfire
- Combat

---

## 3. Weather Physics (Visual)

### Required Effects
- Snow
- Rain
- Sandstorms

### Interaction Ideas
- Particle systems with:
  - Wind direction
  - Velocity variance
- Mouse interaction:
  - Particles repelled within cursor radius
  - Optional drag effect following mouse movement
- Performance-safe (disable on low-end devices)

---

## 4. UI Theme Consistency
- Button color palettes must:
  - Match active theme
  - Avoid out-of-theme colors
- Applies to:
  - All buttons
  - Modal triggers
  - Action buttons

---

## 5. EXP & Level-Up Bug (Critical)

### Problem
- EXP bar does not fill after gaining EXP
- Level-up does not trigger when EXP threshold is reached

### Required Fix
- Identify EXP gain → state update → UI render break
- Ensure:
  - EXP increases correctly
  - Bar visually updates
  - Level-up triggers immediately on threshold
  - Overflow EXP carries correctly

---

## 6. Reporting
Output file: `audio_fx_ui_physics_exp_report_v7.md`

Format:
- ✔ Implemented
- ⚠ Partial / Bug with short explanation