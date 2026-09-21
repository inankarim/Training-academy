exports.shorthands = undefined;

// HR onboards employees in practice, so they need to create/edit learner
// accounts. Deliberately NOT granted: users.deactivate (a more destructive
// action, kept Admin/Super Admin-only) and users.manage_staff_roles (HR can
// never create Admin/HR/Content Creator accounts — Super Admin only). The
// user-service layer additionally enforces that HR can only assign the
// 'learner' role when creating a user, regardless of this permission grant.
const GRANTS = ['users.create', 'users.update'];

exports.up = (pgm) => {
  for (const key of GRANTS) {
    pgm.sql(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'hr' AND p.key = '${key}'
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    `);
  }
};

exports.down = (pgm) => {
  for (const key of GRANTS) {
    pgm.sql(`
      DELETE FROM role_permissions
      WHERE role_id = (SELECT id FROM roles WHERE name = 'hr')
        AND permission_id = (SELECT id FROM permissions WHERE key = '${key}');
    `);
  }
};
