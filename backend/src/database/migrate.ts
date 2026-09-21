/* eslint-disable no-console */
import runner from 'node-pg-migrate';
import path from 'path';
import { env } from '../config/env';

async function main() {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';

  const databaseUrl = `postgres://${encodeURIComponent(env.postgres.user)}:${encodeURIComponent(
    env.postgres.password,
  )}@${env.postgres.host}:${env.postgres.port}/${env.postgres.database}`;

  console.log(`Running migrations "${direction}" against ${env.postgres.host}:${env.postgres.port}/${env.postgres.database}...`);

  await runner({
    databaseUrl,
    dir: path.resolve(__dirname, '../../migrations'),
    direction,
    migrationsTable: 'pgmigrations',
    count: direction === 'down' ? 1 : Infinity,
    checkOrder: true,
    verbose: true,
  });

  console.log(`Migrations "${direction}" complete.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
