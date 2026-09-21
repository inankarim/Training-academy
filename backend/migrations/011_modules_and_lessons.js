exports.shorthands = undefined;

// Lesson Builder Stage 2: real Postgres identity for the Course -> Module ->
// Lesson hierarchy. Flexible per-lesson content (blocks) lives in MongoDB's
// lesson_content collection, keyed by this table's lesson id — see
// backend/src/modules/lessons/lessonContent.model.ts.
exports.up = (pgm) => {
  pgm.createTable('modules', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    course_id: { type: 'uuid', notNull: true, references: 'courses', onDelete: 'CASCADE' },
    title: { type: 'varchar(200)', notNull: true },
    sort_order: { type: 'integer', notNull: true, default: 1 },
    created_by: { type: 'uuid', notNull: true, references: 'users', onDelete: 'RESTRICT' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('modules', 'set_modules_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'set_updated_at',
    level: 'ROW',
  });

  pgm.createIndex('modules', 'course_id');

  pgm.createTable('lessons', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    course_id: { type: 'uuid', notNull: true, references: 'courses', onDelete: 'CASCADE' },
    module_id: { type: 'uuid', notNull: true, references: 'modules', onDelete: 'CASCADE' },
    title: { type: 'varchar(200)', notNull: true },
    description: { type: 'text' },
    sort_order: { type: 'integer', notNull: true, default: 1 },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'draft',
      check: "status IN ('draft', 'ready', 'published')",
    },
    created_by: { type: 'uuid', notNull: true, references: 'users', onDelete: 'RESTRICT' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('lessons', 'set_lessons_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'set_updated_at',
    level: 'ROW',
  });

  pgm.createIndex('lessons', 'course_id');
  pgm.createIndex('lessons', 'module_id');
  pgm.createIndex('lessons', 'status');
};

exports.down = (pgm) => {
  pgm.dropTable('lessons');
  pgm.dropTable('modules');
};
