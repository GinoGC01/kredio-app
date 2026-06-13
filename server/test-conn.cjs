const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
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

setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 15000);
