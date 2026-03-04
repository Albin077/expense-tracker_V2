# Expense Tracker – Production Deployment

## 🚀 Overview

This branch contains the **production-ready deployment setup** of the Expense Tracker application.

Architecture:

Frontend (Static HTML/CSS/JS)  
⬇  
FastAPI Backend (Uvicorn)  
⬇  
Supabase PostgreSQL Database  

---

## 🌐 Frontend Deployment (Netlify)

### Deploy Steps

1. Push this branch to GitHub.
2. Go to Netlify → Add New Site → Import from Git.
3. Select this repository.
4. Use the following settings:

- **Base directory:** (leave empty)
- **Publish directory:** `/`
- **Build command:** (leave empty)

### Important

- `index.html` must be in the root folder.
- Do NOT use `localhost` anywhere in production.
- All fetch URLs must point to your deployed backend API.

Example:

```js
const API = "https://your-backend-url.com";