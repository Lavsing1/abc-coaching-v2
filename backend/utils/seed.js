const bcrypt = require('bcryptjs');
const { User, Test, Note, ExternalTest, Result } = require('../models');

module.exports = async function seed() {
  // Admin
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    if (!process.env.ADMIN_USERNAME) {
      console.warn('⚠ No ADMIN_USERNAME in env — skipping admin creation');
    } else {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

await User.create({
  name: process.env.ADMIN_NAME || 'Admin',
  username: process.env.ADMIN_USERNAME,
  password_hash: hashed,
  role: 'admin',
});
      console.log('✅ Admin created:', process.env.ADMIN_USERNAME);
    }
  }

  // Only seed dummy data once
  const testExists = await Test.findOne({ name: '[DEMO] Science Basics' });
  if (testExists) return;

  // Dummy students
  await User.create([
    { name: 'Arjun Sharma',  username: 'arjun9',  password_hash: 'demo1234', role: 'student', class: 9 },
    { name: 'Priya Singh',   username: 'priya10', password_hash: 'demo1234', role: 'student', class: 10 },
    { name: 'Rahul Verma',   username: 'rahul11', password_hash: 'demo1234', role: 'student', class: 11 },
    { name: 'Sneha Gupta',   username: 'sneha12', password_hash: 'demo1234', role: 'student', class: 12 },
  ]);

  // Dummy tests
  const demoTests = await Test.create([
    {
      name: '[DEMO] Science Basics',
      class: 9, subject: 'Science', duration: 15,
      questions: [
        { question: 'What is the chemical formula of water?', options: ['H2O','CO2','NaCl','O2'], answer: 0, explanation: 'Water is H2O' },
        { question: 'Light travels at approximately?', options: ['3×10⁸ m/s','3×10⁶ m/s','3×10⁴ m/s','3×10¹⁰ m/s'], answer: 0, explanation: 'Speed of light is ~3×10⁸ m/s' },
        { question: 'Newton\'s first law is also called?', options: ['Law of inertia','Law of gravity','Law of motion','Law of force'], answer: 0 },
        { question: 'Plants prepare food through?', options: ['Photosynthesis','Respiration','Digestion','Osmosis'], answer: 0 },
        { question: 'The SI unit of force is?', options: ['Newton','Joule','Pascal','Watt'], answer: 0 },
      ],
    },
    {
      name: '[DEMO] Math MCQ',
      class: 10, subject: 'Mathematics', duration: 20,
      questions: [
        { question: 'Value of π (pi) approximately?', options: ['3.14','2.17','4.13','1.41'], answer: 0 },
        { question: 'Pythagoras theorem: a²+b²=?', options: ['c²','c','2c','c³'], answer: 0 },
        { question: '√144 =?', options: ['12','14','11','13'], answer: 0 },
        { question: 'Sum of angles in a triangle?', options: ['180°','360°','90°','270°'], answer: 0 },
        { question: 'Area of circle = ?', options: ['πr²','2πr','πd','r²'], answer: 0 },
      ],
    },
    {
      name: '[DEMO] Physics Mock Test',
      class: 11, subject: 'Physics', duration: 30,
      questions: [
        { question: 'Unit of electric current?', options: ['Ampere','Volt','Ohm','Watt'], answer: 0 },
        { question: 'Which law: V=IR?', options: ['Ohm\'s law','Faraday\'s law','Newton\'s law','Boyle\'s law'], answer: 0 },
        { question: 'Gravitational acceleration on Earth?', options: ['9.8 m/s²','8.9 m/s²','10.8 m/s²','9.0 m/s²'], answer: 0 },
      ],
    },
    {
      name: '[DEMO] Chemistry Basics',
      class: 12, subject: 'Chemistry', duration: 25,
      questions: [
        { question: 'Atomic number of Carbon?', options: ['6','8','12','4'], answer: 0 },
        { question: 'Chemical symbol for Gold?', options: ['Au','Ag','Fe','Cu'], answer: 0 },
        { question: 'pH of pure water?', options: ['7','0','14','1'], answer: 0 },
      ],
    },
  ]);

  // Dummy notes
  await Note.create([
    { title: '[DEMO] Chapter 1 - Motion Notes', class: 9,  subject: 'Science',     type: 'link', file_url: 'https://example.com/demo-notes', description: 'Demo science notes for class 9' },
    { title: '[DEMO] Algebra Formula Sheet',    class: 10, subject: 'Mathematics',  type: 'link', file_url: 'https://example.com/demo-algebra', description: 'Demo math formulas' },
    { title: '[DEMO] Organic Chemistry Notes',  class: 12, subject: 'Chemistry',    type: 'link', file_url: 'https://example.com/demo-chem', description: 'Demo chem notes' },
    { title: '[DEMO] Calculus Reference',       class: 11, subject: 'Mathematics',  type: 'text', file_url: 'Derivative of x^n = n*x^(n-1). Integral of x^n = x^(n+1)/(n+1) + C', description: 'Quick reference' },
  ]);

  // Dummy external tests
  await ExternalTest.create([
    { title: '[DEMO] Google Form Practice Test', class: 9,  type: 'googleform', url: 'https://forms.google.com/demo', description: 'Demo form test' },
    { title: '[DEMO] PDF Mock Exam Class 10',    class: 10, type: 'pdf',        url: 'https://example.com/mock.pdf', description: 'Demo PDF exam' },
  ]);

  // Dummy results (for demo students)
  const students = await User.find({ role: 'student' });
  const tests9 = demoTests.filter(t => t.class === 9);
  const tests10 = demoTests.filter(t => t.class === 10);
  if (students.length >= 2 && tests9.length && tests10.length) {
    await Result.create([
      { student: students[0]._id, test: tests9[0]._id, score: 80, totalQuestions: 5, correctAnswers: 4, timeTaken: 480 },
      { student: students[1]._id, test: tests10[0]._id, score: 60, totalQuestions: 5, correctAnswers: 3, timeTaken: 720 },
    ]).catch(() => {}); // ignore if already exists
  }

  console.log('✅ Dummy data seeded');
};
