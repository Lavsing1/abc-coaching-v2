require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────────────────
// Helmet ko cross-origin requests allow karne ke liye configure kiya
app.use(helmet({ 
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

// CORS Configuration
app.use(cors({
  origin: [
    "https://abc-coaching-v2.vercel.app", 
    "http://127.0.0.1:5500", 
    "http://localhost:5500"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options('*', cors());

// Rate Limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
}));

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many login attempts' },
}));

// Parsers & Logging
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/student',       require('./routes/student'));
app.use('/api/public',        require('./routes/public'));

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date() }));

// ── 404 / Error ───────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Pehle Server Start karo, phir Database connect karo
app.listen(PORT, async () => {
  console.log(`🚀 API is running on port :${PORT}`);
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Seed database only after connection is successful
    if (require('./utils/seed')) {
      await require('./utils/seed')();
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Yahan humne jaan bujh kar process.exit(1) nahi lagaya hai
    // Taaki server chalta rahe aur Vercel ko proper JSON error (with CORS) mile
  }
});
