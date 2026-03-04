const router = require('express').Router();
const { param, validationResult } = require('express-validator');
const { Test, Note, ExternalTest, Result } = require('../models');
const { authenticate, studentOnly } = require('../middleware/auth');

router.use(authenticate, studentOnly);

const ok = (req, res) => { const e = validationResult(req); if (!e.isEmpty()) { res.status(400).json({ error: e.array()[0].msg }); return false; } return true; };

const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Tests for my class
router.get('/tests', async (req, res) => {
  const tests = await Test.find({ class: req.user.class, hidden: false }).sort({ createdAt: -1 });
  const attempted = await Result.find({ student: req.user._id }).distinct('test');
  const attemptedSet = new Set(attempted.map(String));
  res.json({ tests: tests.map(t => ({ _id: t._id, name: t.name, subject: t.subject, duration: t.duration, class: t.class, questionCount: t.questions.length, attempted: attemptedSet.has(String(t._id)), createdAt: t.createdAt })) });
});

// Start test (no answers)
router.get('/tests/:id/start', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  if (await Result.findOne({ student: req.user._id, test: req.params.id }))
    return res.status(409).json({ error: 'Already attempted', alreadyDone: true });

  const test = await Test.findOne({ _id: req.params.id, class: req.user.class, hidden: false });
  if (!test) return res.status(404).json({ error: 'Test not found' });

  // Send questions without shuffling
const shuffledQs = test.questions.map(q => ({
  _id: q._id,
  question: q.question,
  options: q.options
}));

  res.json({ test: { _id: test._id, name: test.name, subject: test.subject, duration: test.duration, questions: shuffledQs } });
});

// Submit test
router.post('/tests/:id/submit', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  if (await Result.findOne({ student: req.user._id, test: req.params.id }))
    return res.status(409).json({ error: 'Already submitted' });

  const test = await Test.findOne({ _id: req.params.id, class: req.user.class, hidden: false });
  if (!test) return res.status(404).json({ error: 'Test not found' });

  const { answers = [], timeTaken } = req.body;
  const answerMap = {};
  for (const a of answers) answerMap[a.questionId] = a.selected;

  // Score server-side — compare against ORIGINAL answer indices
  let correct = 0;
  const detail = test.questions.map(q => {
    // answers submitted by client use reshuffled indices, so we need to compare
    // against the original. But since we shuffled server-side without storing mapping,
    // we score against the submitted option TEXT matching correct option TEXT.
    const selectedIdx = answerMap[String(q._id)] ?? -1;
    // We can't reliably map shuffled option → original answer without a session.
    // Production solution: store shuffled mapping in Redis/DB per session.
    // For this implementation: compare selected to original answer index directly.
    // (In real deploy, add session-based shuffle storage.)
    const isCorrect = selectedIdx === q.answer;
    if (isCorrect) correct++;
    return { questionId: String(q._id), selected: selectedIdx, correct: isCorrect };
  });

  const score = Math.round((correct / test.questions.length) * 100);
  const result = await Result.create({
    student: req.user._id, test: test._id,
    score, totalQuestions: test.questions.length, correctAnswers: correct,
    timeTaken: typeof timeTaken === 'number' ? timeTaken : null,
    answers: detail,
  });
  res.json({ result: { _id: result._id, score, totalQuestions: result.totalQuestions, correctAnswers: correct, submittedAt: result.submittedAt } });
});

// My results
router.get('/results', async (req, res) => {
  const results = await Result.find({ student: req.user._id }).populate('test','name subject class').sort({ submittedAt: -1 });
  res.json({ results });
});

// Result detail with review
router.get('/results/:id', param('id').isMongoId(), async (req, res) => {
  if (!ok(req, res)) return;
  const result = await Result.findOne({ _id: req.params.id, student: req.user._id }).populate('test');
  if (!result) return res.status(404).json({ error: 'Not found' });

  const review = result.test.questions.map(q => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.answer,
    selectedAnswer: result.answers.find(a => a.questionId === String(q._id))?.selected ?? -1,
    isCorrect: result.answers.find(a => a.questionId === String(q._id))?.correct ?? false,
    explanation: q.explanation || null,
  }));

  res.json({ result: { _id: result._id, score: result.score, totalQuestions: result.totalQuestions, correctAnswers: result.correctAnswers, timeTaken: result.timeTaken, submittedAt: result.submittedAt, test: { name: result.test.name, subject: result.test.subject } }, review });
});

// Notes for my class
router.get('/notes', async (req, res) => {
  const notes = await Note.find({ class: req.user.class, hidden: false }).sort({ createdAt: -1 });
  res.json({ notes });
});

// External tests for my class
router.get('/external-tests', async (req, res) => {
  const tests = await ExternalTest.find({ class: req.user.class, hidden: false }).sort({ createdAt: -1 });
  res.json({ tests });
});

// Profile
router.get('/profile', (req, res) => res.json({ user: { id: req.user._id, name: req.user.name, username: req.user.username, class: req.user.class } }));

module.exports = router;
