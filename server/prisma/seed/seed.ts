import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const USER_ID = '49633923-5b44-4c17-8742-8e1375884d0a';

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcTotalAmount(amount: number, rate: number): number {
  return r2(amount + (amount * rate) / 100);
}

function calcBreakdown(total: number, principal: number, installments: number, num: number) {
  const perInstallment = r2(total / installments);
  const totalInterest = total - principal;
  const interestPortion = r2(totalInterest / installments);
  const principalPortion = r2(perInstallment - interestPortion);
  if (num === installments) {
    return {
      original: r2(principal - principalPortion * (installments - 1)),
      interest: r2(totalInterest - interestPortion * (installments - 1)),
    };
  }
  return { original: principalPortion, interest: interestPortion };
}

function paymentDate(dueDate: Date, installmentNum: number, frequency: string): Date {
  const d = new Date(dueDate);
  const offset = installmentNum - 1;
  if (frequency === 'WEEKLY') d.setDate(d.getDate() + 7 * offset);
  else if (frequency === 'BIWEEKLY') d.setDate(d.getDate() + 14 * offset);
  else d.setMonth(d.getMonth() + offset);
  return d;
}

async function createCredit(
  id: string,
  clientId: string,
  amount: number,
  interestRate: number,
  installments: number,
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
  currency: 'ARS' | 'USD',
  dueDate: Date,
  status: 'ACTIVE' | 'OVERDUE' | 'PAID' | 'CANCELLED',
  description: string,
  moraType: 'PERCENTAGE' | 'FIXED_AMOUNT' | null,
  moraPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null,
  moraRate: number | null,
  paymentDefs: { method: string; note?: string }[],
) {
  const total = calcTotalAmount(amount, interestRate);

  // Pre-calculate all installment breakdowns
  const breakdowns: { original: number; interest: number }[] = [];
  for (let i = 1; i <= installments; i++) {
    breakdowns.push(calcBreakdown(total, amount, installments, i));
  }

  let cumPaid = 0;
  for (let i = 0; i < paymentDefs.length; i++) {
    cumPaid += breakdowns[i].original + breakdowns[i].interest;
  }
  const balance = total - cumPaid;

  await prisma.credit.upsert({
    where: { id },
    update: {},
    create: {
      id,
      amount,
      interestRate,
      totalAmount: total,
      balance,
      installments,
      frequency,
      currency,
      description,
      status,
      dueDate,
      moraType,
      moraPeriod,
      moraRate,
      clientId,
      userId: USER_ID,
    },
  });

  for (let i = 0; i < paymentDefs.length; i++) {
    const bd = breakdowns[i];
    let prevBalance = total;
    for (let j = 0; j < i; j++) {
      prevBalance -= breakdowns[j].original + breakdowns[j].interest;
    }
    prevBalance = r2(prevBalance);

    const paymentId = `${id}-p${i + 1}`;
    const payAmount = r2(bd.original + bd.interest);

    await prisma.payment.upsert({
      where: { id: paymentId },
      update: {},
      create: {
        id: paymentId,
        amount: payAmount,
        originalAmount: bd.original,
        interestAmount: bd.interest,
        moraAmount: 0,
        previousBalance: prevBalance,
        installmentNumber: i + 1,
        method: paymentDefs[i].method as any,
        date: paymentDate(dueDate, i + 1, frequency),
        note: paymentDefs[i].note ?? null,
        creditId: id,
        userId: USER_ID,
      },
    });
  }
}

async function main() {
  await prisma.user.findUniqueOrThrow({ where: { id: USER_ID } });
  console.log('User found, seeding data...');

  // ─── CLIENTS ─────────────────────────────────────────────
  const clients = [
    { id: 'seed-cl-01', name: 'Carlos Rodríguez', phone: '555-1001', email: 'carlos@email.com' },
    { id: 'seed-cl-02', name: 'María García', phone: '555-1002' },
    { id: 'seed-cl-03', name: 'José Martínez', email: 'jose@email.com' },
    { id: 'seed-cl-04', name: 'Laura Fernández', phone: '555-1004', notes: 'Cliente premium' },
    { id: 'seed-cl-05', name: 'Diego López' },
    { id: 'seed-cl-06', name: 'Ana González', phone: '555-1006', email: 'ana@email.com' },
    { id: 'seed-cl-07', name: 'Pablo Hernández', notes: 'Referido por María García' },
    { id: 'seed-cl-08', name: 'Sofía Díaz', phone: '555-1008' },
    { id: 'seed-cl-09', name: 'Martín Pérez', email: 'martin@email.com' },
    { id: 'seed-cl-10', name: 'Valentina Torres', phone: '555-1010' },
    { id: 'seed-cl-11', name: 'Andrés Romero', notes: 'Cliente desde 2025' },
    { id: 'seed-cl-12', name: 'Camila Vargas', phone: '555-1012' },
    { id: 'seed-cl-13', name: 'Fernando Castro', email: 'fernando@email.com' },
    { id: 'seed-cl-14', name: 'Luciana Rivas', phone: '555-1014' },
    { id: 'seed-cl-15', name: 'Santiago Morales', notes: 'Requiere seguimiento semanal' },
    { id: 'seed-cl-16', name: 'Florencia Ortiz', phone: '555-1016', email: 'florencia@email.com' },
    { id: 'seed-cl-17', name: 'Nicolás Silva' },
    { id: 'seed-cl-18', name: 'Paula Acosta', phone: '555-1018' },
    { id: 'seed-cl-19', name: 'Gabriel Campos', email: 'gabriel@email.com', notes: 'Cliente nuevo' },
    { id: 'seed-cl-20', name: 'Victoria Navarro', phone: '555-1020' },
  ];

  for (const c of clients) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, userId: USER_ID },
    });
  }
  console.log(`  ✓ ${clients.length} clients created`);

  // ─── CREDITS ─────────────────────────────────────────────
  // Each block: createCredit(id, clientId, amount, interestRate, installments, frequency, currency, dueDate, status, desc, moraType, moraPeriod, moraRate, paymentDefs[])

  // Client 01: Carlos Rodríguez — 3 credits
  await createCredit('seed-cr-01-01', 'seed-cl-01', 5000, 10, 6, 'MONTHLY', 'ARS', new Date('2026-08-15'), 'ACTIVE', 'Préstamo personal', null, null, null, []);
  await createCredit('seed-cr-01-02', 'seed-cl-01', 3000, 15, 4, 'WEEKLY', 'ARS', new Date('2026-05-01'), 'OVERDUE', 'Préstamo con mora porcentaje diaria', 'PERCENTAGE', 'DAILY', 0.5, [
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-01-03', 'seed-cl-01', 2000, 8, 3, 'MONTHLY', 'ARS', new Date('2026-03-15'), 'PAID', 'Préstamo chico pagado', null, null, null, [
    { method: 'CASH' },
    { method: 'TRANSFER' },
    { method: 'CASH' },
  ]);

  // Client 02: María García — 2 credits
  await createCredit('seed-cr-02-01', 'seed-cl-02', 1000, 12, 6, 'BIWEEKLY', 'USD', new Date('2026-07-01'), 'ACTIVE', 'Préstamo USD bimensual con mora fija', 'FIXED_AMOUNT', 'WEEKLY', 2, []);
  await createCredit('seed-cr-02-02', 'seed-cl-02', 8000, 20, 5, 'MONTHLY', 'ARS', new Date('2026-03-01'), 'OVERDUE', 'Préstamo grande mora porcentaje mensual', 'PERCENTAGE', 'MONTHLY', 3, [
    { method: 'CASH' },
    { method: 'CASH' },
  ]);

  // Client 03: José Martínez — 3 credits
  await createCredit('seed-cr-03-01', 'seed-cl-03', 1500, 10, 4, 'WEEKLY', 'ARS', new Date('2026-04-01'), 'CANCELLED', 'Préstamo cancelado sin mora', null, null, null, []);
  await createCredit('seed-cr-03-02', 'seed-cl-03', 10000, 25, 10, 'MONTHLY', 'ARS', new Date('2026-07-15'), 'ACTIVE', 'Préstamo largo con mora fija diaria', 'FIXED_AMOUNT', 'DAILY', 1.5, []);
  await createCredit('seed-cr-03-03', 'seed-cl-03', 2000, 10, 2, 'MONTHLY', 'USD', new Date('2026-02-01'), 'PAID', 'Préstamo USD corto pagado', null, null, null, [
    { method: 'TRANSFER' },
    { method: 'TRANSFER' },
  ]);

  // Client 04: Laura Fernández — 2 credits
  await createCredit('seed-cr-04-01', 'seed-cl-04', 6000, 12, 6, 'BIWEEKLY', 'ARS', new Date('2026-04-15'), 'OVERDUE', 'Préstamo bimensual sin mora', null, null, null, [
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-04-02', 'seed-cl-04', 4000, 20, 8, 'WEEKLY', 'ARS', new Date('2026-07-01'), 'ACTIVE', 'Préstamo semanal con mora porcentaje', 'PERCENTAGE', 'DAILY', 1, [
    { method: 'CASH' },
    { method: 'CASH' },
  ]);

  // Client 05: Diego López — 2 credits (includes BIEN + OTHER)
  await createCredit('seed-cr-05-01', 'seed-cl-05', 3000, 15, 4, 'MONTHLY', 'ARS', new Date('2026-01-15'), 'PAID', 'Préstamo pagado con mora fija + bien', 'FIXED_AMOUNT', 'DAILY', 2, [
    { method: 'BIEN', note: 'Taladro industrial marca Bosch' },
    { method: 'CASH' },
    { method: 'OTHER' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-05-02', 'seed-cl-05', 1500, 10, 3, 'WEEKLY', 'USD', new Date('2026-05-15'), 'OVERDUE', 'Préstamo USD semanal sin mora', null, null, null, [
    { method: 'CASH' },
  ]);

  // Client 06: Ana González — 3 credits
  await createCredit('seed-cr-06-01', 'seed-cl-06', 5000, 8, 5, 'MONTHLY', 'USD', new Date('2026-09-01'), 'ACTIVE', 'Préstamo USD mensual con mora porcentaje', 'PERCENTAGE', 'MONTHLY', 2.5, [
    { method: 'TRANSFER' },
  ]);
  await createCredit('seed-cr-06-02', 'seed-cl-06', 2500, 10, 3, 'BIWEEKLY', 'ARS', new Date('2026-05-01'), 'CANCELLED', 'Préstamo cancelado con 1 pago', null, null, null, [
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-06-03', 'seed-cl-06', 1000, 20, 4, 'WEEKLY', 'ARS', new Date('2026-04-01'), 'PAID', 'Préstamo semanal pagado con débito', null, null, null, [
    { method: 'CASH' },
    { method: 'DEBIT_CARD' },
    { method: 'CASH' },
    { method: 'CASH' },
  ]);

  // Client 07: Pablo Hernández — 2 credits
  await createCredit('seed-cr-07-01', 'seed-cl-07', 8000, 30, 6, 'WEEKLY', 'ARS', new Date('2026-03-15'), 'OVERDUE', 'Préstamo alto interés con mora fija', 'FIXED_AMOUNT', 'DAILY', 1, [
    { method: 'CASH' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-07-02', 'seed-cl-07', 15000, 15, 12, 'MONTHLY', 'ARS', new Date('2026-08-01'), 'ACTIVE', 'Préstamo largo 12 cuotas', 'PERCENTAGE', 'DAILY', 0.75, []);

  // Client 08: Sofía Díaz — 2 credits
  await createCredit('seed-cr-08-01', 'seed-cl-08', 1000, 5, 2, 'MONTHLY', 'ARS', new Date('2026-03-01'), 'PAID', 'Préstamo mínimo pagado', null, null, null, [
    { method: 'CASH' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-08-02', 'seed-cl-08', 3000, 10, 3, 'WEEKLY', 'USD', new Date('2026-05-01'), 'CANCELLED', 'Préstamo USD cancelado', null, null, null, []);

  // Client 09: Martín Pérez — 2 credits
  await createCredit('seed-cr-09-01', 'seed-cl-09', 8000, 20, 8, 'BIWEEKLY', 'ARS', new Date('2026-07-15'), 'ACTIVE', 'Préstamo bimensual con mora fija mensual', 'FIXED_AMOUNT', 'MONTHLY', 5, [
    { method: 'TRANSFER' },
  ]);
  await createCredit('seed-cr-09-02', 'seed-cl-09', 5000, 12, 6, 'MONTHLY', 'ARS', new Date('2026-04-01'), 'OVERDUE', 'Préstamo vencido sin mora', null, null, null, [
    { method: 'CASH' },
  ]);

  // Client 10: Valentina Torres — 2 credits
  await createCredit('seed-cr-10-01', 'seed-cl-10', 2000, 10, 3, 'WEEKLY', 'ARS', new Date('2026-02-15'), 'PAID', 'Préstamo semanal pagado con tarjeta', 'PERCENTAGE', 'DAILY', 0.5, [
    { method: 'CASH' },
    { method: 'CASH' },
    { method: 'CREDIT_CARD' },
  ]);
  await createCredit('seed-cr-10-02', 'seed-cl-10', 3000, 8, 6, 'MONTHLY', 'USD', new Date('2026-09-15'), 'ACTIVE', 'Préstamo USD sin mora', null, null, null, []);

  // Client 11: Andrés Romero — 2 credits
  await createCredit('seed-cr-11-01', 'seed-cl-11', 4000, 15, 4, 'WEEKLY', 'ARS', new Date('2026-05-01'), 'OVERDUE', 'Préstamo vencido sin pagos', null, null, null, []);
  await createCredit('seed-cr-11-02', 'seed-cl-11', 2500, 20, 3, 'MONTHLY', 'ARS', new Date('2026-02-01'), 'PAID', 'Préstamo pagado con débito automático', 'FIXED_AMOUNT', 'DAILY', 3, [
    { method: 'DEBIT_CARD' },
    { method: 'DEBIT_CARD' },
    { method: 'CASH' },
  ]);

  // Client 12: Camila Vargas — 3 credits
  await createCredit('seed-cr-12-01', 'seed-cl-12', 10000, 10, 8, 'MONTHLY', 'ARS', new Date('2026-08-15'), 'ACTIVE', 'Préstamo con mora porcentaje semanal', 'PERCENTAGE', 'WEEKLY', 1.5, []);
  await createCredit('seed-cr-12-02', 'seed-cl-12', 2000, 8, 2, 'WEEKLY', 'ARS', new Date('2026-04-15'), 'CANCELLED', 'Préstamo cancelado con 1 pago', null, null, null, [
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-12-03', 'seed-cl-12', 1500, 15, 3, 'BIWEEKLY', 'USD', new Date('2026-03-01'), 'PAID', 'Préstamo USD bimensual pagado', null, null, null, [
    { method: 'CASH' },
    { method: 'CASH' },
    { method: 'CASH' },
  ]);

  // Client 13: Fernando Castro — 2 credits
  await createCredit('seed-cr-13-01', 'seed-cl-13', 6000, 10, 5, 'BIWEEKLY', 'ARS', new Date('2026-04-01'), 'OVERDUE', 'Préstamo bimensual vencido con mora', 'PERCENTAGE', 'DAILY', 1, [
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-13-02', 'seed-cl-13', 12000, 12, 10, 'MONTHLY', 'ARS', new Date('2026-07-01'), 'ACTIVE', 'Préstamo 10 cuotas sin mora', null, null, null, [
    { method: 'CASH' },
    { method: 'CASH' },
  ]);

  // Client 14: Luciana Rivas — 2 credits
  await createCredit('seed-cr-14-01', 'seed-cl-14', 3000, 10, 5, 'WEEKLY', 'ARS', new Date('2026-02-01'), 'PAID', 'Préstamo semanal pagado completo', null, null, null, [
    { method: 'CASH' },
    { method: 'TRANSFER' },
    { method: 'CASH' },
    { method: 'CASH' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-14-02', 'seed-cl-14', 2000, 10, 4, 'MONTHLY', 'USD', new Date('2026-04-15'), 'OVERDUE', 'Préstamo USD vencido con mora fija', 'FIXED_AMOUNT', 'DAILY', 2, []);

  // Client 15: Santiago Morales — 3 credits
  await createCredit('seed-cr-15-01', 'seed-cl-15', 3500, 12, 6, 'WEEKLY', 'ARS', new Date('2026-07-15'), 'ACTIVE', 'Préstamo semanal al día', null, null, null, [
    { method: 'CASH' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-15-02', 'seed-cl-15', 1500, 10, 3, 'MONTHLY', 'ARS', new Date('2026-01-01'), 'PAID', 'Préstamo pagado con mora porcentaje', 'PERCENTAGE', 'DAILY', 1, [
    { method: 'CASH' },
    { method: 'CASH' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-15-03', 'seed-cl-15', 4000, 15, 4, 'BIWEEKLY', 'ARS', new Date('2026-05-15'), 'CANCELLED', 'Préstamo bimensual cancelado', null, null, null, []);

  // Client 16: Florencia Ortiz — 2 credits
  await createCredit('seed-cr-16-01', 'seed-cl-16', 10000, 20, 8, 'MONTHLY', 'ARS', new Date('2026-02-15'), 'OVERDUE', 'Préstamo grande vencido 3 pagos', 'FIXED_AMOUNT', 'WEEKLY', 1.5, [
    { method: 'CASH' },
    { method: 'CASH' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-16-02', 'seed-cl-16', 2500, 10, 4, 'WEEKLY', 'USD', new Date('2026-08-01'), 'ACTIVE', 'Préstamo USD semanal activo', null, null, null, []);

  // Client 17: Nicolás Silva — 2 credits
  await createCredit('seed-cr-17-01', 'seed-cl-17', 5000, 8, 6, 'MONTHLY', 'ARS', new Date('2025-12-15'), 'PAID', 'Préstamo pagado 6 cuotas', null, null, null, [
    { method: 'CASH' },
    { method: 'CASH' },
    { method: 'CASH' },
    { method: 'TRANSFER' },
    { method: 'CASH' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-17-02', 'seed-cl-17', 2000, 10, 2, 'WEEKLY', 'ARS', new Date('2026-04-01'), 'CANCELLED', 'Préstamo cancelado con mora', 'PERCENTAGE', 'DAILY', 0.5, []);

  // Client 18: Paula Acosta — 2 credits
  await createCredit('seed-cr-18-01', 'seed-cl-18', 7000, 15, 8, 'BIWEEKLY', 'ARS', new Date('2026-08-01'), 'ACTIVE', 'Préstamo bimensual con mora porcentaje', 'PERCENTAGE', 'MONTHLY', 2, [
    { method: 'TRANSFER' },
  ]);
  await createCredit('seed-cr-18-02', 'seed-cl-18', 3000, 10, 3, 'WEEKLY', 'ARS', new Date('2026-05-15'), 'OVERDUE', 'Préstamo semanal vencido', null, null, null, [
    { method: 'CASH' },
  ]);

  // Client 19: Gabriel Campos — 2 credits
  await createCredit('seed-cr-19-01', 'seed-cl-19', 2000, 12, 4, 'MONTHLY', 'USD', new Date('2026-01-01'), 'PAID', 'Préstamo USD pagado con mora fija', 'FIXED_AMOUNT', 'DAILY', 1, [
    { method: 'CASH' },
    { method: 'CASH' },
    { method: 'CASH' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-19-02', 'seed-cl-19', 6000, 10, 6, 'BIWEEKLY', 'ARS', new Date('2026-09-01'), 'ACTIVE', 'Préstamo bimensual activo', null, null, null, []);

  // Client 20: Victoria Navarro — 3 credits
  await createCredit('seed-cr-20-01', 'seed-cl-20', 5000, 25, 6, 'WEEKLY', 'ARS', new Date('2026-03-01'), 'OVERDUE', 'Préstamo vencido con mora porcentaje alta', 'PERCENTAGE', 'DAILY', 2, [
    { method: 'CASH' },
    { method: 'CASH' },
  ]);
  await createCredit('seed-cr-20-02', 'seed-cl-20', 3000, 10, 3, 'MONTHLY', 'ARS', new Date('2026-05-01'), 'CANCELLED', 'Préstamo cancelado sin pagos', null, null, null, []);
  await createCredit('seed-cr-20-03', 'seed-cl-20', 1000, 5, 2, 'MONTHLY', 'ARS', new Date('2026-04-01'), 'PAID', 'Préstamo mínimo pagado tarjeta', null, null, null, [
    { method: 'CREDIT_CARD' },
    { method: 'CASH' },
  ]);

  console.log('  ✓ 46 credits created');
  console.log('  ✓ ~70 payments created');
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
