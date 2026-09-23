# Expense Tracker – Production Deployment

## 📊 Web App

### Overview

Expense Tracker is a web application designed to help users **track, organize, and understand their day-to-day expenses**.

Users can freely add expenses with details such as the amount, category, description, and date. The application stores expense records and provides multiple insights to help users understand their spending patterns.

### Key Features

- Add and manage day-to-day expenses.
- Assign expenses to different categories.
- Add descriptions to individual expenses.
- View and manage recorded expenses.
- Analyze expenses over different time periods.
- View total spending for a specific category.
- View yearly expenses grouped by category.
- Identify categories with the highest spending.
- Analyze spending patterns over time.
- Generate useful summaries and insights from expense data.

### Example Insights

The application can provide insights such as:

- Total expenses for a particular year or time period.
- Total amount spent on a specific category.
- Which category has the highest expenses.
- Yearly expenses broken down by category.
- Spending for a particular category during a selected time period.
- Distribution of expenses across different categories.
- Changes in spending patterns over time.

### Architecture

Frontend (Static HTML/CSS/JS)
⬇
FastAPI Backend (Uvicorn)
⬇
Supabase PostgreSQL Database


---

# 🚀 Production Deployment

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

    const API = "https://your-backend-url.onrender.com";


---

## ⚙️ Backend Deployment (Render)

### Deploy Steps

1. Push this branch to GitHub.
2. Go to Render → New Web Service → Import from Git.
3. Select this repository.
4. Select the backend directory if the backend is inside a separate folder.
5. Use the following settings:

- **Runtime:** Python
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

6. Add the required environment variables in Render.
7. Click **Create Web Service**.
8. Wait for the deployment to complete.
9. Copy the deployed Render backend URL.
10. Update the frontend API URL with the deployed backend URL.


### Environment Variables

Add the following environment variables in Render:

    SUPABASE_URL=...
    SUPABASE_KEY=...
    DATABASE_URL=...
    SECRET_KEY=...
    JWT_SECRET=...

These values must be configured in Render and should not be committed to GitHub.


### Important

- Do NOT commit `.env` or `.env.local` files containing real credentials.
- Add production environment variables directly in Render.
- Do NOT use `localhost` anywhere in the production backend.
- The backend must listen on `0.0.0.0`.
- Use Render's `$PORT` for the application port.
- Make sure `requirements.txt` contains all required Python dependencies.
- Make sure `main.py` contains the FastAPI application instance referenced by `main:app`.
- Configure CORS to allow requests from the deployed Netlify frontend.
- Keep all production secrets out of the GitHub repository.


---

## 🗄️ Database (Supabase)

The application uses **Supabase PostgreSQL** as its production database.

The backend connects to Supabase using the environment variables configured in Render.

### Important

- Make sure the required database tables are available in Supabase.
- Keep database credentials and API keys private.
- Do NOT commit production credentials to GitHub.
- Configure the required database variables in Render.
- Do not expose Supabase service credentials in the frontend.


---

## 🔗 Production Architecture

Netlify
**Frontend (Static HTML/CSS/JS)**
⬇
Render
**FastAPI Backend (Uvicorn)**
⬇
Supabase
**PostgreSQL Database**


---

## 🔐 Security

- Never commit production credentials to GitHub.
- Never hard-code API keys, database credentials, or JWT secrets in the source code.
- Store production secrets in Render Environment Variables.
- Keep `.env` and `.env.local` excluded through `.gitignore`.
- Do not expose backend or database secrets in frontend code.


---

## ✅ Production Checklist

- [ ] Frontend pushed to GitHub
- [ ] Backend pushed to GitHub
- [ ] `index.html` is in the correct location
- [ ] `requirements.txt` is present
- [ ] Netlify site configured
- [ ] Render Web Service created
- [ ] Python runtime configured
- [ ] Build command configured
- [ ] Start command configured
- [ ] Render environment variables added
- [ ] Supabase database configured
- [ ] CORS configured for the Netlify frontend
- [ ] Backend deployed successfully
- [ ] Frontend API URL updated with the Render backend URL
- [ ] No production credentials committed to GitHub
