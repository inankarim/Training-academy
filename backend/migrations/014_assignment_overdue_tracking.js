exports.shorthands = undefined;

// Adds the tracking needed to lock a learner out of an overdue assignment
// exactly once, and to notify HR/Admin/Super Admin exactly once per lapse.
// overdue_notified_at doubles as: (a) the idempotency guard for the
// notification sweep, and (b) a quick way to tell "flipped to overdue but
// nobody's re-assigned it yet" apart from a still-active assignment.
exports.up = (pgm) => {
  pgm.addColumn('course_assignments', {
    overdue_notified_at: { type: 'timestamptz' },
  });

  pgm.dropConstraint('course_assignments', 'course_assignments_status_check');
  pgm.addConstraint('course_assignments', 'course_assignments_status_check', {
    check: "status IN ('assigned', 'in_progress', 'completed', 'overdue')",
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('course_assignments', 'course_assignments_status_check');
  pgm.addConstraint('course_assignments', 'course_assignments_status_check', {
    check: "status IN ('assigned', 'in_progress', 'completed')",
  });
  pgm.dropColumn('course_assignments', 'overdue_notified_at');
};
