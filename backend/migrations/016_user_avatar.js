exports.shorthands = undefined;

// Profile photo. Like all other media it's stored on disk under /uploads and
// only referenced here by URL — never binary data in Postgres.
exports.up = (pgm) => {
  pgm.addColumn('users', { avatar_url: { type: 'text' } });
};

exports.down = (pgm) => {
  pgm.dropColumn('users', 'avatar_url');
};
