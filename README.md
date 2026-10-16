# Hotel Room Management Web App (React + Vite)

Front Desk, Housekeeping and Engineering interfaces for the room turnover workflow.
It talks to the backend API at **http://localhost:1802/api/v1**.

## Quick start (local)

Requires **Node.js 18 or newer** and the backend running (see the backend README).

**Windows**: double-click `start_local.bat`, or:
```bat
cd hotel-room-management-frontend
start_local.bat
```

**Linux / macOS**:
```bash
cd hotel-room-management-frontend
./start_local.sh
```

Then open **http://localhost:5173** (use `localhost`, not `127.0.0.1`, so the sign-in cookie works).

Manual steps:
```bash
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run dev
```

## Trying the full workflow

1. Sign in as **Front Desk / Admin** with the `admin` password printed by the backend. Choose a new password.
2. **Users**: create a housekeeper (e.g. `hk.anita`) and an engineer (e.g. `eng.sunil`).
3. **Rooms**: add a few rooms.
4. **Overview**: click a room in the room rack, then **Record checkout** and pick the housekeeper.
5. Sign out, sign in as **Housekeeping**, open the room, **Start work**, fill the checklist.
   Fail an item (with a remark and optionally a photo) and submit.
6. Sign in as **Engineering**, **Take it**, **Start repair**, fill diagnosis, notes and checks,
   optionally tick **Room needs re-cleaning**, then **Complete repair**.
7. Back as Housekeeping (if re-cleaning was requested), redo the checklist. Then **Mark ready for guest**
   (housekeeper, engineer or front desk can release once every check has passed).
8. Front Desk sees the room turn green in the rack. Check **Turnover tickets → Timeline** and **Reports**.

Tip: use a second browser or a private window to stay signed in as two departments at once.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Run the unit and component tests (Vitest) |

## Configuration (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:1802/api/v1` | Backend API address |
| `VITE_POLL_INTERVAL_SECONDS` | `20` | How often dashboards refresh |

Restart `npm run dev` after changing `.env`.

## Structure

```
src/
  main.jsx, App.jsx
  routes/          AppRoutes, ProtectedRoute (signed in), DepartmentRoute (right department)
  layouts/         AuthLayout, DashboardLayout (sidebar, header, notifications, sign out)
  context/         AuthContext (session), ToastContext (success/error messages)
  hooks/           useAuth, useApi (loading + polling), useChecklistState
  services/        apiClient (single Axios client) + one file per API area
  components/
    common/        Button, Input, Select, Modal, DataTable, StatusBadge, ConfirmDialog, ...
    dashboard/     StatCard, RoomRack, RoomStatusTable, TicketTable, NotificationBell
    checklist/     ChecklistSection, ChecklistItem, ChecklistProgress, PhotoUpload, ...
    tickets/       TicketDetails, TicketTimeline, AssignmentDialog, ReadinessPanel, dialogs
  pages/           LoginPage, frontdesk/*, housekeeping/*, engineering/*, NotFound, Unauthorized
  utils/           constants, statusHelpers, validators, dateHelpers
  styles/          index.css (Tailwind), variables.css
  test/            Vitest tests
```

Checklists are rendered from the API, never hard-coded: each inspection holds its own copy of the
items that applied when it started.

## Notes

- The session is an httpOnly cookie set by the API; the token is never stored in browser storage.
- Expired sessions return you to the sign-in page with a message.
- Typing another department's URL shows a "belongs to another department" page, and the API refuses
  the requests anyway.
- Times are shown in the hotel timezone configured on the backend (`HOTEL_TIMEZONE`).
- The Public Sans font loads from Google Fonts; without internet the app falls back to the system font.
