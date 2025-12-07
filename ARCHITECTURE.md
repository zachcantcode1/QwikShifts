# QwikShifts Architecture & Functionality Guide

This document provides a detailed breakdown of the QwikShifts application architecture, data flow, and key functionalities.

## 1. High-Level Overview

QwikShifts is a monorepo application built for employee scheduling and management. It uses a modern stack optimized for performance and developer experience.

### Tech Stack
- **Runtime**: [Bun](https://bun.sh) (Fast JavaScript runtime & package manager)
- **Monorepo Tool**: [Turborepo](https://turbo.build)
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Hono (Web Framework), SQLite (Database via `bun:sqlite`)
- **Shared**: TypeScript, Zod (Schema Validation)

### Project Structure
```
/
├── apps/
│   ├── api/          # Backend Server (Hono + SQLite)
│   └── web/          # Frontend Application (React + Vite)
├── packages/
│   └── core/         # Shared TypeScript types & Zod schemas
├── package.json      # Root configuration
└── turbo.json        # Build pipeline configuration
```

---

## 2. Data Model (Database)

The application uses a local SQLite database (`apps/api/qwikshifts.sqlite`). The schema is relational and centered around an **Organization**.

### Key Entities & Relationships

1.  **Organization**: The root entity. Contains `name` and `onboarding_step`.
2.  **User**: Represents a login account (Manager or Employee). Linked to an Organization.
3.  **Location**: Physical locations (e.g., "Main Branch"). Belongs to an Organization.
4.  **Area**: Specific sections within a location (e.g., "Kitchen", "Patio"). Linked to a Location.
5.  **Role**: Job titles (e.g., "Server", "Cook"). Linked to an Organization.
6.  **Rule**: Scheduling constraints (e.g., "Full Time 40hrs"). Linked to an Organization.
7.  **Employee**: A profile linking a **User** to a **Location** and **Roles**.
    -   Has a `weekly_hours_limit` derived from an assigned **Rule**.
    -   Many-to-Many relationship with **Roles** via `employee_roles` table.
8.  **Shift**: A time block assigned to an **Area**.
9.  **Assignment**: Links a **Shift** to an **Employee**.
10. **Requirement**: Staffing needs (e.g., "Need 2 Cooks in Kitchen on Monday").

---

## 3. Backend Architecture (`apps/api`)

The backend is a lightweight Hono server that handles API requests and database operations.

### Initialization (`index.ts` & `db.ts`)
-   On startup, `initDb()` runs to ensure all SQLite tables exist.
-   WAL (Write-Ahead Logging) mode is enabled for concurrency.
-   Foreign keys are enabled for data integrity.

### Authentication (`middleware.ts`)
-   Currently uses a simplified "Demo Auth" mechanism.
-   The frontend sends a custom header `x-user-id`.
-   Middleware validates this ID against the `users` table.
-   If valid, the user context is attached to the request.

### API Routes
-   **`/onboarding`**: Public routes for setting up a new organization.
-   **`/employees`**: CRUD operations for employee profiles. Handles complex joins to fetch user details and roles.
-   **`/schedule`**: Fetches shifts for a date range.
-   **`/assignments`**: Handles assigning employees to shifts.
-   **`/rules`**: Manages scheduling rules.

---

## 4. Frontend Architecture (`apps/web`)

The frontend is a Single Page Application (SPA) built with React.

### State Management
-   **Local State**: `useState` is used for form inputs and UI toggles.
-   **Server State**: Data is fetched via `fetch` calls in `useEffect` hooks.
-   **Auth Context**: `AuthProvider` (`lib/auth.tsx`) manages the current user session and checks onboarding status on load.

### Key Features & Workflows

#### A. Onboarding Flow (`pages/Onboarding.tsx`)
A multi-step wizard that guides new users to set up their organization.
1.  **Org Setup**: Creates Organization and Manager User.
    -   *Auto-Magic*: Automatically creates a default "Main Location" and an Employee Profile for the Manager.
2.  **Locations**: Add physical work sites.
3.  **Areas**: Define work zones within locations.
4.  **Roles**: Define job titles.
5.  **Employees**: Add staff members.
    -   **Persistence**: The current step is saved to the DB. If the user refreshes, they resume where they left off.

#### B. The Schedule Board (`pages/ScheduleBoard.tsx`)
The core interface for managing shifts.
-   **Views**: Month, Week, and Day views.
-   **Drag and Drop**: Uses `@dnd-kit` to drag employees onto shifts.
-   **Validation**:
    -   Checks if an employee is already working during that time.
    -   Checks if an employee exceeds their weekly hours limit (visualized by red text).
-   **Staffing Requirements**: Visual indicators show if an area is understaffed based on defined rules.

#### C. Employee Management (`pages/Employees.tsx`)
-   Allows managers to add/edit employees.
-   Assign **Roles** (what they can do).
-   Assign **Rules** (e.g., Max 40 hours/week).
-   The UI updates in real-time to reflect changes.

---

## 5. Shared Logic (`packages/core`)

This package contains the "Source of Truth" for data structures.
-   **Zod Schemas**: Define the shape of data (e.g., `UserSchema`, `ShiftSchema`).
-   **TypeScript Types**: Inferred from Zod schemas (e.g., `type User = z.infer<typeof UserSchema>`).
-   Both the API and Web apps import from here to ensure they agree on what a "User" or "Shift" looks like.

## 6. Development Workflow

### Running the App
```bash
bun run dev
```
This runs `turbo run dev`, which starts both the API (port 3000) and Web (port 5173) simultaneously.

### Database Reset
```bash
bun run db:reset
```
Deletes the local SQLite file to start fresh. Useful for testing the onboarding flow.

### Adding a New Feature
1.  **Database**: Add table/column in `apps/api/db.ts`.
2.  **Types**: Update schemas in `packages/core/index.ts`.
3.  **API**: Create/Update route in `apps/api/routes/`.
4.  **Frontend**: Create UI component and connect to API in `apps/web/`.
