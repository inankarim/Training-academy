/* eslint-disable @typescript-eslint/no-var-requires */
exports.shorthands = undefined;

exports.up = (pgm) => {
  // Needed for gen_random_uuid() (primary keys) and crypt()/gen_salt() used
  // once, below, purely to seed the bootstrap Super Admin's temp password.
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  // Every table with an `updated_at` column uses this trigger so callers
  // never have to remember to set it manually.
  pgm.createFunction(
    'set_updated_at',
    [],
    { returns: 'trigger', language: 'plpgsql', replace: true },
    `
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    `,
  );
};

exports.down = (pgm) => {
  pgm.dropFunction('set_updated_at', []);
  pgm.dropExtension('pgcrypto');
};
