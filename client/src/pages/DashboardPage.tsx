import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { dashboardService } from '../services/dashboard.service';
import { Dashboard, Period } from '../types';
import { Card } from '../components/ui/Card';
import { DateSegmentFilter } from '../components/ui/DateSegmentFilter';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { formatDate } from '../utils/date';
import { FiBriefcase, FiAlertTriangle, FiPieChart, FiClock, FiDollarSign } from 'react-icons/fi';

const statIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
  activeCredits: { icon: <FiBriefcase className="w-5 h-5 text-accent-purple" />, bg: 'bg-stat-purple-bg' },
  overdueCredits: { icon: <FiAlertTriangle className="w-5 h-5 text-danger" />, bg: 'bg-stat-red-bg' },
  totalPortfolio: { icon: <FiPieChart className="w-5 h-5 text-accent-teal" />, bg: 'bg-stat-teal-bg' },
  pendingAmount: { icon: <FiClock className="w-5 h-5 text-accent-orange" />, bg: 'bg-stat-blue-bg' },
};

const DashboardPage = () => {
  const [data, setData] = useState<Dashboard | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();

  const period = (searchParams.get('period') as Period) || 'all';

  const fetchDashboard = useCallback(() => {
    const filter = period === 'all' ? undefined : { period };
    dashboardService.get(filter).then((res) => setData(res.data));
  }, [period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handlePeriodChange = (newPeriod: Period) => {
    setSearchParams(newPeriod === 'all' ? {} : { period: newPeriod });
  };

  if (!data) return <PageLoader />;

  const stats = [
    { key: 'activeCredits', label: t('dashboard.activeCredits'), value: data.activeCredits, prefix: '', tint: false },
    { key: 'overdueCredits', label: t('dashboard.overdue'), value: data.overdueCredits, prefix: '', tint: false },
    { key: 'totalPortfolio', label: t('dashboard.totalPortfolio'), value: `ARS ${data.totalPortfolioArs.toLocaleString()}`, prefix: '', tint: true },
    { key: 'pendingAmount', label: t('dashboard.pending'), value: `ARS ${data.pendingAmountArs.toLocaleString()}`, prefix: '', tint: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">{t('dashboard.title')}</h1>
        <DateSegmentFilter value={period} onChange={handlePeriodChange} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat) => {
          const iconConfig = statIcons[stat.key];
          return (
            <div key={stat.key} className={`card${stat.tint ? ' card--accent' : ''} p-4 lg:p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconConfig.bg}`}>
                  {iconConfig.icon}
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-extrabold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Portfolio split by currency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card title="Portafolio en ARS" accent="purple">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-muted">Total Cartera</span>
              <span className="text-lg font-bold text-text-primary">ARS {data.totalPortfolioArs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border-subtle">
              <span className="text-sm text-text-muted">Pendiente</span>
              <span className="text-lg font-bold text-accent-purple">ARS {data.pendingAmountArs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border-subtle">
              <span className="text-sm text-text-muted">Cobrado</span>
              <span className="text-lg font-bold text-success">ARS {data.collectedAmountArs.toLocaleString()}</span>
            </div>
          </div>
        </Card>
        <Card title="Portafolio en USD" accent="cyan">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-muted">Total Cartera</span>
              <span className="text-lg font-bold text-text-primary">USD {data.totalPortfolioUsd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border-subtle">
              <span className="text-sm text-text-muted">Pendiente</span>
              <span className="text-lg font-bold text-accent-purple">USD {data.pendingAmountUsd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border-subtle">
              <span className="text-sm text-text-muted">Cobrado</span>
              <span className="text-lg font-bold text-success">USD {data.collectedAmountUsd.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent payments & Upcoming due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card title={t('dashboard.recentPayments')} accent="teal">
          {data.recentPayments.length === 0 ? (
            <p className="text-text-muted text-sm">{t('dashboard.noRecentPayments')}</p>
          ) : (
            <div className="divide-y divide-border-subtle -mx-5">
              {data.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stat-teal-bg flex items-center justify-center">
                      <FiDollarSign className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{p.clientName}</p>
                      <p className="text-xs text-text-muted">{formatDate(p.date, language)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success">{p.currency} {p.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={t('dashboard.upcomingDue')} accent="pink">
          {data.upcomingDueDates.length === 0 ? (
            <p className="text-text-muted text-sm">{t('dashboard.noUpcomingDue')}</p>
          ) : (
            <div className="divide-y divide-border-subtle -mx-5">
              {data.upcomingDueDates.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stat-purple-bg flex items-center justify-center">
                      <FiClock className="w-4 h-4 text-accent-purple" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{c.clientName}</p>
                      <p className="text-xs text-text-muted">{t('dashboard.due').replace('{date}', formatDate(c.dueDate, language))}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-accent-indigo">{c.currency} {c.balance.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Link
          to="/credits/new"
          className="px-4 py-2.5 bg-accent-cyan text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t('dashboard.newCredit')}
        </Link>
        <Link
          to="/clients/new"
          className="px-4 py-2.5 bg-bg-input text-text-primary border border-border rounded-lg text-sm font-medium hover:border-accent-pink transition-colors"
        >
          {t('dashboard.newClient')}
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
