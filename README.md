# SecureDrop Cloud — Cloud-Based Secure File Exchange & Access Management System

> A modern, zero-account web application enabling secure, encrypted, and ephemeral cross-device file transfer powered by **MongoDB Atlas** and **Node.js / React**.

```
Upload File  ──▶  Receive Code (6-char) + PIN (6-digit)  ──▶  Switch Device  ──▶  Verify PIN  ──▶  Secure Download
```

---

## 🌟 Highlights

- **Zero-Account Ephemeral Transfers**: No email, phone numbers, login, or personal data required.
- **High-Security Cryptographic Codes**: Unambiguous 6-character transfer codes (e.g. `A7K9P2`) and server-salted Bcrypt hashed PINs. Plaintext PINs are never stored in the database.
- **Short-Lived Signed Download Tokens**: Authenticated downloads expire automatically after 60 seconds.
- **Brute-Force Attack Shield**: 5 consecutive failed PIN attempts trigger an automatic 15-minute lockout on the transfer code.
- **Rate-Limiting & Security Headers**: Multi-tier IP throttling with `express-rate-limit` and OWASP-recommended HTTP headers via `helmet`.
- **Cloud Database (MongoDB Atlas)**: Cloud-native document storage with automatic indexing, high availability, and replica set support.
- **Flexible Storage Drivers**: Supports local secure storage (with HMAC signed tokens) or cloud object storage.
- **QR Code Sharing**: Instantly scan transfer codes on mobile devices.
- **Responsive Dark-Themed UI**: Built with React 18, Tailwind CSS, Lucide icons, and Framer Motion animations.

---

## 📐 Architecture

```
                    ┌───────────────────────────────┐
                    │    USERS (Desktop / Mobile)    │
                    └───────────────┬───────────────┘
                                    │ HTTPS
                                    ▼
                    ┌───────────────────────────────┐
                    │    React Frontend (Vite)      │
                    │   Tailwind CSS + TypeScript   │
                    └───────────────┬───────────────┘
                                    │ REST API (/api/*)
                                    ▼
                    ┌───────────────────────────────┐
                    │  Node.js + Express Backend    │
                    │      (TypeScript + Zod)       │
                    └───────┬───────────────┬───────┘
                            │               │
             Mongoose / TLS │               │ Secure Filesystem / Cloud
                            ▼               ▼
                 ┌────────────────────┐   ┌────────────────────┐
                 │   MongoDB Atlas    │   │ Encrypted Storage  │
                 │   Cloud Database   │   │  (Signed Tokens)   │
                 └────────────────────┘   └────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router 6, Axios, Lucide React, `qrcode.react` |
| **Backend** | Node.js (v20+), Express 4, TypeScript, Mongoose 8, Zod, Multer, `bcryptjs`, Helmet, `express-rate-limit` |
| **Database** | MongoDB Atlas (Cloud) / Local MongoDB |
| **Testing** | Vitest 3, `mongodb-memory-server` |
| **Security** | Bcrypt with Server Pepper, SHA-256 IP Hashing, Atomic Lockout Tracking, Time-limited Signed URLs |

---

## 📊 Database Collections (MongoDB)

### 1. `files` Collection
| Field | Type | Description |
|---|---|---|
| `id` | `String` (UUID) | Unique internal file identifier |
| `original_filename` | `String` | Sanitized display filename |
| `s3_key` | `String` | Unique storage object key path |
| `file_size` | `Number` | File size in bytes |
| `content_type` | `String` | MIME type (e.g. `application/pdf`) |
| `download_count` | `Number` | Total successful downloads |
| `status` | `String` | `active` \| `deleted` \| `expired` |
| `created_at` | `Date` | Upload timestamp |

### 2. `transfers` Collection
| Field | Type | Description |
|---|---|---|
| `id` | `String` (UUID) | Unique transfer identifier |
| `file_id` | `String` | Reference to `files.id` |
| `transfer_code` | `String` | Public 6-character transfer code (`UNIQUE`) |
| `pin_hash` | `String` | Server-peppered Bcrypt hash |
| `download_count` | `Number` | Number of downloads |
| `status` | `String` | `active` \| `deleted` |
| `created_at` | `Date` | Creation timestamp |
| `last_accessed_at` | `Date` | Timestamp of most recent download |

### 3. `access_logs` Collection
| Field | Type | Description |
|---|---|---|
| `id` | `String` (UUID) | Audit log record ID |
| `transfer_id` | `String` | Associated transfer ID |
| `action` | `String` | `VERIFY_SUCCESS` \| `VERIFY_FAILED` \| `DOWNLOAD_PRESIGNED_ISSUED` |
| `ip_hash` | `String` | Truncated SHA-256 hash of requester IP |
| `user_agent` | `String` | Truncated browser User-Agent |
| `created_at` | `Date` | Event timestamp |

### 4. `transfer_security_trackings` Collection
| Field | Type | Description |
|---|---|---|
| `transfer_code` | `String` | Unique transfer code identifier |
| `failed_attempts` | `Number` | Failed verification attempts counter |
| `last_attempt_at` | `Date` | Timestamp of last attempt |
| `locked_until` | `Date` | Timestamp when brute-force lockout expires |

---

## 🚀 API Endpoints

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/api/health` | Health check & MongoDB liveness ping | 150 req / 15 min |
| `POST` | `/api/files/upload` | Multipart file upload (generates code + PIN) | 30 req / hour |
| `GET` | `/api/transfers/:transferCode` | Fetch safe metadata (no secrets exposed) | 150 req / 15 min |
| `POST` | `/api/transfers/verify` | Verify transfer code + PIN with lockout protection | 10 req / 15 min |
| `POST` | `/api/transfers/:transferCode/download` | Generate authenticated 60s download URL | 10 req / 15 min |
| `GET` | `/api/files/download/:token` | Stream file content using verified token | 60 req / 15 min |

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [Git](https://git-scm.com/)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/secure-file-exchange.git
cd secure-file-exchange

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment
Create `backend/.env` (or copy from `backend/.env.example`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5001
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/file_exchange?retryWrites=true&w=majority
STORAGE_DRIVER=local
PIN_PEPPER=your_random_cryptographic_pepper_here
```

### 3. Start Development Server
From the root directory, run both Frontend and Backend concurrently:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)

---

## 🧪 Testing

Run the automated integration test suite:
```bash
cd backend
npm test
```

All 7 integration tests run against an isolated in-memory MongoDB server:
- `✓ GET /api/health` — Database health check
- `✓ POST /api/files/upload` — Secure file upload & credential generation
- `✓ GET /api/transfers/:code` — Safe metadata retrieval
- `✓ POST /api/transfers/verify (bad PIN)` — 401 Unauthorized rejection
- `✓ POST /api/transfers/verify (valid PIN)` — 200 OK verification
- `✓ POST /api/transfers/:code/download` — Download link generation & file download
- `✓ Brute-Force Lockout` — 429 Rate Limit Lockout after 5 failed attempts

---

## 📦 Production Deployment

### Option A: Deploy to Vercel (Recommended — Unified Frontend & API)

This project is configured out of the box for **Vercel** with a unified monorepo configuration:
- Frontend static assets are built to `frontend/dist`.
- Serverless API routes under `/api/*` run through `api/index.js` with cached MongoDB Atlas connections and GridFS file streaming.

1. Push your repository to GitHub.
2. Import repository in [Vercel](https://vercel.com/).
3. Add the following **Environment Variables** in Vercel project settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `STORAGE_DRIVER`: `gridfs`
   - `PIN_PEPPER`: Any strong random secret string.
   - `NODE_ENV`: `production`
4. Click **Deploy**. Vercel will build both the frontend and backend automatically.

### Option B: Deploy to Cloud Web Services (Render / Railway / VPS / Docker)
- **Backend**:
  - Build command: `npm install && npm run build`
  - Start command: `node dist/server.js`
  - Set Environment Variables: `MONGODB_URI`, `STORAGE_DRIVER=gridfs`, `PORT`, `NODE_ENV=production`, `CORS_ORIGIN=https://your-frontend-domain.com`, `PIN_PEPPER=random_secret`
- **Frontend**:
  - Build command: `npm install && npm run build`
  - Output directory: `dist/`
  - Set `VITE_API_URL` to point to your backend service.

---

## 🛡️ Security Best Practices Implemented

1. **Defense-in-Depth PIN Security**: PINs are never stored in plaintext. They are hashed using `bcrypt` with work factor 10 + server-side secret pepper.
2. **Brute-Force Lockout**: 5 failed PIN attempts lock the transfer code for 15 minutes to prevent automated dictionary attacks.
3. **Short-Lived Download Links**: Download tokens expire within 60 seconds of issuance.
4. **Path Traversal Protection**: Uploaded filenames are sanitized and stored under random cryptographic keys.
5. **Rate-Limiting**: IP-based throttling on all sensitive endpoints prevents denial-of-service and credential stuffing.
6. **Zero Leaked Secrets**: Metadata endpoints strictly filter out PIN hashes, internal IDs, and storage paths.

---

## 📄 License
ISC © Student Engineering Team — Cloud Computing Project, 2026
