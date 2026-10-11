exports.shorthands = undefined;

// Replaces the 5 combined HR regions with the 6 sales regions the business
// actually uses. Renaming in place (not delete+insert) keeps every existing
// area/territory/user FK pointed at the right region with no re-pointing
// needed. "South Bengal (Khulna/Barishal)" had no areas or users attached
// yet, so it's safe to rename to Khulna and add Barishal as a new row.
exports.up = (pgm) => {
  pgm.sql(`UPDATE regions SET name = 'Dhaka' WHERE name = 'Dhaka Region'`);
  pgm.sql(`UPDATE regions SET name = 'Cumilla' WHERE name = 'Chattogram Region'`);
  pgm.sql(`UPDATE regions SET name = 'Sylhet' WHERE name = 'Sylhet Region'`);
  pgm.sql(`UPDATE regions SET name = 'Rajshahi' WHERE name = 'North Bengal (Rajshahi/Rangpur)'`);
  pgm.sql(`UPDATE regions SET name = 'Khulna' WHERE name = 'South Bengal (Khulna/Barishal)'`);
  pgm.sql(`INSERT INTO regions (name) SELECT 'Barishal' WHERE NOT EXISTS (SELECT 1 FROM regions WHERE name = 'Barishal')`);
};

exports.down = (pgm) => {
  pgm.sql(`UPDATE regions SET name = 'Dhaka Region' WHERE name = 'Dhaka'`);
  pgm.sql(`UPDATE regions SET name = 'Chattogram Region' WHERE name = 'Cumilla'`);
  pgm.sql(`UPDATE regions SET name = 'Sylhet Region' WHERE name = 'Sylhet'`);
  pgm.sql(`UPDATE regions SET name = 'North Bengal (Rajshahi/Rangpur)' WHERE name = 'Rajshahi'`);
  pgm.sql(`UPDATE regions SET name = 'South Bengal (Khulna/Barishal)' WHERE name = 'Khulna'`);
  pgm.sql(`DELETE FROM regions WHERE name = 'Barishal'`);
};
