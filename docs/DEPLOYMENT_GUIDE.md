# Deployment Guide — SecureDrop Cloud

This guide provides step-by-step instructions to deploy **SecureDrop Cloud** (React Vite Frontend + Node.js/Express Backend + MongoDB Atlas with GridFS file storage) to **Vercel** or any cloud platform, and push to **GitHub**.

---

## 1. MongoDB Atlas Setup (Cloud Database & Storage)

SecureDrop Cloud uses MongoDB Atlas for both document metadata and file storage (MongoDB GridFS), eliminating any need for complex cloud storage buckets.

1. Sign up / Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create an **M0 Free Cluster** (in your preferred region, e.g., Mumbai `ap-south-1` or `us-east-1`).
3. Under **Security → Database Access**:
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Set Built-in Role to **Read and write to any database**.
4. Under **Security → Network Access**:
   - Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Under **Deployment → Database**:
   - Click **Connect** → **Drivers (Node.js)**.
   - Copy your connection string:
     ```env
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/file_exchange?retryWrites=true&w=majority
     ```

---

## 2. Deploy to Vercel (Unified Frontend + Serverless Backend)

This repository includes a pre-configured `vercel.json` and serverless API gateway (`api/index.js`). The entire application (both Vite React frontend and Express backend) can be deployed in a **single Vercel project**.

### Step 1: Push Project to GitHub

If you haven't pushed this folder to GitHub yet:
```bash
# Navigate to the project root
cd "untitled folder"

# Initialize git (if not already done)
git init
git add .
git commit -m "feat: complete SecureDrop Cloud with MongoDB Atlas and Vercel support"

# Push to your GitHub repo
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

*(Note: Sensitive files such as `backend/.env` are automatically ignored by `.gitignore` and won't be pushed.)*

### Step 2: Import into Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New... → Project**.
2. Select your imported GitHub repository.
3. Configure Project Settings:
   - **Framework Preset**: Other (or Vite)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run vercel-build` (or leave default defined in `vercel.json`)
   - **Output Directory**: `frontend/dist` (pre-configured in `vercel.json`)

### Step 3: Add Environment Variables in Vercel

Under **Environment Variables**, add the following:

| Key | Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.../file_exchange?retryWrites=true&w=majority` | Your MongoDB Atlas connection URI |
| `STORAGE_DRIVER` | `gridfs` | Enables MongoDB GridFS storage for serverless |
| `PIN_PEPPER` | `any_strong_random_secret_string_here` | Secret pepper for bcrypt PIN hashing |
| `NODE_ENV` | `production` | Production environment flag |
| `MAX_FILE_SIZE_MB` | `25` | Maximum upload size |
| `PRESIGNED_URL_EXPIRY_SECONDS` | `300` | Download token validity (seconds) |

### Step 4: Deploy

Click **Deploy**! Once deployment finishes:
- Frontend will be served at `https://<your-project>.vercel.app`
- API routes will be handled at `https://<your-project>.vercel.app/api/*`
- Health check: `https://<your-project>.vercel.app/api/health`

---

## 3. Alternative: Two-Service Deployment (Frontend on Vercel + Backend on Render/Railway)

If you prefer hosting the backend as a traditional persistent 24/7 Node server:

### Backend on Render.com:
1. Create a **New Web Service** on Render.
2. Root directory: `backend`
3. Build command: `npm install && npm run build`
4. Start command: `node dist/server.js`
5. Add Environment Variables: `MONGODB_URI`, `STORAGE_DRIVER=gridfs`, `PIN_PEPPER`, `CORS_ORIGIN=https://<your-frontend>.vercel.app`

### Frontend on Vercel:
1. Set Root Directory: `frontend`
2. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-render-backend-url>.onrender.com`
3. Deploy!

---

## 4. Local Development Verification

```bash
# 1. Install all dependencies
npm install

# 2. Run test suite
npm test

# 3. Start local development (both servers)
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001/api`
