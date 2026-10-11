exports.shorthands = undefined;

// Supports lessons whose content is hand-coded in the frontend (e.g. an
// interactive replica of a real app screen with tappable hotspots) rather
// than authored through the Lesson Builder, and lessons that only apply to
// specific sales roles (e.g. a "TSM Dashboard" lesson a Sales Officer never
// sees). Both are general-purpose — adding a new hardcoded or role-specific
// lesson later never needs another migration, just a new row + a new
// frontend component + a new backend hotspot registry entry.
exports.up = (pgm) => {
  pgm.addColumn('lessons', {
    // Empty array = visible to every role (the existing default behavior).
    // Non-empty = only learners whose sales_role is in this list see it.
    applicable_roles: { type: 'text[]', notNull: true, default: '{}' },
    // 'blocks' = built in the Lesson Builder (today's default, unchanged).
    // 'hardcoded' = content lives in frontend code; exempt from the
    // "needs a graded check block" publish requirement, since its own
    // completion rule (all hotspots explored) is defined in code instead.
    content_type: { type: 'varchar(20)', notNull: true, default: 'blocks' },
    // Identifies which hardcoded frontend component/backend hotspot
    // registry entry this lesson maps to, e.g. 'SO_DASHBOARD'. Required
    // when content_type = 'hardcoded', unused otherwise.
    hardcoded_key: { type: 'varchar(100)' },
  });

  pgm.addConstraint('lessons', 'lessons_content_type_check', {
    check: "content_type IN ('blocks', 'hardcoded')",
  });

  pgm.createTable('lesson_hotspot_progress', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    assignment_id: { type: 'uuid', notNull: true, references: 'course_assignments', onDelete: 'CASCADE' },
    lesson_id: { type: 'uuid', notNull: true, references: 'lessons', onDelete: 'CASCADE' },
    // Matches an id in that lesson's hardcoded hotspot registry entry —
    // not a foreign key, since hotspots aren't rows in any table.
    hotspot_id: { type: 'varchar(100)', notNull: true },
    explored_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('lesson_hotspot_progress', 'lesson_hotspot_progress_unique', {
    unique: ['assignment_id', 'lesson_id', 'hotspot_id'],
  });
  pgm.createIndex('lesson_hotspot_progress', 'assignment_id');
  pgm.createIndex('lesson_hotspot_progress', 'lesson_id');
};

exports.down = (pgm) => {
  pgm.dropTable('lesson_hotspot_progress');
  pgm.dropConstraint('lessons', 'lessons_content_type_check');
  pgm.dropColumn('lessons', ['applicable_roles', 'content_type', 'hardcoded_key']);
};
