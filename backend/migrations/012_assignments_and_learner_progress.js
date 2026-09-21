exports.shorthands = undefined;

// Stage 4: HR course assignment + learner-side progress/points tracking.
//
// Deliberately no unique constraint on (course_id, assigned_to) in
// course_assignments — the same learner can be assigned the same course more
// than once by design (explicit product requirement), and each assignment
// gets its own independent progress trail via learner_lesson_progress.
exports.up = (pgm) => {
  pgm.createTable('course_assignments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    course_id: { type: 'uuid', notNull: true, references: 'courses', onDelete: 'CASCADE' },
    assigned_to: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    assigned_by: { type: 'uuid', notNull: true, references: 'users', onDelete: 'RESTRICT' },
    due_date: { type: 'date', notNull: true },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'assigned',
      check: "status IN ('assigned', 'in_progress', 'completed')",
    },
    assigned_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    completed_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('course_assignments', 'set_course_assignments_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'set_updated_at',
    level: 'ROW',
  });

  pgm.createIndex('course_assignments', 'assigned_to');
  pgm.createIndex('course_assignments', 'course_id');
  pgm.createIndex('course_assignments', 'status');

  pgm.createTable('learner_lesson_progress', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    assignment_id: { type: 'uuid', notNull: true, references: 'course_assignments', onDelete: 'CASCADE' },
    lesson_id: { type: 'uuid', notNull: true, references: 'lessons', onDelete: 'CASCADE' },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'not_started',
      check: "status IN ('not_started', 'in_progress', 'completed')",
    },
    started_at: { type: 'timestamptz' },
    completed_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('learner_lesson_progress', 'set_learner_lesson_progress_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'set_updated_at',
    level: 'ROW',
  });

  pgm.createIndex('learner_lesson_progress', 'assignment_id');
  pgm.createIndex('learner_lesson_progress', 'lesson_id');
  pgm.addConstraint('learner_lesson_progress', 'learner_lesson_progress_unique_per_assignment', {
    unique: ['assignment_id', 'lesson_id'],
  });

  pgm.createTable('learner_stats', {
    user_id: { type: 'uuid', primaryKey: true, references: 'users', onDelete: 'CASCADE' },
    total_xp: { type: 'integer', notNull: true, default: 0 },
    current_streak: { type: 'integer', notNull: true, default: 0 },
    last_activity_date: { type: 'date' },
    lessons_completed_count: { type: 'integer', notNull: true, default: 0 },
    courses_completed_count: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('learner_stats', 'set_learner_stats_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'set_updated_at',
    level: 'ROW',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('learner_stats');
  pgm.dropTable('learner_lesson_progress');
  pgm.dropTable('course_assignments');
};
