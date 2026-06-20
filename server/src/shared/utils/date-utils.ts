export function calculateInstallmentDueDate(firstDueDate: Date, installmentNumber: number, frequency: string): Date {
  const due = new Date(firstDueDate);
  if (frequency === 'WEEKLY') due.setDate(due.getDate() + (installmentNumber - 1) * 7);
  else if (frequency === 'BIWEEKLY') due.setDate(due.getDate() + (installmentNumber - 1) * 14);
  else if (frequency === 'MONTHLY') due.setMonth(due.getMonth() + (installmentNumber - 1));
  return due;
}

export function calculateNextDueDate(firstDueDate: Date, paidCount: number, frequency: string): Date {
  return calculateInstallmentDueDate(firstDueDate, paidCount + 1, frequency);
}
