# TaskNest Production Deployment & M3 UI Development Tasks

## Specification Summary
**Original Requirements**: Reverse-Engineered from `com.example.tasknest` (`app-debug.apk`), Material Design 3 (M3) Mobile Ergonomics. Replicate exact visual design, color tokens, layout hierarchy, and interaction behaviors for TaskNest.
- **Color Tokens**: `colorPrimary` (#6750A4), `colorSurface` (#FEF7FF), `colorSurfaceContainer` (#F3EDF7), `bg_tag_high` (#FFDAD6 / #410002), `bg_tag_medium` (#FFDCC2 / #2E1500), `bg_tag_low` (#C8E6C9 / #00390F), `bg_tag_category` (#E7E0EC / #49454F), `bg_tag_done` (#E0E0E0 / #757575), `colorError` (#BA1A1A / #FFB4AB).
- **Screens**: 
  1. Splash Screen (`activity_splash.xml`)
  2. Main Dashboard (`activity_main.xml` + `item_task.xml`)
  3. Add / Edit Task Form (`activity_add_edit_task.xml`)
  4. Task Detail View (`activity_task_detail.xml`)
- **Key Interactions**: Top velocity progress banner, 4 filter chips (All, Today, Upcoming, Completed), single-tap completion with strikethrough, collapsible reminder offset selector, swipe/action delete with 4-second undo banner, full modal/detail navigation.
**Technical Stack**: React 19, TypeScript, Tailwind CSS, Vite 6, Express.js, Better-SQLite3, Docker.
**Target Timeline**: Completed autonomously.

---

## Development Tasks

### [x] Task 1: Repository Hygiene & Non-Functional Artifact Pruning
**Description**: Safely isolate and archive non-functional artifacts (old presentations, draft docs, obsolete python helper scripts, dead screenshots) into `legacy_archive/` and configure `.dockerignore` and `.gitignore`.
**Acceptance Criteria**:
- Root directory is clean of loose .docx, .pptx, .pdf, and obsolete .py files. [PASSED]
- `.dockerignore` prevents bloat in Docker context. [PASSED]
- Docker build context reduced from >15MB to clean source files. [PASSED]

**Files Created/Edited**:
- [`.dockerignore`](file:///home/gaurish/Desktop/Major/v4/.dockerignore)
- [`.gitignore`](file:///home/gaurish/Desktop/Major/v4/.gitignore)
- `legacy_archive/`

---

### [x] Task 2: Backend Task API & Persistent SQLite Database Engine
**Description**: Implement database table `tasks` in SQLite with schema matching `UI.md` properties, and REST API routes for full CRUD operations with undo support.
**Acceptance Criteria**:
- `tasks` table stores `id`, `title`, `description`, `due_at`, `category`, `priority`, `reminder_on`, `reminder_offset`, `is_completed`, `created_at`. [PASSED]
- Endpoints: `GET /api/tasks`, `POST /api/tasks`, `GET /api/tasks/:id`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`, `PATCH /api/tasks/:id/toggle`, `POST /api/tasks/:id/restore`. [PASSED]
- Initial seed tasks matching the specification (e.g. "Finish Embedded Systems Lab Report"). [PASSED]

**Files Created/Edited**:
- [`server/db/taskDb.ts`](file:///home/gaurish/Desktop/Major/v4/server/db/taskDb.ts)
- [`server/routes/task.routes.ts`](file:///home/gaurish/Desktop/Major/v4/server/routes/task.routes.ts)
- [`server.ts`](file:///home/gaurish/Desktop/Major/v4/server.ts)

---

### [x] Task 3: Material Design 3 Design System & Tokens Setup
**Description**: Configure Tailwind CSS and design tokens matching the exact hex codes, radii, typography, and elevations from `UI.md`.
**Acceptance Criteria**:
- Color tokens: Primary `#6750A4`, Surface `#FEF7FF`, Surface Container `#F3EDF7`, Priority High `#FFDAD6`/`#410002`, Medium `#FFDCC2`/`#2E1500`, Low `#C8E6C9`/`#00390F`, Category `#E7E0EC`/`#49454F`, Completed `#E0E0E0`/`#757575`. [PASSED]
- Geometry: 16px cards with 1px border `#CAC4D0`, 8px pill chips, 12px button corners, 56x56 FAB with 16px rounded corners. [PASSED]

**Files Created/Edited**:
- [`src/theme/tokens.ts`](file:///home/gaurish/Desktop/Major/v4/src/theme/tokens.ts)
- [`src/index.css`](file:///home/gaurish/Desktop/Major/v4/src/index.css)

---

### [x] Task 4: Screen 1 - Splash Screen Implementation
**Description**: Build Screen 1 (`activity_splash.xml`) with logo, title "TaskNest", tagline "Plan it. Nest it. Get it done.", and bottom indeterminate progress loader with "Loading your tasks...".
**Acceptance Criteria**:
- Displays centered TaskNest branding and 40% vertical offset logo. [PASSED]
- Shows indeterminate progress animation and subtitle. [PASSED]
- Smoothly transitions into the Main Dashboard upon load. [PASSED]

**Files Created/Edited**:
- [`src/components/tasknest/SplashScreen.tsx`](file:///home/gaurish/Desktop/Major/v4/src/components/tasknest/SplashScreen.tsx)

---

### [x] Task 5: Screen 2 - Main Dashboard with Velocity Banner, Filter Chips & List
**Description**: Build Screen 2 (`activity_main.xml` + `item_task.xml`) featuring top progress metrics banner (Pending, Done, Completion %), filter chips (All, Today, Upcoming, Completed), task items with checkboxes, badges, reminder bell, swipe-to-delete with undo toast, empty state, and floating action button.
**Acceptance Criteria**:
- Top progress banner calculates pending count, done count, and completion percentage dynamically. [PASSED]
- Filter chips accurately filter by All, Today, Upcoming, and Completed tasks. [PASSED]
- Checking a task immediately updates completion status, strikethrough styling, and metrics. [PASSED]
- Swipe or button delete reveals undo toast banner (4-second auto-dismiss). [PASSED]
- Centered empty state shown when list is empty. [PASSED]
- FAB anchored at bottom-right opens creation screen. [PASSED]

**Files Created/Edited**:
- [`src/components/tasknest/MainDashboard.tsx`](file:///home/gaurish/Desktop/Major/v4/src/components/tasknest/MainDashboard.tsx)
- [`src/components/tasknest/TaskItemCard.tsx`](file:///home/gaurish/Desktop/Major/v4/src/components/tasknest/TaskItemCard.tsx)
- [`src/components/tasknest/ProgressBanner.tsx`](file:///home/gaurish/Desktop/Major/v4/src/components/tasknest/ProgressBanner.tsx)
- [`src/components/tasknest/FilterChips.tsx`](file:///home/gaurish/Desktop/Major/v4/src/components/tasknest/FilterChips.tsx)

---

### [x] Task 6: Screen 3 - Add / Edit Task Form
**Description**: Build Screen 3 (`activity_add_edit_task.xml`) with title input, multiline description, compound date/time picker, category dropdown (Work, Personal, Study), segmented priority toggle (HIGH, MEDIUM, LOW), and collapsible reminder offset selector (tied to toggle switch).
**Acceptance Criteria**:
- Title validation prevents empty submissions. [PASSED]
- Segmented priority buttons provide immediate visual active state in corresponding colors. [PASSED]
- Reminder offset dropdown is hidden until reminder switch is toggled ON. [PASSED]
- Full-width Save Task button commits to backend and returns to dashboard. [PASSED]

**Files Created/Edited**:
- [`src/components/tasknest/AddEditTaskModal.tsx`](file:///home/gaurish/Desktop/Major/v4/src/components/tasknest/AddEditTaskModal.tsx)

---

### [x] Task 7: Screen 4 - Task Detail View
**Description**: Build Screen 4 (`activity_task_detail.xml`) with top bar back and delete action (with confirmation dialog), hero title, category and priority badges, due/reminder metadata card, description, toggle completion button, and edit task button.
**Acceptance Criteria**:
- Displays full task details, dates, and reminders. [PASSED]
- Delete button prompts confirmation dialog before executing. [PASSED]
- Allows toggling completion state and switching into edit mode. [PASSED]

**Files Created/Edited**:
- [`src/components/tasknest/TaskDetailModal.tsx`](file:///home/gaurish/Desktop/Major/v4/src/components/tasknest/TaskDetailModal.tsx)

---

### [x] Task 8: Production Build, Dockerization & Verification
**Description**: Update `src/App.tsx` to host TaskNest, ensure full type safety with `npm run build`, and test all API routes and responsive web view.
**Acceptance Criteria**:
- `npm run build` compiles 100% cleanly without warnings or errors. [PASSED]
- Both production Express server and Vite preview run cleanly. [PASSED]
- Application verified in real-time execution. [PASSED]

**Files Created/Edited**:
- [`src/App.tsx`](file:///home/gaurish/Desktop/Major/v4/src/App.tsx)
- [`Dockerfile`](file:///home/gaurish/Desktop/Major/v4/Dockerfile)
- [`docker-compose.yml`](file:///home/gaurish/Desktop/Major/v4/docker-compose.yml)
- [`package.json`](file:///home/gaurish/Desktop/Major/v4/package.json)
- [`README.md`](file:///home/gaurish/Desktop/Major/v4/README.md)
