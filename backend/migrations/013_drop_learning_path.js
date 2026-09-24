exports.shorthands = undefined;

// Learning Paths (grouping courses by category) removed as a concept
// entirely — the product direction is a flat course list, no path layer.
exports.up = (pgm) => {
  pgm.dropColumn('courses', 'learning_path');
};

exports.down = (pgm) => {
  pgm.addColumn('courses', {
    learning_path: { type: 'varchar(150)', notNull: true, default: 'General' },
  });
};
