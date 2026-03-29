# 3D Design Shop - Design Document

## Overview

A web application for showcasing and viewing 3D printing models directly in the browser. Features interactive 3D model viewing using Three.js, tag-based filtering, and an admin upload system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend (React + Vite)                    │
│   Gallery │ DesignViewer │ Admin │ ModelViewer (Three.js)           │
│                         │                                                │
│                  Client-side thumbnail generation                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP/JSON
┌────────────────────────────▼────────────────────────────────────────┐
│                         Backend (Bun/Express)                       │
│   Designs API │ Auth API │ Admin API (model + thumbnail upload)      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
      ┌────▼────┐       ┌─────▼─────┐     ┌────▼────┐
      │ SQLite  │       │  /uploads │
      │  (.db)  │       │  /models  │
      └─────────┘       │ /thumbnails│
                        │  /covers  │
                        └───────────┘
```

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Backend Runtime | Bun | Fast startup, native TypeScript support |
| Backend Framework | Express | Familiar, well-documented |
| Frontend | React 18 + Vite | Modern, fast dev experience |
| Styling | Tailwind CSS | Utility-first, consistent design |
| 3D Rendering | Three.js (raw) | Full control over WebGL rendering |
| Database | SQLite (bun:sqlite) | Zero-config, file-based, sufficient for scale |
| Auth | JWT | Stateless, simple implementation |

## Directory Structure

```
3DDesignShop/
├── shared/                 # Shared TypeScript types and utilities
│   ├── src/
│   │   ├── types/          # Design, Auth types
│   │   └── utils/          # Tag parsing, slugify helpers
│   └── package.json
│
├── backend/                # Bun/Express API server
│   ├── src/
│   │   ├── db/             # SQLite database layer
│   │   ├── routes/          # Express route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── utils/          # Filename parser
│   │   └── index.ts        # Server entry point
│   ├── uploads/            # File storage (gitignored)
│   │   ├── models/         # OBJ, GLTF, GLB files
│   │   ├── thumbnails/     # Generated PNG previews
│   │   └── covers/         # Admin-uploaded cover images
│   ├── data/               # SQLite database file
│   └── package.json
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ModelViewer.tsx      # 3D viewer with controls
│   │   │   ├── UploadPreview.tsx    # Upload with preview
│   │   │   ├── DesignCard.tsx      # Gallery card
│   │   │   ├── TagFilter.tsx        # Tag filtering
│   │   │   └── SearchBar.tsx       # Search input
│   │   ├── pages/
│   │   │   ├── Gallery.tsx         # Design gallery
│   │   │   ├── DesignViewer.tsx    # Single design view
│   │   │   └── Admin.tsx          # Admin panel
│   │   ├── lib/
│   │   │   └── api.ts             # API client
│   │   └── types.ts              # Local type definitions
│   └── package.json
│
├── DESIGN.md              # This file - architecture docs
├── AGENTS.md              # AI agent instructions
└── README.md              # Project overview
```

## Data Model

### SQLite Schema

```sql
CREATE TABLE designs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  tags         TEXT DEFAULT '[]',      -- JSON array
  filename     TEXT NOT NULL,          -- Storage filename
  thumbnail    TEXT,                   -- Generated preview
  cover_image  TEXT,                   -- Admin-uploaded cover
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_category ON designs(category);
```

## API Endpoints

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/designs` | List designs (filter: `?tags=x,y&category=x&search=query`) |
| GET | `/api/designs/tags` | Get all unique tags |
| GET | `/api/designs/:id` | Get single design |

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Admin login (body: `{ password }`) |
| POST | `/api/auth/verify` | Verify JWT token validity |

### Admin Endpoints (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/designs` | Upload new design (multipart/form-data) |
| POST | `/api/admin/designs/:id/cover` | Upload cover image |
| DELETE | `/api/admin/designs/:id` | Delete design |

## Features

### Gallery View (`/`)
- Grid layout of design cards with thumbnails
- Real-time search by name, description, tags
- Multi-select tag filtering
- Responsive design (1-4 columns)
- Click any card to view details

### Design Viewer (`/design/:id`)
- Static thumbnail/cover preview on load
- Click to activate 3D viewer
- Full orbit controls (rotate, zoom, pan)
- Download button for OBJ/GLTF/GLB files
- Metadata display (name, category, tags, description)
- File info (format, upload date)

### 3D Viewer Controls
- **Mouse drag**: Rotate model around scene
- **Scroll wheel**: Zoom in/out
- **Right-click drag**: Pan view
- **Zoom In button**: Move camera closer
- **Zoom Out button**: Move camera further
- **Fit to View button**: Auto-frame the entire model
- **Reset View button**: Return to default camera position
- **Auto-Rotate toggle**: Spin the camera around model
- **X/Y/Z buttons**: Rotate model 90° around world axes
  - X: Rotate around world X-axis
  - Y: Rotate around world Y-axis (vertical)
  - Z: Rotate around world Z-axis

### Admin Panel (`/admin`)
- Password-based authentication (JWT, 24hr expiry)
- Drag-and-drop file upload for OBJ/GLTF/GLB
- Real-time 3D preview with all controls
- Client-side thumbnail generation:
  - Model renders in browser with Three.js
  - Admin positions camera to desired angle
  - Clicking "Upload" captures current view as thumbnail
- Design metadata: name, description, category, tags
- Design management: view and delete existing designs

### Thumbnail Generation
- **Client-side approach**: Thumbnails are captured from the browser using Three.js
- Admin selects a model file, it renders in a 3D preview with orbit controls
- Admin can rotate/zoom/pan to get the desired angle
- When clicking "Upload", the current canvas view is captured as PNG
- The resulting PNG blob is uploaded alongside the model file
- **Why client-side**: Bun doesn't support native WebGL/Three.js server-side

## Security Considerations

1. **Admin Auth**: Single password stored in environment variable
2. **JWT**: 24-hour expiration, stored in localStorage
3. **File Uploads**: Extension validation, size limits (50MB models, 10MB covers)
4. **CORS**: Restricted to configured frontend URL

## Environment Variables

```env
# Backend (.env)
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-very-long-random-secret
PORT=3000
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:5173
```

## Running the Project

```bash
# Install dependencies
cd shared && bun install
cd ../backend && bun install
cd ../frontend && bun install

# Copy environment file
cd backend && cp .env.example .env
# Edit .env with your values

# Run development servers
# Terminal 1:
cd backend && ulimit -n 65536 && bun run dev

# Terminal 2:
cd frontend && bun run dev
```

## Future Considerations

1. **Multi-user auth**: Add user accounts with roles
2. **Cloud storage**: Migrate uploads to S3/GCS
3. **Print settings**: Add layer height, infill, material fields
4. **E-commerce**: Pricing, cart, checkout flow
5. **Comments**: User feedback on designs
6. **Pagination**: Handle large numbers of designs
7. **Model formats**: Add STL, FBX support
