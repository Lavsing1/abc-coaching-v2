const router = require('express').Router();

router.get('/info', (_, res) => res.json({
  name: 'ABC Coaching Center',
  tagline: 'Empowering Students from Class 9 to 12',
  description: 'Premier coaching institute offering quality education with free tests and study materials for classes 9–12.',
  features: [
    { emoji: '📚', title: 'Free Study Notes',    desc: 'Comprehensive notes for every subject and chapter' },
    { emoji: '📝', title: 'Practice Tests',       desc: 'Chapter-wise tests with instant score analysis' },
    { emoji: '🏆', title: 'Track Progress',       desc: 'Detailed performance history and improvement insights' },
    { emoji: '📋', title: 'External Resources',   desc: 'Google Forms, PDF exams, and more' },
  ],
  contact: { phone: '+91 98765 43210', email: 'info@abccoaching.in', address: '42 Education Lane, Knowledge City – 400001' },
}));

module.exports = router;
