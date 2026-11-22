# TaskNest UI Design Specification & Replication Blueprint
> **Artifact Source**: Reverse-Engineered from `com.example.tasknest` (`app-debug.apk`)  
> **Design Language**: Material Design 3 (M3) Mobile Ergonomics  
> **Use Case**: Master UI reference and prompt template to reproduce or port this UI to Flutter, React Native, Jetpack Compose, or Web.

---

## 1. Design Tokens & Visual Hierarchy

### 1.1. Color Palette & Badge Semantic Tokens
Extracted from `resources.arsc` and `classes3.dex`:

| Token Name | Hex Equivalent (Light / Dark) | Semantic Role | Applied Elements |
| :--- | :--- | :--- | :--- |
| `colorPrimary` | `#6750A4` / `#D0BCFF` | Brand Primary / Active Actions | `fabAdd`, `btnSave`, active chips |
| `colorSurface` | `#FEF7FF` / `#141218` | App Background Surface | Activity root backgrounds |
| `colorSurfaceContainer` | `#F3EDF7` / `#211F26` | Card Surfaces | Metric banner, task cards |
| `bg_tag_high` | `#FFDAD6` (Text: `#410002`) | High Priority Urgent Tag | `btnHigh`, high-priority badge |
| `bg_tag_medium` | `#FFDCC2` (Text: `#2E1500`) | Medium Priority Tag | `btnMedium`, medium-priority badge |
| `bg_tag_low` | `#C8E6C9` (Text: `#00390F`) | Low Priority Tag | `btnLow`, low-priority badge |
| `bg_tag_category`| `#E7E0EC` (Text: `#49454F`) | Category Pill Tag | `Work`, `Personal`, `Study` badges |
| `bg_tag_done` | `#E0E0E0` (Text: `#757575`) | Completed State Surface | Completed task card background |
| `colorError` / `ic_delete_red` | `#BA1A1A` / `#FFB4AB` | Destructive Actions | Swipe background, delete dialog |

### 1.2. Typography Hierarchy
- **App Title (`tvAppName`)**: `28sp` SemiBold, tracking `-0.5px`.
- **Screen Headlines (`tvTitle` in Detail)**: `22sp` Bold, line height `28sp`.
- **Card Titles (`tvTitle` in Item)**: `16sp` Medium. Completed state applies `Paint.STRIKE_THRU_TEXT_FLAG` and `alpha = 0.6`.
- **Section Headers & Metric Labels**: `12sp` Bold, uppercase, tracking `+0.5px`.
- **Timestamps & Badges (`tvDue`, `tvCategory`)**: `12sp` Regular / Medium, rounded pill padding (`8dp` horizontal, `4dp` vertical).
- **Body Notes (`tvDescription`)**: `14sp` Regular, line spacing multiplier `1.2`.

### 1.3. Geometry, Elevation & Radii
- **Task Cards (`MaterialCardView`)**:
  - Corner Radius: `16dp`
  - Resting Elevation: `2dp`
  - Pressed/Dragging Elevation: `6dp`
  - Stroke: `1dp` solid `#CAC4D0` (unselected)
- **Buttons & Chips**:
  - Filter Chips: `8dp` corner radius (pill shape), height `32dp`.
  - Floating Action Button (`fabAdd`): `16dp` rounded container, standard `56dp x 56dp`.
  - Primary Action Buttons (`btnSave`, `btnComplete`): `12dp` rounded corner, height `48dp`.

---

## 2. Screen-by-Screen Layout Specifications

```
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │  Splash Screen  │  ──>  │ Main Dashboard  │  ──>  │ Add / Edit Task │
  │ (activity_splash│       │ (activity_main) │       │ (activity_add_  │
  └─────────────────┘       └────────┬────────┘       │   edit_task)    │
                                     │                └─────────────────┘
                                     ▼
                            ┌─────────────────┐
                            │   Task Detail   │
                            │ (activity_task_ │
                            │     detail)     │
                            └─────────────────┘
```

---

### Screen 1: Splash Screen (`activity_splash.xml`)
- **Root**: `ConstraintLayout` (centered content).
- **Logo (`ivLogo`)**: `96dp x 96dp` centered vertically at 40% parent height.
- **App Name (`tvAppName`)**: Centered directly below logo, text `"TaskNest"`.
- **Tagline (`tvTagline`)**: Text `"Plan it. Nest it. Get it done."`, muted color.
- **Loader (`progressBar`)**: Indeterminate circular loader positioned `32dp` above bottom edge.
- **Loading Hint (`tvHint`)**: `"Loading your tasks..."` positioned directly below the progress bar.

---

### Screen 2: Main Dashboard (`activity_main.xml` + `item_task.xml`)

#### Top Progress Summary Banner
An elevated card at the top displaying live task completion velocity:
- **Pending Counter (`tvPending`)**: Displays `"Pending: X"` with active alert indicator.
- **Completed Counter (`tvDoneCount`)**: Displays `"Done: Y"`.
- **Completion Rate (`tvPercent`)**: Circular or percentage text badge (e.g. `"75% Completed"`).

#### Horizontal Filter Chips (`chipGroup`)
Single-selection horizontal scroll container:
- `chipAll`: Displays all tasks.
- `chipToday`: Filters tasks where `due_at` matches current calendar day.
- `chipUpcoming`: Filters tasks where `due_at > end_of_today`.
- `chipCompleted`: Filters tasks where `is_completed = 1`.

#### Task List (`rvTasks` + `item_task.xml`)
A vertical `RecyclerView` with `8dp` item spacing and `16dp` horizontal screen padding.

```text
┌──────────────────────────────────────────────────────────┐
│ [ ]  Finish Embedded Systems Lab Report                  │
│      ┌─────────┐  ┌──────────┐                           │
│      │  Study  │  │   HIGH   │                           │
│      └─────────┘  └──────────┘                           │
│      📅 Today - 4:00 PM                   🔔 Reminder    │
└──────────────────────────────────────────────────────────┘
```

- **Item Card Layout (`item_task.xml`)**:
  - `CheckBox`: Aligned to top-left for single-tap completion.
  - `tvTitle`: Single/two-line title with ellipsis overflow. When checked: text is struck through and container dims to `60% alpha`.
  - `tvCategory`: Rounded pill badge (`Work`, `Personal`, `Study`).
  - `tvPriority`: Pill badge with priority-specific background tint (`bg_tag_high`, `bg_tag_medium`, `bg_tag_low`).
  - `tvDue`: Formatted relative date string (e.g., `"Today - 4:00 PM"`, `"Tomorrow - 10:00 AM"`).
  - `ivBell`: Icon indicating active scheduled alarm; hidden if `reminder_on == 0`.

#### Gestures & Empty State
- **Swipe-to-Delete**: Swiping in either direction reveals a red background canvas with a white trash can icon (`ic_delete_red`). Upon release: card is removed with an undoable Snackbar (`"Task deleted" [UNDO]`).
- **Empty State (`tvEmpty`)**: Displayed when list is empty:
  `"No tasks yet.\nTap + Add Task to create one."`
- **FAB (`fabAdd`)**: Fixed bottom-right `CoordinatorLayout` anchor with `+` icon.

---

### Screen 3: Add / Edit Task Form (`activity_add_edit_task.xml`)

Vertical scrollable form structured in clean visual groups:

```text
┌──────────────────────────────────────────────────────────┐
│  ←  New Task                                             │
├──────────────────────────────────────────────────────────┤
│  TITLE                                                   │
│  [ Enter task title...                                 ] │
│                                                          │
│  DESCRIPTION                                             │
│  [ Add notes or subtasks...                            ] │
│  [                                                     ] │
│                                                          │
│  DATE & TIME                                             │
│  [ 📅 Select Date ]          [ ⏰ Select Time ]          │
│                                                          │
│  CATEGORY                                                │
│  [ Work / Personal / Study                           ▼ ] │
│                                                          │
│  PRIORITY                                                │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │     HIGH     │    MEDIUM    │     LOW      │          │
│  └──────────────┴──────────────┴──────────────┘          │
│                                                          │
│  REMINDER                                                │
│  Remind Me Before Due Date             [ Switch: ON  ]   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Alert Offset: [ 15 minutes before                ▼]│  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [                 SAVE TASK BUTTON                  ]   │
└──────────────────────────────────────────────────────────┘
```

#### Detailed Input Contracts:
1. **Title (`etTitle`)**: Single line, mandatory, autofocus.
2. **Description (`etDescription`)**: Multiline (`minLines=3`, `maxLines=6`), optional.
3. **Compound DateTime Pickers (`btnDate`, `btnTime`)**: Side-by-side buttons with calendar and clock leading icons. Displays formatted date (e.g. `Nov 21, 2026`) and time (`04:30 PM`).
4. **Category (`spCategory`)**: Material spinner/dropdown populated with `Work`, `Personal`, `Study`.
5. **Segmented Priority (`btnHigh`, `btnMedium`, `btnLow`)**: Radio-style segmented container. Tapping one activates its distinct color tint and deactivates others.
6. **Collapsible Reminder Container (`layoutReminderOptions`)**:
   - Tied to `switchReminder`.
   - When switch is OFF: container is `GONE`.
   - When switch is ON: container expands to show `spReminder` with preset offsets:
     - `At time of event` (`0 min`)
     - `10 minutes before` (`10 min`)
     - `30 minutes before` (`30 min`)
     - `1 hour before` (`60 min`)
     - `1 day before` (`1440 min`)
7. **Action Button (`btnSave`)**: Full-width primary container button pinned at the bottom.

---

### Screen 4: Task Detail View (`activity_task_detail.xml`)

Dedicated presentation screen for inspecting and managing single task lifecycle:

```text
┌──────────────────────────────────────────────────────────┐
│  ←  Task Details                                  [ 🗑️ ] │
├──────────────────────────────────────────────────────────┤
│  Finish Embedded Systems Lab Report                      │
│                                                          │
│  [ Study ]    [ HIGH PRIORITY ]                          │
│                                                          │
│  📅 Due: Today, Nov 21 at 4:00 PM                        │
│  🔔 Reminder: 15 minutes before                          │
│  ⚪ Status: Pending                                      │
├──────────────────────────────────────────────────────────┤
│  DESCRIPTION                                             │
│  Complete the CYW43439 firmware integration test and     │
│  document power consumption under light sleep.           │
│                                                          │
│  Created: Nov 20, 2026 at 10:30 AM                       │
├──────────────────────────────────────────────────────────┤
│  [               MARK AS COMPLETED                   ]   │
│  [                   EDIT TASK                       ]   │
└──────────────────────────────────────────────────────────┘
```

#### View Components & Actions:
- **Top Bar**: Back button + Delete action icon (`action_delete`). Tapping delete prompts confirmation dialog:
  - Title: *"Delete this task?"*
  - Body: *"This action cannot be undone."*
  - Actions: `[Cancel]` and `[Delete]` (red destructive tint).
- **Hero Title (`tvTitle`)**: `22sp` Bold text.
- **Badge Bar**: Category pill + Priority badge side-by-side.
- **Metadata Card**: Displays Due timestamp (`tvDue`), active alarm offset (`tvReminder`), and current status (`tvStatus`).
- **Action Buttons**:
  - `btnComplete`: Primary filled button toggling between `"Mark as Completed"` and `"Mark as Pending"`.
  - `btnEdit`: Outlined secondary button opening `AddEditTaskActivity` in edit mode.

---

## 3. Master Prompt to Exactly Replicate This UI

Copy and paste this structured prompt into any AI agent, code generator, or IDE assistant to recreate this exact UI in any framework:

```text
[ROLE & EXPERTISE]
Senior Frontend UI/UX Engineer specialized in Material Design 3 (M3) mobile applications and pixel-perfect component implementation.

[CONTEXT & TARGET FRAMEWORK]
Replicate the exact visual design, color tokens, layout hierarchy, and interaction behaviors of the "TaskNest" productivity application.
Target Framework: [CHOOSE: Flutter / React Native / Jetpack Compose / Web Next.js + Tailwind]

[DESIGN SYSTEM & TOKENS]
- Card Surfaces: Rounded cards with 16px corner radius, 2px elevation, 1px subtle outline (#CAC4D0).
- Priority Badges (Pill shape, 12px horizontal padding, 4px vertical):
  * High Priority: Background #FFDAD6, Text #410002
  * Medium Priority: Background #FFDCC2, Text #2E1500
  * Low Priority: Background #C8E6C9, Text #00390F
- Category Badge: Background #E7E0EC, Text #49454F
- Completed Task State: Background #E0E0E0, 60% opacity, strikethrough text on title.
- Primary Brand Color: #6750A4 (Action buttons, active chips, FAB).

[SCREENS TO IMPLEMENT]
1. Splash Screen:
   - Centered app logo + "TaskNest" (28sp bold) + "Plan it. Nest it. Get it done." (14sp muted).
   - Bottom indeterminate loader with "Loading your tasks...".
2. Main Dashboard:
   - Top summary metrics card displaying Pending count, Completed count, and Completion percentage.
   - Filter ChipGroup: "All", "Today", "Upcoming", "Completed" with single-select behavior.
   - Task List (RecyclerView / Virtualized List): Cards showing checkbox, title, category pill, priority pill, relative due date, and bell icon if reminder is on.
   - Swipe-to-delete with red background reveal and 4-second undo banner.
   - Centered empty state when no tasks match filter.
   - Bottom-right Floating Action Button (+) opening creation form.
3. Add/Edit Task Form:
   - Inputs for Title (mandatory) and multiline Description (optional).
   - Side-by-side DatePicker and TimePicker compound buttons with calendar/clock icons.
   - Category dropdown (Work, Personal, Study).
   - Segmented priority buttons (High, Medium, Low) with active color feedback.
   - Reminder toggle switch that dynamically expands/collapses the reminder offset dropdown (At time, 10m, 30m, 1h, 1d).
   - Full-width "Save Task" primary button.
4. Task Detail Screen:
   - App bar with back button and Delete icon (triggers confirmation dialog).
   - Hero task title, category pill, priority badge, and reminder metadata.
   - Full description body text and creation timestamp footer.
   - Full-width "Mark as Completed" / "Mark as Pending" toggle button and secondary "Edit Task" button.

[INTERACTIVE BEHAVIOR RULES]
- When a task checkbox is tapped on the dashboard, immediately strike through the title, update the top progress banner metrics, and toggle completion state without full list reload.
- The reminder offset selector MUST remain completely hidden until the reminder switch is toggled ON.
- Swipe-to-delete must allow an immediate Undo action.

[VERIFICATION CRITERIA]
- Every screen matches the layout hierarchy and color token specifications above.
- Form inputs validate that title is non-empty before saving.
- Filter chips accurately slice the visible list.
```
