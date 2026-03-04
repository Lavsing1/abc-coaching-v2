const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, param, query, validationResult } = require('express-validator');
const { User, Test, Note, ExternalTest, Result } = require('../models');
const { authenticate, adminOnly } = require('../middleware/auth');
const { cloudinary, makeUpload } = require('../config/cloudinary');

router.use(authenticate, adminOnly);

const ok = (req, res) => { const e = validationResult(req); if (!e.isEmpty()) { res.status(400).json({ error: e.array()[0].msg }); return false; } return true; };
const pg = (q) => ({ page: Math.max(1, parseInt(q.page)||1), limit: Math.min(50, parseInt(q.limit)||20) });

// ═══════════════ STUDENTS ═════════════════════════════════════════════════════

router.get('/students', async (req, res) => {
  const { page, limit } = pg(req.query);
  const filter = { role: 'student' };
  if (req.query.class) filter.class = parseInt(req.query.class);
  if (req.query.search) filter.$or = [
    { name:     { $regex: req.query.search, $options: 'i' } },
    { username: { $regex: req.query.search, $options: 'i' } },
  ];
  const [students, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ students, total, page, totalPages: Math.ceil(total/limit) });
});

router.post('/students',
  body('name').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('username').trim().notEmpty().matches(/^[a-zA-Z0-9_-]+$/).isLength({ max: 50 }),
  body('password').isLength({ min: 6, max: 64 }),
  body('class').isInt({ min: 9, max: 12 }),
  async (req, res) => {
    if (!ok(req, res)) return;
    const { name, username, password, class: cls } = req.body;
    if (await User.findOne({ username: username.toLowerCase() }))
      return res.status(409).json({ error: 'Username already taken' });
    const student = await User.create({ name, username, password_hash: password, role: 'student', class: parseInt(cls) });
    res.status(201).json({ student });
  }
);

router.put('/students/:id',
  param('id').isMongoId(),
  async (req, res) => {
    if (!ok(req, res)) return;
    const { name, class: cls, password } = req.body;
    const upd = {};
    if (name) upd.name = name;
    if (cls)  upd.class = parseInt(cls);
    if (password) upd.password_hash = await bcrypt.hash(password, 12);
    const student = await User.findByIdAndUpdate(req.params.id, upd, { new: true });
    if (!student) return res.status(404).json({ error: 'Not found' });
    res.json({ student });
  }
);

router.patch('/students/:id/toggle', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  const s = await User.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  s.hidden = !s.hidden;
  await s.save();
  res.json({ hidden: s.hidden });
});

router.delete('/students/:id', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  await User.findByIdAndDelete(req.params.id);
  await Result.deleteMany({ student: req.params.id });
  res.json({ ok: true });
});

// ═══════════════ TESTS ════════════════════════════════════════════════════════

router.get('/tests', async (req, res) => {
  const { page, limit } = pg(req.query);
  const filter = {};
  if (req.query.class) filter.class = parseInt(req.query.class);
  const [tests, total] = await Promise.all([
    Test.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
    Test.countDocuments(filter),
  ]);
  res.json({ tests, total, page, totalPages: Math.ceil(total/limit) });
});

router.get('/tests/:id', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  const t = await Test.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json({ test: t });
});

router.post('/tests',
  body('name').trim().notEmpty(),
  body('class').isInt({ min: 9, max: 12 }),
  body('subject').trim().notEmpty(),
  body('duration').isInt({ min: 1, max: 300 }),
  body('questions').isArray({ min: 1 }),
  async (req, res) => {
    if (!ok(req, res)) return;
    for (const q of req.body.questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4)
        return res.status(400).json({ error: 'Each question needs text and 4 options' });
      if (q.answer < 0 || q.answer > 3)
        return res.status(400).json({ error: 'answer must be 0-3' });
    }
    const test = await Test.create({ ...req.body, class: parseInt(req.body.class), duration: parseInt(req.body.duration) });
    res.status(201).json({ test });
  }
);

router.put('/tests/:id', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!test) return res.status(404).json({ error: 'Not found' });
  res.json({ test });
});

router.patch('/tests/:id/toggle', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  const t = await Test.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  t.hidden = !t.hidden;
  await t.save();
  res.json({ hidden: t.hidden });
});

router.delete('/tests/:id', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  await Test.findByIdAndDelete(req.params.id);
  await Result.deleteMany({ test: req.params.id });
  res.json({ ok: true });
});

// ═══════════════ NOTES ════════════════════════════════════════════════════════

const uploadNote = makeUpload('notes');

router.get('/notes', async (req, res) => {
  const { page, limit } = pg(req.query);
  const filter = {};
  if (req.query.class) filter.class = parseInt(req.query.class);
  const [notes, total] = await Promise.all([
    Note.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
    Note.countDocuments(filter),
  ]);
  res.json({ notes, total, page, totalPages: Math.ceil(total/limit) });
});

router.post('/notes', uploadNote.single('file'), async (req, res) => {
  const { title, class: cls, subject, type, description, url } = req.body;
  if (!title || !cls || !subject || !type) return res.status(400).json({ error: 'Missing required fields' });

  let file_url = url || '';
  let public_id;
  if (req.file) {
    file_url = req.file.path;
    public_id = req.file.filename;
  }
  if (!file_url) return res.status(400).json({ error: 'File or URL required' });

  const note = await Note.create({ title, class: parseInt(cls), subject, type, file_url, public_id, description });
  res.status(201).json({ note });
});

router.put('/notes/:id', param('id').isMongoId(), uploadNote.single('file'), async (req, res) => {
  if (!ok(req, res)) return;
  const { title, class: cls, subject, description } = req.body;
  const upd = {};
  if (title)       upd.title = title;
  if (cls)         upd.class = parseInt(cls);
  if (subject)     upd.subject = subject;
  if (description) upd.description = description;
  if (req.file)  { upd.file_url = req.file.path; upd.public_id = req.file.filename; }
  const note = await Note.findByIdAndUpdate(req.params.id, upd, { new: true });
  if (!note) return res.status(404).json({ error: 'Not found' });
  res.json({ note });
});

router.patch('/notes/:id/toggle', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  const n = await Note.findById(req.params.id);
  if (!n) return res.status(404).json({ error: 'Not found' });
  n.hidden = !n.hidden;
  await n.save();
  res.json({ hidden: n.hidden });
});

router.delete('/notes/:id', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ error: 'Not found' });
  if (note.public_id) {
    await cloudinary.uploader.destroy(note.public_id, { resource_type: 'raw' }).catch(() => {});
  }
  await note.deleteOne();
  res.json({ ok: true });
});

// ═══════════════ EXTERNAL TESTS ═══════════════════════════════════════════════

const uploadExt = makeUpload('external-tests');

router.get('/external-tests', async (req, res) => {
  const { page, limit } = pg(req.query);
  const filter = {};
  if (req.query.class) filter.class = parseInt(req.query.class);
  const [tests, total] = await Promise.all([
    ExternalTest.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
    ExternalTest.countDocuments(filter),
  ]);
  res.json({ tests, total, page, totalPages: Math.ceil(total/limit) });
});

router.post('/external-tests', uploadExt.single('file'), async (req, res) => {
  const { title, class: cls, type, description, url } = req.body;
  if (!title || !cls || !type) return res.status(400).json({ error: 'Missing required fields' });
  let finalUrl = url || '';
  let public_id;
  if (req.file) { finalUrl = req.file.path; public_id = req.file.filename; }
  if (!finalUrl) return res.status(400).json({ error: 'URL or file required' });
  const t = await ExternalTest.create({ title, class: parseInt(cls), type, url: finalUrl, public_id, description });
  res.status(201).json({ test: t });
});

router.patch('/external-tests/:id/toggle', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  const t = await ExternalTest.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  t.hidden = !t.hidden;
  await t.save();
  res.json({ hidden: t.hidden });
});

router.delete('/external-tests/:id', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  const t = await ExternalTest.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.public_id) await cloudinary.uploader.destroy(t.public_id, { resource_type: 'raw' }).catch(() => {});
  await t.deleteOne();
  res.json({ ok: true });
});

// ═══════════════ RESULTS ══════════════════════════════════════════════════════

router.get('/results', async (req, res) => {
  const { page, limit } = pg(req.query);
  const filter = {};
  if (req.query.class) {
    const studentIds = await User.find({ role: 'student', class: parseInt(req.query.class) }).distinct('_id');
    filter.student = { $in: studentIds };
  }
  const [results, total] = await Promise.all([
    Result.find(filter).populate('student','name username class').populate('test','name subject').sort({ submittedAt: -1 }).skip((page-1)*limit).limit(limit),
    Result.countDocuments(filter),
  ]);
  res.json({ results, total, page, totalPages: Math.ceil(total/limit) });
});

router.delete('/results/:id', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  await Result.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ═══════════════ STATS ════════════════════════════════════════════════════════

router.get('/stats', async (req, res) => {
  const [students, tests, notes, extTests, results, classCounts] = await Promise.all([
    User.countDocuments({ role: 'student', hidden: false }),
    Test.countDocuments(),
    Note.countDocuments(),
    ExternalTest.countDocuments(),
    Result.countDocuments(),
    User.aggregate([{ $match: { role: 'student' } }, { $group: { _id: '$class', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
  ]);
  res.json({ students, tests, notes, extTests, results, classCounts });
});

module.exports = router;
