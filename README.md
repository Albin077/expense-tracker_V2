# ⌘ FINOVA — Localhost Development Environment

This branch (`localhost`) is dedicated to running **FINOVA** entirely in a local development setup.

It connects:

Browser (localhost:5500)  
⬇  
FastAPI Backend (127.0.0.1:8000)  
⬇  
Supabase PostgreSQL (Transaction Pooler – Port 6543)

Supabase is used for:
- Authentication (JWT verification)
- PostgreSQL database
- Storage (avatars)
- Row Level Security (RLS)

---

## 🧠 Local Architecture

```
Browser (5500)
   ↓
FastAPI (8000)
   ↓
Supabase DB (Pooler 6543)
```

---

# 🏗 Backend Setup (EXP_backend)

## 1️⃣ Create Virtual Environment

```bash
cd EXP_backend
python -m venv .venv
.venv\Scripts\activate
```

## 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

## 3️⃣ Configure Environment Variables

Create a `.env` file inside `EXP_backend/`

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

⚠️ Important:
- Use **Transaction Pooler (port 6543)**
- Copy the full connection string directly from:
  Supabase → Settings → Database → Connection String → Pooler
- Do NOT manually type the password.

---

## 4️⃣ Start FastAPI

```bash
uvicorn app.main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

# 🌐 Frontend Setup (EXP_frontend)

Inside:

```
EXP_frontend/js/supabaseClient.js
```

Ensure API is pointing to local backend:

```javascript
const API = "http://127.0.0.1:8000";
```

---

## Start Local Static Server

From inside `EXP_frontend/`:

```bash
python -m http.server 5500
```

Frontend runs at:

```
http://localhost:5500
```

---

# 🔐 FastAPI CORS Configuration

Ensure backend includes:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Restart FastAPI after changes.

---

# 🔑 Supabase Dashboard Configuration (Local Auth)

Go to:

Supabase → Authentication → URL Configuration

Set:

## Site URL
```
http://localhost:5500
```

## Redirect URLs
```
http://localhost:5500
http://localhost:5500/login.html
```

---

# 📂 Branch Strategy

## `localhost`
- Local FastAPI backend
- Supabase Transaction Pooler (6543)
- Used for development & debugging
- Safe database testing

## `production`
- Configured for deployed backend
- Configured for deployed frontend
- Uses production domain URLs
- Deployment-ready environment

Switch branches:

```bash
git checkout localhost
```

or

```bash
git checkout production
```

---

# 🧪 Troubleshooting

## 500 Internal Server Error
Check FastAPI terminal logs.

## CORS Error
Ensure `allow_origins` matches frontend origin exactly.

## SASL Authentication Failed
Re-copy pooler connection string from Supabase.

## Connection Timeout
Ensure port 6543 is used (NOT 5432).

---

# 🎯 Purpose of This Branch

This branch guarantees:

- Stable local development
- Clear separation from production
- Safe database testing
- Independent deployment pipeline

---

**FINOVA — Build. Test. Scale.**