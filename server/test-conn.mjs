import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

pool.query('SELECT 1').then(() => {
  console.log('PG pool works');
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return prisma.$connect().then(() => {
    console.log('Prisma $connect OK');
    return prisma.user.findMany().then((users) => {
      console.log('Query OK:', users.length, 'users');
      return prisma.$disconnect();
    });
  });
}).then(() => process.exit(0))
.catch((e) => {
  console.log('ERROR:', e.constructor.name, e.code, (e.message || '').substring(0, 300));
  process.exit(1);
});

setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 10000);
