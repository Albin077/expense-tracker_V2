# ⌘ FINOVA — Personal Finance Intelligence

A full-stack financial management ecosystem designed to provide granular control over your economic life. **FINOVA** combines a high-performance **FastAPI** backend with a modular, **Vanilla JavaScript** frontend, all secured and powered by **Supabase**.

---

## ✨ Features

* **Smart Authentication**: Secure sign-in and sign-up powered by **Supabase Auth**.
* **Persistent Login**: Automatically detects active browser sessions to bypass the login screen upon return.
* **Dual-Stream Tracking**: Granular tracking for **Expenses** (with categories/accounts) and **Income** (by source).
* **Universal Responsiveness**: "Mobile-First" architecture ensuring seamless alignment on smartphones and laptops.
* **Dynamic UI**: Includes a native **Dark Mode** toggle and real-time insight badges for spending trends.
* **Data Security**: Implements PostgreSQL **Row Level Security (RLS)** via Supabase.

---

## 🏗 System Architecture



### 1. Backend (EXP_backend)
Handles data aggregation, business logic, and secured API routing.
* Framework: FastAPI / Python.
* Modular Routes: Separate logic for auth, expenses, income, and analytics.
* Database: PostgreSQL hosted on Supabase.

### 2. Frontend (EXP_frontend)
A lightweight, modern workspace for managing records and viewing financial trends.
* Core: HTML5, CSS3, ES6+ JavaScript.
* State Management: Real-time communication via the Supabase client.
* Styling: Modular CSS including base.css for layout and darkMode.css for themes.

---

## 📂 Project Structure

### Backend Organization
EXP_backend/
├── app/
│   └── routes/         # API Endpoints (analytics.py, expenses.py, income.py)
├── db.py               # Database connection logic
├── main.py             # Application entry point
└── requirements.txt    # Python dependencies

### Frontend Organization
EXP_frontend/
├── css/                # base.css, darkMode.css, responsive.css, topnav.css
├── html/               # analytics.html, expenses.html, income.html, home.html, profile.html
├── js/                 # auth.js, expenses.js, income.js, supabaseClient.js, topnav.js
└── README.md           # Documentation

---

## 🚀 Setup & Installation

### 1. Backend Setup
Navigate to the backend directory, install dependencies, and launch the API server.

$cd EXP_backend$ pip install -r requirements.txt
$ uvicorn main:app --reload

### 2. Frontend Setup
1. Navigate to EXP_frontend/js/.
2. Open supabaseClient.js and provide your unique Supabase URL and Anon Key.
3. Launch the application by opening html/login.html in your browser.

---

## ⚙️ Logic & Session Flow

* Auto-Redirect: Upon launch, the system checks for a remembered session. If found, users are immediately moved to home.html.
* Dummy Mode: Users may bypass login to view a "dummy" dashboard but are restricted from saving data until authenticated.
* CRUD Operations: Full Create, Read, Update, and Delete functionality for all financial records across both Expense and Income modules.
* Data Isolation: Powered by Supabase RLS, ensuring users can only query data linked to their specific user_id.