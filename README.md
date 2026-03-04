# ABC Coaching Center v2 — Complete Production App

## Project Structure

```
abc-coaching-v2/
├── backend/
│   ├── server.js               # Express entry point
│   ├── package.json
│   ├── .env.example            # Copy → .env and fill values
│   ├── models/
│   │   └── index.js            # All Mongoose models
│   ├── middleware/
│   │   └── auth.js             # JWT + role guards
│   ├── config/
│   │   └── cloudinary.js       # File upload config
│   ├── routes/
│   │   ├── auth.js             # POST /login, GET /me
│   │   ├── admin.js            # Full CRUD (admin only)
│   │   ├── student.js          # Student APIs
│   │   └── public.js           # Landing page info
│   └── utils/
│       └── seed.js             # Creates admin + dummy data
└── frontend/
    └── index.html              # Complete SPA (no build needed)
```

---

## Database Collections

| Collection    | Fields |
|---------------|--------|
| users         | name, username, password_hash, role, class, hidden |
| tests         | name, class, subject, duration, questions[], hidden |
| notes         | title, class, subject, type, file_url, hidden |
| external_tests| title, class, type, url, hidden |
| results       | student, test, score, correctAnswers, answers[], timeTaken |

---

## Step-by-Step Deployment

### 1. Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- Render.com or Railway for backend
- Netlify or Vercel for frontend

### 2. MongoDB Atlas Setup
1. https://cloud.mongodb.com → New Cluster (free M0)
2. Database Access → Add User with password
3. Network Access → Allow `0.0.0.0/0`
4. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/abc-coaching`

### 3. Cloudinary Setup
1. https://cloudinary.com → Sign up free
2. Dashboard → copy Cloud Name, API Key, API Secret

### 4. Backend on Render.com

1. Push `backend/` to GitHub
2. Render → New Web Service → Connect repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Environment Variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=7d
ADMIN_NAME=Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecureAdminPass!123
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://your-app.netlify.app
```

6. Deploy → Note your backend URL: `https://abc-backend.onrender.com`

> ⚠️ After first deploy, **delete** `ADMIN_NAME`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` from env vars.

### 5. Frontend on Netlify

1. Open `frontend/index.html`
2. Find this line near `<script>` tag:
   ```javascript
   const API = window.__API_URL__ || 'http://localhost:5000/api';
   ```
3. Replace with your actual backend URL:
   ```javascript
   const API = 'https://abc-backend.onrender.com/api';
   ```
4. Netlify → Sites → Drag & drop the `frontend/` folder
5. Done!

---

## Demo Credentials (created by seed)

| Role    | Username | Password   |
|---------|----------|------------|
| Admin   | admin    | (from env) |
| Student | arjun9   | demo1234   |
| Student | priya10  | demo1234   |
| Student | rahul11  | demo1234   |
| Student | sneha12  | demo1234   |

> Delete demo accounts and data from Admin panel before going live.

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcrypt (12 rounds) |
| Authentication | JWT Bearer tokens (7-day expiry) |
| Admin isolation | `adminOnly` middleware on ALL `/api/admin/*` routes |
| Student isolation | `studentOnly` middleware, class-filtered queries |
| Score calculation | 100% server-side — answer keys never sent to browser |
| One attempt only | MongoDB unique index on `{student, test}` |
| Rate limiting | 200 req/15min global, 15 req/15min on /auth |
| Security headers | Helmet.js |
| Input validation | express-validator on all routes |
| CORS | Locked to FRONTEND_URL |
| XSS | Input escaping via express-validator |
| File uploads | MIME type validation, 25MB limit, Cloudinary |

---

## Admin Panel Features

### Students
- ✅ Create student with name, username, password, class
- ✅ Edit name, class, password
- ✅ Hide/Unhide toggle
- ✅ Delete (also deletes results)
- ✅ Filter by class + search by name/username
- ✅ Pagination

### MCQ Tests
- ✅ Create test with name, class, subject, duration
- ✅ Add unlimited questions with 4 options each
- ✅ Mark correct answer with radio button
- ✅ Optional explanation per question
- ✅ Edit tests (full question editor)
- ✅ Hide/Unhide toggle
- ✅ Delete test (also deletes results)
- ✅ Filter by class + pagination

### External Tests
- ✅ Add Google Form links
- ✅ Upload PDF files
- ✅ Add image-based tests
- ✅ Add external URLs
- ✅ Class assignment
- ✅ Hide/Unhide toggle
- ✅ Delete

### Study Notes
- ✅ Upload PDF files
- ✅ Add text notes (inline)
- ✅ Add image notes
- ✅ Add Google Form links
- ✅ Add external URLs
- ✅ Hide/Unhide toggle
- ✅ Edit
- ✅ Delete (also removes from Cloudinary)

### Results
- ✅ View all results
- ✅ Filter by class
- ✅ Delete results
- ✅ Pagination

---

## Student Features

- ✅ See only class-specific tests, notes, external tests
- ✅ Attempt tests with countdown timer
- ✅ Question navigation panel
- ✅ Submit once only (enforced server-side)
- ✅ View score with color coding
- ✅ Review each answer with correct/wrong highlighting
- ✅ View/download study notes
- ✅ Open external tests
- ✅ Personal result history
- ✅ Dashboard with stats

---

## Customization

### Change coaching name/contact info
Edit `backend/routes/public.js` — update the info object.

### Add more subjects
No changes needed — subject is a free-text field.

### Change demo data
Edit `backend/utils/seed.js` before first deploy.
