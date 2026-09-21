exports.shorthands = undefined;

// Course Builder Stage 1: relational identity/ownership/status for a course.
// The flexible content (banner, modules, lessons, final quiz) lives in
// MongoDB's course_content collection, keyed by this table's id — see
// backend/src/modules/courses/courseContent.model.ts.
exports.up = (pgm) => {
  pgm.createTable('courses', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },

    created_by: { type: 'uuid', notNull: true, references: 'users', onDelete: 'RESTRICT' },

    learning_path: { type: 'varchar(150)', notNull: true },
    name: { type: 'varchar(200)', notNull: true },
    description: { type: 'text' },

    difficulty: {
      type: 'varchar(20)',
      notNull: true,
      check: "difficulty IN ('beginner', 'intermediate', 'advanced')",
    },

    // Hours, e.g. 4.5
    estimated_duration: { type: 'numeric(6,2)', notNull: true },
    total_xp_reward: { type: 'integer', notNull: true },

    // Reference (URL/object key) to the banner asset — never binary data in Postgres.
    banner_ref: { type: 'text' },

    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'draft',
      check: "status IN ('draft', 'published', 'archived')",
    },

    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('courses', 'set_courses_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'set_updated_at',
    level: 'ROW',
  });

  pgm.createIndex('courses', 'created_by');
  pgm.createIndex('courses', 'status');
};

exports.down = (pgm) => {
  pgm.dropTable('courses');
};
