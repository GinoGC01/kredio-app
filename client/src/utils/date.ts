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
