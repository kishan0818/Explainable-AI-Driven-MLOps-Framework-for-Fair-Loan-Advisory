# Deployment Guide

This guide details how to deploy the TWXAI system using Docker.

## 📋 Prerequisites

- **Docker Desktop** installed and running.
- **Git** installed.
- **Environment Variables** (See `.env.example`).

---

## 🛠️ Local Deployment (Docker)

1. **Clone the Repository**

   ```bash
   git clone <repo-url>
   cd TWXAI-Complete-Project
   ```

2. **Configure Environment**
   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

   **Important:** Update the values in `.env` with your real credentials (Supabase, ReCAPTCHA, etc.).

3. **Build and Run**

   ```bash
   docker-compose up --build
   ```

   - This builds the `backend` image (Python 3.9) and `frontend` image (Node 18).
   - It starts them in a shared network `twxai-network`.

4. **Access the Application**
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)
   - **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

5. **Stop the System**

   ```bash
   docker-compose down
   ```

---

## ☁️ Cloud Deployment

### Option A: Render / Railway (PaaS)

These platforms support Dockerfile-based deployments from a Git repo.

**Backend Service:**

1. Create a **Web Service**.
2. Connect your Git repo.
3. Root Directory: `TWXAI_backend`.
4. Build Command: (Handled by Dockerfile automatically if selected, or use `pip install -r requirements.txt`).
5. Start Command: `uvicorn fastapi_backend:app --host 0.0.0.0 --port $PORT`.
6. Add Environment Variables from `.env`.

**Frontend Service:**

1. Create a **Web Service** (or Static Site if exporting, but Next.js SSR requires Node).
2. Connect your Git repo.
3. Root Directory: `.` (Root).
4. Build Command: `npm install && npm run build`.
5. Start Command: `npm start`.
6. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed Backend Service.

### Option B: AWS EC2 / VM

1. Provision an EC2 instance (Ubuntu).
2. Install Docker & Docker Compose.
3. Clone repo and setup `.env`.
4. Run `docker-compose up -d --build`.
5. Configure Security Groups (Firewall) to allow ports 3000 and 8000 (or use Nginx as reverse proxy to 80/443).

---

## ❓ Troubleshooting

**1. "Connection Refused" between Frontend and Backend**

- If running in Docker, ensure they are on the same network.
- Browser-side calls use `NEXT_PUBLIC_API_URL`. Ensure this points to a URL accessible **from your browser** (e.g., `localhost` for local, `https://api.yourdomain.com` for prod).

**2. "Module not found" in Backend**

- Ensure `requirements.txt` is updated.
- Rebuild container: `docker-compose build --no-cache backend`.

**3. Database Connection Fails**

- Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`.
- Ensure your IP is whitelisted in Supabase if you have IP restrictions enabled.
