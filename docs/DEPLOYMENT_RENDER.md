# 🚀 Deploying AICTE SATYAPAN on Render

This guide outlines how to deploy both the **Backend API** and **Frontend Web Application** on [Render](https://render.com) with full support for Tesseract OCR, PyPDFium2, encrypted storage, and client-side routing.

---

## Architecture Overview

```
[ Visitor Browser ]
        │
        ├─── HTTPS ───> [ Render Static Site: satyapan-frontend ]
        │               (React 18 + Vite SPA, HTML/JS/CSS assets)
        │
        └─── HTTPS ───> [ Render Web Service: satyapan-backend ]
                        (Docker container: Python 3.11, FastAPI, Tesseract OCR, SQLite)
```

---

## Method 1: Automated Blueprint Deployment (Recommended — 2 Clicks)

Render supports automated infrastructure-as-code via the included [`render.yaml`](../render.yaml).

1. Push this repository to your **GitHub** account.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **"New +"** in the top navigation bar and select **"Blueprint"**.
4. Connect your GitHub repository (`SIH-SATYAPAN`).
5. Render reads `render.yaml` and will automatically configure:
   - **`satyapan-backend`**: Docker Web Service running on Python 3.11 with system Tesseract OCR dependencies.
   - **`satyapan-frontend`**: Static Site running Vite build with automated SPA rewrite rules (`/*` -> `/index.html`) and automatic linking to the backend host.
6. Click **"Apply"** and wait for the builds to finish!

---

## Method 2: Manual Dashboard Deployment (Step-by-Step)

If you prefer deploying services individually through the Render Web UI:

### Step A: Deploy the Backend API Service

1. On the Render Dashboard, click **"New +"** > **"Web Service"**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `satyapan-backend` (or your choice)
   - **Region**: Any (e.g. `Oregon (US West)` or `Singapore`)
   - **Branch**: `master` or `main`
   - **Runtime**: Select **`Docker`** *(Essential so Tesseract OCR and PyPDFium2 C-libraries install properly)*
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: **Free**
4. Under **"Environment Variables"**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `DEMO_MODE` | `true` | Enables pre-seeded demo applications and 10s demo reset |
   | `SECRET_KEY` | *(Click "Generate")* | Cryptographic JWT signing key |
   | `AES_STORAGE_KEY_HEX` | `a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0` | 256-bit vault storage key |
5. Click **"Create Web Service"**.
6. Once deployed, copy your backend URL (e.g., `https://satyapan-backend.onrender.com`).
7. Verify it is running by opening:
   ```text
   https://satyapan-backend.onrender.com/demo/health
   ```
   You should see `"status": "HEALTHY"` and 5 green ticks.

---

### Step B: Deploy the Frontend Static Site

1. On the Render Dashboard, click **"New +"** > **"Static Site"**.
2. Connect the same GitHub repository.
3. Configure the build settings:
   - **Name**: `satyapan-frontend`
   - **Branch**: `master` or `main`
   - **Root Directory**: Leave blank (or `frontend`)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Under **"Environment Variables"**, add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://satyapan-backend.onrender.com` | **Paste your backend URL from Step A (without trailing slash)** |
5. Under **"Redirects / Rewrites"**, add a rewrite rule so React Router works on page reload:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **"Create Static Site"**.

---

## Verification & Sanity Checklist

Once both services show **Live**:

1. Open your frontend URL: `https://satyapan-frontend.onrender.com`
2. Test the **Demo Health Check**: `https://satyapan-frontend.onrender.com/demo/health`
3. Click any **Quick-Fill** role on the login screen:
   - **Institute Faculty**: `faculty@mit.edu` / `password`
   - **Official Scrutiny**: `scrutiny@aicte.gov.in` / `password`
4. Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to test the Command Palette.
5. All CORS origins matching `https://*.onrender.com` are authorized automatically in `backend/app/main.py`.

---

> [!NOTE]
> On Render's Free Tier, services spin down after 15 minutes of inactivity. When accessed again, the first request may take 30–50 seconds to warm up the container.
