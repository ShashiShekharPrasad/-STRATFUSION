# STRATFUSION — Multi-Source Intelligence Fusion Dashboard

A centralized web-based intelligence dashboard that unifies OSINT, HUMINT, and IMINT data on a single interactive map.

---

## Live Demo
> Deploy on Render.com for a public live link (see deployment section below)

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (optional — works in demo mode without it)

### Backend
```bash
cd backend
npm install
npm run dev        # runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # runs on http://localhost:3000
```

Open `http://localhost:3000` in your browser.

---

## Deploy on Render.com (Free)

### Backend (Web Service)
| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Environment Variable | `MONGO_URI` = your MongoDB Atlas URI |

### Frontend (Static Site)
| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Environment Variable | `VITE_API_URL` = your backend Render URL + `/api` |

---

## Features
- OSINT ingestion from MongoDB + AWS S3
- HUMINT drag-and-drop CSV / Excel / JSON upload
- IMINT satellite imagery upload (JPG/PNG)
- Interactive Leaflet.js terrain map
- Hover pop-ups showing imagery and metadata
- Classification levels: UNCLASSIFIED → TOP SECRET
- Filter by intel type (OSINT / HUMINT / IMINT)
- Works fully in demo mode without any database

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Leaflet.js |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| File Upload | Multer, react-dropzone |
| Cloud Storage | AWS S3 (optional) |
| Map | react-leaflet + OpenStreetMap |

---

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/nodes | All intel nodes |
| GET | /api/stats | Node counts by type |
| POST | /api/osint/sync-s3 | Sync from AWS S3 |
| POST | /api/humint/upload | Upload CSV/Excel/JSON |
| POST | /api/imint/upload | Upload satellite imagery |
