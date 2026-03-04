const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

// ── User ──────────────────────────────────────────────────────────────────────
const userSchema = new Schema({
  name:          { type: String, required: true, trim: true, maxlength: 100 },
  username:      { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 50 },
  password_hash: { type: String, required: true },
  role:          { type: String, enum: ['admin','student'], default: 'student' },
  class:         { type: Number, enum: [9,10,11,12] },
  hidden:        { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  if (!this.password_hash.startsWith('$2')) {
    this.password_hash = await bcrypt.hash(this.password_hash, 12);
  }
  next();
});

userSchema.methods.comparePassword = function(p) { return bcrypt.compare(p, this.password_hash); };
userSchema.methods.toJSON = function() { const o = this.toObject(); delete o.password_hash; return o; };

// ── Question sub-schema ───────────────────────────────────────────────────────
const questionSchema = new Schema({
  question:    { type: String, required: true },
  options:     { type: [String], validate: [a => a.length === 4, '4 options required'] },
  answer:      { type: Number, min: 0, max: 3 }, // 0-indexed
  explanation: String,
}, { _id: true });

// ── Test ──────────────────────────────────────────────────────────────────────
const testSchema = new Schema({
  name:      { type: String, required: true, trim: true },
  class:     { type: Number, required: true, enum: [9,10,11,12] },
  subject:   { type: String, required: true, trim: true },
  duration:  { type: Number, required: true, min: 1 },
  questions: [questionSchema],
  hidden:    { type: Boolean, default: false },
}, { timestamps: true });

testSchema.methods.toStudentJSON = function() {
  const o = this.toObject();
  o.questions = o.questions.map(q => ({ _id: q._id, question: q.question, options: q.options }));
  return o;
};

// ── Note ──────────────────────────────────────────────────────────────────────
const noteSchema = new Schema({
  title:    { type: String, required: true, trim: true },
  class:    { type: Number, required: true, enum: [9,10,11,12] },
  subject:  { type: String, required: true, trim: true },
  type:     { type: String, enum: ['pdf','text','image','googleform','link'], required: true },
  file_url: { type: String, required: true },
  public_id: String,
  description: String,
  hidden:   { type: Boolean, default: false },
}, { timestamps: true });

// ── External Test ─────────────────────────────────────────────────────────────
const externalTestSchema = new Schema({
  title:  { type: String, required: true, trim: true },
  class:  { type: Number, required: true, enum: [9,10,11,12] },
  type:   { type: String, enum: ['googleform','pdf','image','link'], required: true },
  url:    { type: String, required: true },
  public_id: String,
  description: String,
  hidden: { type: Boolean, default: false },
}, { timestamps: true });

// ── Result ────────────────────────────────────────────────────────────────────
const resultSchema = new Schema({
  student:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  test:            { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  score:           { type: Number, required: true },
  totalQuestions:  { type: Number, required: true },
  correctAnswers:  { type: Number, required: true },
  timeTaken:       Number,
  answers:         [{ questionId: String, selected: Number, correct: Boolean }],
  submittedAt:     { type: Date, default: Date.now },
});
resultSchema.index({ student: 1, test: 1 }, { unique: true });

module.exports = {
  User:         mongoose.model('User',         userSchema),
  Test:         mongoose.model('Test',         testSchema),
  Note:         mongoose.model('Note',         noteSchema),
  ExternalTest: mongoose.model('ExternalTest', externalTestSchema),
  Result:       mongoose.model('Result',       resultSchema),
};
