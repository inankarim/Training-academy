exports.shorthands = undefined;

// Permission keys are namespaced "module.action" — the module groups them
// for a future "manage role permissions" screen; the action is what the
// RBAC middleware actually checks against a user's role.
const PERMISSIONS = [
  // users
  ['users.view', 'users', 'View user accounts'],
  ['users.create', 'users', 'Create new user accounts'],
  ['users.update', 'users', 'Edit user account details'],
  ['users.deactivate', 'users', 'Deactivate or reactivate a user account'],
  ['users.manage_staff_roles', 'users', 'Create/edit Admin, HR, and Content Creator accounts (Super Admin only)'],
  // roles
  ['roles.manage', 'roles', 'Edit which permissions each role has'],
  // courses / lessons / quizzes (content)
  ['courses.view', 'courses', 'View courses'],
  ['courses.create', 'courses', 'Create courses'],
  ['courses.update', 'courses', 'Edit course details'],
  ['courses.publish', 'courses', 'Publish or archive a course'],
  ['courses.delete', 'courses', 'Delete a course'],
  ['lessons.create', 'lessons', 'Create/edit lesson content'],
  ['lessons.update', 'lessons', 'Edit lesson content'],
  ['lessons.delete', 'lessons', 'Delete a lesson'],
  ['quizzes.create', 'quizzes', 'Create quizzes and question banks'],
  ['quizzes.update', 'quizzes', 'Edit quizzes'],
  ['quizzes.delete', 'quizzes', 'Delete quizzes'],
  // products
  ['products.view', 'products', 'View products'],
  ['products.create', 'products', 'Create products'],
  ['products.update', 'products', 'Edit products'],
  ['products.delete', 'products', 'Delete products'],
  // assignments
  ['assignments.view', 'assignments', 'View training assignments'],
  ['assignments.create', 'assignments', 'Assign training to users/groups'],
  // gamification / certificates / announcements
  ['gamification.manage', 'gamification', 'Manage badges, reward rules, award bonus XP'],
  ['certificates.view', 'certificates', 'View issued certificates'],
  ['certificates.manage', 'certificates', 'Manage certificate templates/requirements'],
  ['announcements.create', 'announcements', 'Create announcements'],
  // analytics / hr
  ['analytics.view_admin', 'analytics', 'View system/course analytics'],
  ['analytics.view_hr', 'analytics', 'View HR analytics dashboards'],
  ['hr.view_employees', 'hr', "View employee profiles and learning history"],
  ['hr.export_reports', 'hr', 'Export HR reports'],
  // settings
  ['settings.manage', 'settings', 'Manage system settings'],
];

const ROLE_PERMISSIONS = {
  super_admin: PERMISSIONS.map((p) => p[0]), // everything
  admin: [
    'users.view', 'users.create', 'users.update', 'users.deactivate',
    'courses.view', 'courses.create', 'courses.update', 'courses.publish', 'courses.delete',
    'lessons.create', 'lessons.update', 'lessons.delete',
    'quizzes.create', 'quizzes.update', 'quizzes.delete',
    'products.view', 'products.create', 'products.update', 'products.delete',
    'assignments.view', 'assignments.create',
    'gamification.manage', 'certificates.view', 'certificates.manage', 'announcements.create',
    'analytics.view_admin',
    // Deliberately NOT included: users.manage_staff_roles, roles.manage,
    // settings.manage — reserved for Super Admin per the original brief.
  ],
  hr: [
    'users.view',
    'courses.view',
    'certificates.view',
    'analytics.view_hr',
    'hr.view_employees',
    'hr.export_reports',
  ],
  content_creator: [
    'courses.view', 'courses.update',
    'lessons.create', 'lessons.update', 'lessons.delete',
    'quizzes.create', 'quizzes.update', 'quizzes.delete',
    // Deliberately NOT included: courses.create/publish/delete, users.*,
    // products.*, analytics.* — a content creator builds lesson material
    // inside courses an Admin has already set up, nothing beyond that.
  ],
  learner: [], // learner-side access is ownership-based (own progress, own profile), not permission-key based
};

exports.up = async (pgm) => {
  // --- Roles ---
  const roleRows = [
    ['super_admin', 'Full control over the entire platform, including managing Admin/HR/Content Creator accounts.'],
    ['admin', 'Manages the training platform: courses, lessons, quizzes, products, assignments, learner accounts.'],
    ['hr', 'Monitors employee learning progress and performance. Read-only — no content-building access.'],
    ['content_creator', 'Builds lesson content (videos, PDFs, rich text, knowledge checks) inside courses set up by Admin.'],
    ['learner', 'Employee completing training.'],
  ];

  for (const [name, description] of roleRows) {
    pgm.sql(
      `INSERT INTO roles (name, description, is_system_role) VALUES ('${name}', '${description.replace(/'/g, "''")}', true);`,
    );
  }

  // --- Permissions ---
  for (const [key, module, description] of PERMISSIONS) {
    pgm.sql(
      `INSERT INTO permissions (key, module, description) VALUES ('${key}', '${module}', '${description.replace(/'/g, "''")}');`,
    );
  }

  // --- Role -> Permission mapping ---
  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    for (const key of permissionKeys) {
      pgm.sql(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p
        WHERE r.name = '${roleName}' AND p.key = '${key}';
      `);
    }
  }

  // --- Bootstrap Super Admin ---
  // Password hashed with pgcrypto's bcrypt (compatible with bcryptjs in the
  // app layer — same algorithm). must_change_password forces a real
  // password to be set on first login; this temp value should never be
  // used beyond that first login.
  pgm.sql(`
    INSERT INTO users (full_name, email, password_hash, role_id, status, must_change_password)
    SELECT 'System Super Admin', 'superadmin@holcimacademy.local',
           crypt('Holcim#SuperAdmin2026', gen_salt('bf', 12)),
           r.id, 'active', true
    FROM roles r WHERE r.name = 'super_admin';
  `);
};

exports.down = (pgm) => {
  pgm.sql("DELETE FROM users WHERE email = 'superadmin@holcimacademy.local';");
  pgm.sql('DELETE FROM role_permissions;');
  pgm.sql('DELETE FROM permissions;');
  pgm.sql('DELETE FROM roles;');
};
