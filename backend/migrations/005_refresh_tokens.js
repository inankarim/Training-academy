exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('refresh_tokens', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },

    // We store a hash of the refresh token, never the raw token — if the DB
    // were ever read (backup leak, etc.), stored tokens can't be replayed.
    token_hash: { type: 'text', notNull: true },

    expires_at: { type: 'timestamptz', notNull: true },
    revoked_at: { type: 'timestamptz' },
    revoked_reason: { type: 'varchar(100)' }, // 'logout' | 'password_change' | 'deactivated' | 'refresh_rotation'

    created_by_ip: { type: 'varchar(45)' },
    user_agent: { type: 'text' },

    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('refresh_tokens', 'user_id');
  pgm.createIndex('refresh_tokens', 'expires_at');
  // Fast lookup during refresh: "give me this user's active, unexpired tokens."
  pgm.sql(
    'CREATE INDEX refresh_tokens_active_idx ON refresh_tokens (user_id) WHERE revoked_at IS NULL;',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('refresh_tokens');
};
