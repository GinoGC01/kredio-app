import { useLanguage } from '../../context/LanguageContext';
import { PaymentStats } from '../../types';
import { FiDollarSign, FiUsers, FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import { BiSolidDollarCircle } from 'react-icons/bi';

interface PaymentStatsBarProps {
  stats: PaymentStats | null;
  loading: boolean;
  onOverdueClick?: () => void;
}

export const PaymentStatsBar = ({ stats, loading, onOverdueClick }: PaymentStatsBarProps) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-bg-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: t('payments.stats.totalArs'),
      value: `ARS $${stats.totalArs.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-stat-teal-bg text-success',
    },
    {
      label: t('payments.stats.totalUsd'),
      value: `USD $${stats.totalUsd.toLocaleString()}`,
      icon: BiSolidDollarCircle,
      color: 'bg-stat-blue-bg text-warning',
    },
    {
      label: t('payments.stats.paymentCount'),
      value: stats.paymentCount.toString(),
      icon: FiCreditCard,
      color: 'bg-stat-purple-bg text-accent-purple',
    },
    {
      label: t('payments.stats.clientCount'),
      value: stats.clientCount.toString(),
      icon: FiUsers,
      color: 'bg-stat-teal-bg text-success',
    },
    {
      label: t('payments.stats.overdue'),
      value: stats.overdueCount.toString(),
      icon: FiAlertCircle,
      color: 'bg-stat-red-bg text-danger',
      onClick: onOverdueClick,
      highlight: stats.overdueCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={card.onClick}
          disabled={!card.onClick}
          className={`rounded-xl bg-bg-card border border-border p-4 transition-all hover:border-accent-cyan text-left ${card.onClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-text-muted mb-0.5">{card.label}</p>
          <p className={`text-sm font-bold ${card.highlight ? 'text-danger' : 'text-text-primary'}`}>
            {card.value}
          </p>
        </button>
      ))}
    </div>
  );
};
