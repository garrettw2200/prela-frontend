# Frontend Deployment Guide - Railway

**Target:** `dashboard.prela.dev`
**Platform:** Railway (nginx serving static Vite build)
**Backend API:** `https://api.prela.dev/api/v1`

---

## Prerequisites

Before deploying, you need:

1. **Clerk Publishable Key** - From https://dashboard.clerk.com
   - Go to your Prela app → API Keys
   - Copy the **Publishable key** (starts with `pk_test_` or `pk_live_`)

2. **Railway Account** - Same project as backend: https://railway.com/project/a1cfc0a4-cfcc-469a-9333-d856e0bc8812

3. **DNS Access** - To configure `dashboard.prela.dev` (Cloudflare)

---

## Step 1: Create Frontend Service in Railway (5 min)

1. Open Railway project: https://railway.com/project/a1cfc0a4-cfcc-469a-9333-d856e0bc8812
2. Click **"+ New"** → **"GitHub Repo"**
3. Select the `prela` repository
4. Set **Root Directory:** `frontend`
5. Name the service: `prela-dashboard`

---

## Step 2: Set Environment Variables (5 min)

Go to the service → **Variables** tab → Add these:

```
VITE_API_BASE_URL=https://api.prela.dev/api/v1
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_CLERK_KEY
```

**Important:** These are build-time variables. They get baked into the JS bundle during build.

---

## Step 3: Deploy (5-10 min)

Railway will automatically:
1. Detect the `Dockerfile` in the `frontend/` directory
2. Run `npm ci` and `npm run build` (multi-stage build)
3. Serve the `dist/` output via nginx
4. Assign a Railway URL (e.g., `prela-dashboard-production.up.railway.app`)

Watch the **Logs** tab for build progress.

---

## Step 4: Configure Custom Domain (10-30 min)

### In Railway:
1. Click on the dashboard service → **Settings** → **Networking**
2. Click **"+ Custom Domain"**
3. Enter: `dashboard.prela.dev`
4. Railway will provide DNS instructions (CNAME record)

### In Cloudflare (or your DNS provider):
1. Add a CNAME record:
   - **Type:** CNAME
   - **Name:** dashboard
   - **Target:** `prela-dashboard-production.up.railway.app` (from Railway)
   - **Proxy:** DNS only (grey cloud) or Proxied (orange cloud)
   - **TTL:** Auto

### Verify:
```bash
# Check DNS propagation (may take 5-60 minutes)
dig dashboard.prela.dev

# Test the site
curl -I https://dashboard.prela.dev
```

---

## Step 5: Update Backend CORS (5 min)

The backend needs to allow requests from `dashboard.prela.dev`.

1. Go to the **API Gateway** service in Railway
2. Go to **Variables** tab
3. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=["https://dashboard.prela.dev","http://localhost:3000","http://localhost:5173"]
   ```
4. Also update the **Ingest Gateway** service with the same `CORS_ORIGINS`
5. Both services will auto-redeploy

---

## Step 6: Update Clerk Allowed Origins (5 min)

1. Go to https://dashboard.clerk.com → Your Prela app
2. Go to **Domains** or **Allowed Origins**
3. Add `https://dashboard.prela.dev` to the allowed origins
4. This ensures Clerk auth works from the production domain

---

## Step 7: Verify Deployment (5 min)

```bash
# Frontend loads
curl -I https://dashboard.prela.dev
# Expected: 200 OK

# SPA routing works (should return index.html for any path)
curl -I https://dashboard.prela.dev/sign-in
# Expected: 200 OK

# API reachable from frontend domain (CORS)
curl -X OPTIONS https://api.prela.dev/api/v1/health \
  -H "Origin: https://dashboard.prela.dev" \
  -H "Access-Control-Request-Method: GET" -I
# Expected: 200 with Access-Control-Allow-Origin header
```

---

## Troubleshooting

### Build Fails
- Check Railway build logs
- Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set (build will fail without it)
- Ensure `VITE_API_BASE_URL` is set correctly

### White Screen / App Won't Load
- Check browser console for errors
- Verify Clerk publishable key is correct and matches your Clerk app
- Verify the Clerk app has `dashboard.prela.dev` in allowed origins

### CORS Errors
- Verify `CORS_ORIGINS` includes `https://dashboard.prela.dev` in both API Gateway and Ingest Gateway
- Redeploy backend services after updating CORS

### Authentication Not Working
- Verify Clerk publishable key matches between frontend and backend
- Check that Clerk JWKS URL is correct in API Gateway env vars
- Verify Clerk app domain settings include `dashboard.prela.dev`

---

## Architecture

```
User → dashboard.prela.dev (Railway/nginx)
         ↓ (API calls with Clerk JWT)
       api.prela.dev (Railway/FastAPI)
         ↓
       ClickHouse (traces) + PostgreSQL (users) + Redis (cache)
```

The frontend is a static SPA served by nginx. All API calls go to `api.prela.dev` with Clerk JWT tokens for authentication.
