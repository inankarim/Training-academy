exports.shorthands = undefined;

// A learner gets one final-quiz attempt per assignment. After a fail, HR can
// grant further attempts one at a time; each grant increments this counter.
// Allowed attempts = 1 + final_quiz_extra_attempts.
exports.up = (pgm) => {
  pgm.addColumn('course_assignments', {
    final_quiz_extra_attempts: { type: 'integer', notNull: true, default: 0 },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('course_assignments', 'final_quiz_extra_attempts');
};
