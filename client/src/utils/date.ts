const localeMap: Record<string, string> = { en: 'en-US', es: 'es-AR' };

export function formatDate(isoString: string, language: 'en' | 'es'): string {
  const locale = localeMap[language] || 'es-AR';
  return new Date(isoString).toLocaleDateString(locale, { timeZone: 'UTC' });
}

export function formatDateTime(isoString: string, language: 'en' | 'es'): string {
  const locale = localeMap[language] || 'es-AR';
  return new Date(isoString).toLocaleDateString(locale);
}

export function formatDateShort(isoString: string, language: 'en' | 'es'): string {
  const locale = localeMap[language] || 'es-AR';
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  if (date.getFullYear() !== new Date().getFullYear()) {
    options.year = 'numeric';
  }
  return date.toLocaleDateString(locale, options);
}

export function calculateNextDueDate(firstDueDate: string, paidCount: number, frequency: string): Date {
  const due = new Date(firstDueDate);
  if (frequency === 'WEEKLY') due.setDate(due.getDate() + paidCount * 7);
  else if (frequency === 'BIWEEKLY') due.setDate(due.getDate() + paidCount * 14);
  else if (frequency === 'MONTHLY') due.setMonth(due.getMonth() + paidCount);
  return due;
}
