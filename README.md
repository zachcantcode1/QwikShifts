# QwikShifts

A modern employee scheduling and management application.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or later)

### Installation

To set up the project, run the following command in the root directory:

```bash
bun run setup
```

This command will install all dependencies and build the project.

### Development

To run the project in development mode (with hot reloading):

```bash
bun run dev
```

This will start both the API (port 3000) and the Web application (port 5173).

### Production

To run the project in production mode:

```bash
bun run start
```

This will start the API and serve the built Web application.

## Project Structure

- `apps/api`: The backend API (Hono + SQLite)
- `apps/web`: The frontend application (React + Vite + Tailwind)
- `packages/core`: Shared types and utilities
