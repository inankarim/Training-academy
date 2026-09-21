exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('roles', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(50)', notNull: true, unique: true },
    description: { type: 'text' },
    // System roles (super_admin, admin, hr, content_creator, learner) can't
    // be deleted or renamed from the admin UI — only their permission set
    // can be adjusted. Prevents an admin from accidentally locking everyone
    // out by renaming/removing a role the system depends on.
    is_system_role: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('roles', 'set_roles_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'set_updated_at',
    level: 'ROW',
  });

  pgm.createTable('permissions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    // Dot-namespaced key, e.g. "courses.create", "users.deactivate" — the
    // convention every future module's permission checks will follow.
    key: { type: 'varchar(100)', notNull: true, unique: true },
    // Groups permissions for the future "manage role permissions" admin UI,
    // e.g. "courses", "users", "analytics".
    module: { type: 'varchar(50)', notNull: true },
    description: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('permissions', 'module');

  pgm.createTable('role_permissions', {
    role_id: {
      type: 'uuid',
      notNull: true,
      references: 'roles',
      onDelete: 'CASCADE',
    },
    permission_id: {
      type: 'uuid',
      notNull: true,
      references: 'permissions',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint('role_permissions', 'role_permissions_pkey', {
    primaryKey: ['role_id', 'permission_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('role_permissions');
  pgm.dropTable('permissions');
  pgm.dropTable('roles');
};
