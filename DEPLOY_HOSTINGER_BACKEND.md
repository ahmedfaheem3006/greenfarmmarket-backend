# 🚀 Hostinger Node.js Managed Deployment Guide - Green Farm Market Backend

This document contains the complete, step-by-step production configuration and architecture guide for deploying the **Green Farm Market Backend API** to **Hostinger Business Web Hosting** using Hostinger's managed **Node.js Web App**.

---

## 🏗️ Production Architecture Overview

```
GitHub main branch
        ↓
GitHub Actions CI (.github/workflows/backend-production.yml)
  ├── 1. Checkout main
  ├── 2. Setup Node.js 20
  ├── 3. Install Dependencies (npm ci)
  ├── 4. Validate Prisma Schema (npx prisma validate)
  ├── 5. Generate Prisma Client (npx prisma generate)
  ├── 6. Ephemeral MySQL 8 Migration Verification (npx prisma migrate deploy)
  ├── 7. TypeScript Compilation (npm run build)
  ├── 8. Run Automated Tests (npm test --if-present)
  └── 9. Verify dist/server.js
        ↓ (Only if ALL CI checks pass)
Promote exact commit to hostinger-production branch
        ↓
Hostinger GitHub Integration
        ↓
Hostinger Automatic Node.js Deployment (npm run hostinger:build -> npm start)
```

---

## ⚙️ Hostinger Web App Settings (hPanel)

Configure your Node.js Web App in Hostinger hPanel with the following exact parameters:

| Configuration Field | Required Production Value |
| :--- | :--- |
| **Application Type** | **Node.js Web App** |
| **Domain / Subdomain** | `https://api.greenfarmmarket.com` |
| **Git Repository** | `ahmedfaheem3006/greenfarmmarket-backend` |
| **Git Target Branch** | **`hostinger-production`** *(NOT main)* |
| **Node.js Version** | **`20.x`** |
| **Application Root** | `./` |
| **Build Command** | **`npm run hostinger:build`** |
| **Start Command** | **`npm start`** |
| **Entry Point File** | **`dist/server.js`** |

---

## 🗄️ Hostinger Production Database & Environment Configuration

Set the following environment variables inside **Hostinger hPanel → Node.js Web App → Environment Variables**:

### Production Database Details (Hostinger MySQL)
- **Database Name**: `u952187388_greenfarm`
- **Database User**: `u952187388_greenfarm_user`
- **Database Host**: `localhost`
- **Database Port**: `3306`

### Production `DATABASE_URL` Structure
```text
mysql://u952187388_greenfarm_user:<URL_ENCODED_PASSWORD>@localhost:3306/u952187388_greenfarm
```

> ⚠️ **CRITICAL SECURITY NOTICE**:
> - The real database password **belongs ONLY inside Hostinger hPanel Environment Variables**.
> - **NEVER** commit the real database password to GitHub, `.env.example`, source code, or documentation.

> 🔤 **SPECIAL CHARACTER URL ENCODING RULE**:
> Because passwords frequently contain special characters, you **MUST** URL-encode special characters when constructing the `DATABASE_URL`:
> - `@` → `%40`
> - `#` → `%23`
> - `$` → `%24`
> - `:` → `%3A`
> - `/` → `%2F`
> - `?` → `%3F`

---

## 🔑 Complete Hostinger Environment Variables List

| Variable Name | Description / Format | Example Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Application Environment | `production` |
| `FRONTEND_URL` | Primary Frontend Web Origin | `https://greenfarmmarket.com` |
| `DATABASE_URL` | Managed Hostinger MySQL Connection URL | `mysql://u952187388_greenfarm_user:<URL_ENCODED_PASSWORD>@localhost:3306/u952187388_greenfarm` |
| `JWT_ACCESS_SECRET` | Production JWT Access Token Secret | `[Your_Strong_Random_Access_Secret]` |
| `JWT_REFRESH_SECRET` | Production JWT Refresh Token Secret | `[Your_Strong_Random_Refresh_Secret]` |
| `JWT_ACCESS_EXPIRATION` | Access Token Expiration | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh Token Expiration | `7d` |
| `UPLOAD_DIR` | Media Upload Directory | `uploads` |
| `AI_API_URL` | AI Service Base URL | `https://api.greenfarm-ai.example.com/v1` |
| `AI_API_KEY` | AI Service API Key | `[Your_Production_AI_API_Key]` |

> ⚠️ **CRITICAL NOTE ON PORT**:
> Do **NOT** set `PORT=5000` in Hostinger environment variables. Hostinger automatically assigns `process.env.PORT` dynamically. The application falls back to `3000` locally.

---

## 🔄 Automated Deployment Sequence (`hostinger:build`)

Hostinger executes the build command defined in `package.json`:

```bash
npm run hostinger:build
```

Which executes:
1. `prisma generate`: Generates Prisma Client.
2. `tsc`: Compiles TypeScript source to `dist/`.
3. `prisma migrate deploy`: Safely applies pending schema migrations to the **REAL Hostinger production MySQL database** (`u952187388_greenfarm`).

After `hostinger:build` completes, Hostinger starts the server using:

```bash
npm start  # Runs: node dist/server.js
```

---

## 🩺 Health Check & Verification

Once deployed, verify API operational status:

- **Health Endpoint**: `https://api.greenfarmmarket.com/api/health`
- **Expected Response (HTTP 200)**:
```json
{
  "status": "OK",
  "app": "Green Farm Market API",
  "environment": "production",
  "database": "CONNECTED",
  "timestamp": "2026-08-12T15:00:00.000Z"
}
```
