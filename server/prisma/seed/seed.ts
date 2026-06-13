import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@kredio.com' },
    update: {},
    create: {
      email: 'admin@kredio.com',
      name: 'Admin',
      password,
    },
  });

  const client = await prisma.client.upsert({
    where: { id: 'seed-client-1' },
    update: {},
    create: {
      id: 'seed-client-1',
      name: 'Juan Pérez',
      phone: '555-1234',
      email: 'juan@example.com',
      userId: user.id,
    },
  });

  await prisma.credit.upsert({
    where: { id: 'seed-credit-1' },
    update: {},
    create: {
      id: 'seed-credit-1',
      amount: 5000,
      interestRate: 10,
      totalAmount: 5500,
      balance: 4000,
      installments: 6,
      frequency: 'MONTHLY',
      currency: 'ARS',
      description: 'Préstamo personal',
      dueDate: new Date('2026-07-15'),
      clientId: client.id,
      userId: user.id,
    },
  });

  await prisma.payment.upsert({
    where: { id: 'seed-payment-1' },
    update: {},
    create: {
      id: 'seed-payment-1',
      amount: 1500,
      creditId: 'seed-credit-1',
      userId: user.id,
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
