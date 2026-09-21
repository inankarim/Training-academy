exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },

    employee_id: { type: 'varchar(50)', unique: true }, // company employee ID, optional
    full_name: { type: 'varchar(150)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },

    role_id: { type: 'uuid', notNull: true, references: 'roles', onDelete: 'RESTRICT' },

    // Designation (SO/TSM/TSE, etc.) is deliberately separate from role_id:
    // it drives training assignment/content targeting, never permissions.
    // Free text for now so new designations don't require a migration —
    // becomes a proper lookup table if/when it needs its own metadata.
    designation: { type: 'varchar(50)' },

    department_id: { type: 'uuid', references: 'departments', onDelete: 'SET NULL' },
    region_id: { type: 'uuid', references: 'regions', onDelete: 'SET NULL' },

    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'active',
      check: "status IN ('active', 'deactivated')",
    },

    must_change_password: { type: 'boolean', notNull: true, default: true },

    last_login_at: { type: 'timestamptz' },

    // Every user (except the very first bootstrap Super Admin) was created
    // by someone — this is the audit trail's anchor point.
    created_by: { type: 'uuid', references: 'users', onDelete: 'SET NULL' },

    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('users', 'set_users_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'set_updated_at',
    level: 'ROW',
  });

  pgm.createIndex('users', 'role_id');
  pgm.createIndex('users', 'status');
  pgm.createIndex('users', 'department_id');
  pgm.createIndex('users', 'region_id');
  // Case-insensitive email lookups on every login — this index makes that fast.
  pgm.sql('CREATE UNIQUE INDEX users_email_lower_idx ON users (LOWER(email));');
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
