import { useLanguage } from '../../context/LanguageContext';
import { Period } from '../../types';

const periods: { key: Period; translationKey: string }[] = [
  { key: 'last_week', translationKey: 'dashboard.lastWeek' },
  { key: 'last_month', translationKey: 'dashboard.lastMonth' },
  { key: 'last_3_months', translationKey: 'dashboard.last3Months' },
  { key: 'last_6_months', translationKey: 'dashboard.last6Months' },
  { key: 'last_year', translationKey: 'dashboard.lastYear' },
  { key: 'all', translationKey: 'dashboard.all' },
];

interface DateSegmentFilterProps {
  value: Period;
  onChange: (period: Period) => void;
}

export const DateSegmentFilter = ({ value, onChange }: DateSegmentFilterProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-1.5">
      {periods.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            value === p.key
              ? 'bg-accent-cyan text-white shadow-sm'
              : 'bg-bg-input text-text-muted border border-border hover:border-accent-cyan hover:text-text-primary'
          }`}
        >
          {t(p.translationKey)}
        </button>
      ))}
    </div>
  );
};
