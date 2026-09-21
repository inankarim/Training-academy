exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Create areas table
  pgm.createTable('areas', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    region_id: { type: 'uuid', references: 'regions', onDelete: 'SET NULL' },
    name: { type: 'varchar(100)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('areas', 'region_id');

  // 2. Create territories table
  pgm.createTable('territories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    area_id: { type: 'uuid', references: 'areas', onDelete: 'SET NULL' },
    name: { type: 'varchar(100)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('territories', 'area_id');

  // 3. Add columns to users table
  pgm.addColumns('users', {
    area_id: { type: 'uuid', references: 'areas', onDelete: 'SET NULL' },
    territory_id: { type: 'uuid', references: 'territories', onDelete: 'SET NULL' },
    employee_type: { type: 'varchar(50)', default: 'permanent' },
    sales_role: { type: 'varchar(20)' }, // 'SO', 'TSM', 'ASM', 'RSM', 'NON_SALES'
  });
  pgm.createIndex('users', 'area_id');
  pgm.createIndex('users', 'territory_id');
  pgm.createIndex('users', 'sales_role');

  // 4. Seed initial departments, regions, areas, and territories
  pgm.sql(`
    INSERT INTO departments (name) VALUES
      ('Commercial & Sales'),
      ('Technical Services'),
      ('Logistics & Supply Chain'),
      ('Plant Operations'),
      ('Human Resources'),
      ('Finance & Legal')
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO regions (name) VALUES
      ('Dhaka Region'),
      ('Chattogram Region'),
      ('Sylhet Region'),
      ('North Bengal (Rajshahi/Rangpur)'),
      ('South Bengal (Khulna/Barishal)')
    ON CONFLICT (name) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO areas (region_id, name)
    SELECT r.id, a.name
    FROM regions r
    CROSS JOIN (VALUES ('Dhaka North'), ('Dhaka South'), ('Narayanganj & Gazipur')) AS a(name)
    WHERE r.name = 'Dhaka Region';

    INSERT INTO areas (region_id, name)
    SELECT r.id, a.name
    FROM regions r
    CROSS JOIN (VALUES ('Chattogram Metro'), ('Cox''s Bazar & South')) AS a(name)
    WHERE r.name = 'Chattogram Region';

    INSERT INTO areas (region_id, name)
    SELECT r.id, a.name
    FROM regions r
    CROSS JOIN (VALUES ('Sylhet Sadar'), ('Habiganj & Moulvibazar')) AS a(name)
    WHERE r.name = 'Sylhet Region';
  `);

  pgm.sql(`
    INSERT INTO territories (area_id, name)
    SELECT a.id, t.name
    FROM areas a
    CROSS JOIN (VALUES ('Mirpur Territory'), ('Uttara Territory'), ('Tongi & Ashulia')) AS t(name)
    WHERE a.name = 'Dhaka North';

    INSERT INTO territories (area_id, name)
    SELECT a.id, t.name
    FROM areas a
    CROSS JOIN (VALUES ('Agrabad Territory'), ('Nasirabad Territory')) AS t(name)
    WHERE a.name = 'Chattogram Metro';
  `);
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['area_id', 'territory_id', 'employee_type', 'sales_role']);
  pgm.dropTable('territories');
  pgm.dropTable('areas');
};
