const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const validate = (req, res) => {
  const e = validationResult(req);
  if (!e.isEmpty()) { res.status(400).json({ error: e.array()[0].msg }); return false; }
  return true;
};

// POST /api/auth/login
router.post('/login',
  body('username').trim().notEmpty().escape(),
  body('password').notEmpty().isLength({ max: 128 }),
  async (req, res) => {
    if (!validate(req, res)) return;
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase(), hidden: false });
    const valid = user ? await user.comparePassword(password) : false;
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    res.json({ token, user: { id: user._id, name: user.name, username: user.username, role: user.role, class: user.class } });
  }
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

module.exports = router;
