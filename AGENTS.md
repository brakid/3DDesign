# Agent Instructions

This document provides context for AI agents that will work on this codebase. It captures the design decisions, requirements, and conventions to ensure consistency.

## Project Origin

This project was built through a collaborative design session with the user. The following clarifying questions were asked and answered:

### Clarifying Questions and Answers

| Question | Options Presented | User's Choice |
|----------|-------------------|---------------|
| Asset storage | Local filesystem / Cloud (S3/GCS) / Both | **Local filesystem** |
| Auth method | Simple password / User accounts | **Simple password** |
| Design metadata | Name, description, tags, category (+ pricing, dimensions, print settings) | **Name, description, tags, category** |
| Tech stack | React + Node.js / Next.js / Vanilla + Python | **React + Bun (Node.js TypeScript)** |
| Metadata storage | SQLite / JSON file / PostgreSQL/MySQL | **SQLite (Recommended)** |
| Styling framework | (not explicitly asked, chosen for UX) | **Tailwind CSS** |

### Design Rationale

1. **Local filesystem storage**: Simplicity for single-server deployment. Files served statically.
2. **Simple password auth**: Only one admin (the user). No need for user management overhead.
3. **Minimal metadata**: Sufficient for basic organization without over-engineering.
4. **Bun runtime**: Fast startup, native TypeScript, modern tooling.
5. **SQLite (bun:sqlite)**: Zero-configuration, file-based, perfect for this scale. No separate DB server needed.
6. **Tailwind CSS**: Rapid UI development, consistent styling, no separate CSS files needed.
7. **Client-side thumbnails**: Thumbnails generated in browser using Three.js because Bun doesn't support WebGL/headless rendering natively.
8. **Raw Three.js (not React Three Fiber)**: Used in UploadPreview and ModelViewer for full control over imperative WebGL rendering and canvas capture.

## Core Principles

1. **Code simplicity**: Avoid over-engineering; implement what's needed
2. **Type safety**: Full TypeScript everywhere, no `any` types (except where unavoidable)
3. **Performance**: Lazy-load 3D viewer; thumbnails for fast gallery browsing
4. **Client-side rendering**: Thumbnails and 3D preview generated in browser

## Key Conventions

### File Structure
- `/shared` - Types and utilities (originally shared, now mostly frontend types)
- `/backend/src/db` - Database layer using bun:sqlite (no ORM)
- `/frontend/src/components` - Reusable UI components (ModelViewer, UploadPreview, etc.)
- `/frontend/src/pages` - Route pages (Gallery, DesignViewer, Admin)
- `/frontend/src/lib` - API client

### Naming
- Components: PascalCase (e.g., `DesignCard.tsx`, `ModelViewer.tsx`)
- Utilities: camelCase
- Database functions: camelCase with descriptive names (e.g., `getDesigns`, `createDesign`)
- Props interfaces: PascalCase with `Props` suffix

### 3D Viewer Implementation
- Uses raw Three.js (not React Three Fiber) for imperative control
- OrbitControls from `three/examples/jsm/controls/OrbitControls.js`
- OBJLoader and GLTFLoader for model loading
- Canvas captured via `toDataURL()` for thumbnail generation

### 3D Coordinate System
- World Y = up (standard Three.js convention)
- World Z = depth
- Model rotation buttons (X/Y/Z) rotate around world axes
- OBJ files typically use Z as up, but Three.js uses Y as up

### Styling
- Tailwind CSS for all styling
- Primary color palette (blue: `primary-500: #0ea5e9`)
- Rounded corners (rounded-lg, rounded-xl), subtle shadows for cards
- Lucide React for icons

## Making Changes

### Before Implementing New Features

1. **Check DESIGN.md** for existing architecture patterns
2. **Consider client-side rendering**: If feature involves 3D/WebGL, it likely needs browser implementation
3. **Database changes**: Consider migrations if schema changes; backup data

### When Adding New Features

1. Document the feature in DESIGN.md
2. Add types to `/frontend/src/types.ts` if new data structures are needed
3. Update API if new endpoints required
4. Add tests if applicable

### When Changing Design Decisions

1. Discuss with user first
2. Update this AGENTS.md with the new decision and rationale
3. Update DESIGN.md accordingly
4. Ensure migrations path for existing data

## Current Limitations (Known)

- No pagination on gallery (loads all designs)
- Single admin password (not user accounts)
- No error boundary on 3D viewer
- Thumbnail is captured on upload - user must manually adjust 3D view first
- Thumbnail generation requires modern browser with WebGL support
- No file cleanup when design is deleted (should delete uploaded files too)
- SQLite database not encrypted (suitable for local development only)

## Environment Setup

```bash
# Install dependencies
cd shared && bun install
cd ../backend && bun install
cd ../frontend && bun install

# Copy environment file
cd backend && cp .env.example .env
# Edit .env with your values

# Run development servers
# Terminal 1: bun run dev (backend)
# Terminal 2: bun run dev (frontend)
```

## Testing

Currently no test suite. When adding tests:
- Backend: Use Bun's built-in test runner or Vitest
- Frontend: Use Vitest + React Testing Library
- E2E: Playwright for full flow testing
