exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('audit_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },

    // Nullable: some events (a failed login with a bad email) have no
    // authenticated actor yet.
    actor_user_id: { type: 'uuid', references: 'users', onDelete: 'SET NULL' },

    // Namespaced action strings, e.g. "auth.login", "auth.login_failed",
    // "user.create", "user.deactivate", "user.reactivate", "auth.password_change".
    action: { type: 'varchar(100)', notNull: true },

    target_type: { type: 'varchar(50)' }, // e.g. "user"
    target_id: { type: 'uuid' },

    metadata: { type: 'jsonb' }, // free-form context, e.g. { "reason": "..." }
    ip_address: { type: 'varchar(45)' },
    user_agent: { type: 'text' },

    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('audit_logs', 'actor_user_id');
  pgm.createIndex('audit_logs', 'action');
  pgm.createIndex('audit_logs', ['target_type', 'target_id']);
  pgm.createIndex('audit_logs', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('audit_logs');
};
