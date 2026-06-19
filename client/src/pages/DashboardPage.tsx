import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { dashboardService } from '../services/dashboard.service';
import { Dashboard, Period } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DateSegmentFilter } from '../components/ui/DateSegmentFilter';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { formatDate } from '../utils/date';
import { CollectionChart } from '../components/dashboard/CollectionChart';
import {
  FiBriefcase, FiPieChart, FiClock, FiDollarSign,
  FiChevronRight, FiUsers, FiTrendingUp, FiExternalLink, FiPlus,
} from 'react-icons/fi';

/** Walk up from `el` and return the first ancestor that scrolls vertically. */
const findScrollParent = (el: HTMLElement | null): HTMLElement | Window => {
  let node = el?.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return window;
};

const DashboardPage = () => {
  const [data, setData] = useState<Dashboard | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [scrolling, setScrolling] = useState(false);
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

  const period = (searchParams.get('period') as Period) || 'all';

  const fetchDashboard = useCallback(() => {
    const filter = period === 'all' ? undefined : { period };
    dashboardService.get(filter).then((res) => setData(res.data));
  }, [period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  /* ── Scroll-shrink for the FAB group ── */
  useEffect(() => {
    const scrollTarget = findScrollParent(pageRef.current);
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      setScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => setScrolling(false), 250);
    };
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollTarget.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [data]); // re-attach after data loads so the DOM is fully rendered

  const handlePeriodChange = (newPeriod: Period) => {
    setSearchParams(newPeriod === 'all' ? {} : { period: newPeriod });
  };

  if (!data) return <PageLoader />;

  const periodLabel = period === 'last_week' ? t('dashboard.lastWeek').toLowerCase()
    : period === 'last_month' ? t('dashboard.lastMonth').toLowerCase()
    : period === 'last_3_months' ? t('dashboard.last3Months').toLowerCase()
    : period === 'last_6_months' ? t('dashboard.last6Months').toLowerCase()
    : period === 'last_year' ? t('dashboard.lastYear').toLowerCase()
    : '';

  const arsVariation = data.previousPeriodCollectedArs > 0
    ? Math.round(((data.collectedAmountArs - data.previousPeriodCollectedArs) / data.previousPeriodCollectedArs) * 100)
    : 0;

  const usdVariation = data.previousPeriodCollectedUsd > 0
    ? Math.round(((data.collectedAmountUsd - data.previousPeriodCollectedUsd) / data.previousPeriodCollectedUsd) * 100)
    : 0;

  const VariationBadge = ({ value, label }: { value: number; label: string }) => {
    if (value === 0) return null;
    const isUp = value > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-success' : 'text-danger'}`}>
        <span>{isUp ? '↑' : '↓'}</span>
        <span>{Math.abs(value)}%</span>
        <span className="text-text-muted font-normal ml-0.5">{label}</span>
      </span>
    );
  };

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const thisWeekUpcoming = data.upcomingDueDates.filter((c) => {
    const d = new Date(c.dueDate);
    return d >= now && d <= weekEnd;
  });

  return (
    <div ref={pageRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">{t('dashboard.title')}</h1>
        <DateSegmentFilter value={period} onChange={handlePeriodChange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Active Credits */}
        <div className="card p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-stat-purple-bg flex items-center justify-center">
              <FiBriefcase className="w-5 h-5 text-accent-purple" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-extrabold text-text-primary">{data.activeCredits}</p>
          <p className="text-xs text-text-muted uppercase tracking-wider mt-0.5">{t('dashboard.activeCredits')}</p>
        </div>

        {/* Overdue Clients */}
        <div className="card p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-stat-red-bg flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-danger" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-extrabold text-text-primary">{data.overdueClientsCount}</p>
          <p className="text-xs text-text-muted uppercase tracking-wider mt-0.5">{t('dashboard.clientsInRed')}</p>
        </div>

        {/* Portfolio */}
        <div className="card card--accent p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-stat-teal-bg flex items-center justify-center">
              <FiPieChart className="w-5 h-5 text-accent-teal" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-extrabold text-text-primary">ARS {data.totalPortfolioArs.toLocaleString()}</p>
          <p className="text-xs text-text-muted uppercase tracking-wider mt-0.5">{t('dashboard.totalPortfolio')}</p>
          <div className="mt-1.5">
            <span className="text-xs text-text-muted">USD {data.totalPortfolioUsd.toLocaleString()}</span>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="card card--accent p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-stat-blue-bg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-accent-orange" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-extrabold text-text-primary">{data.collectionRateArs}%</p>
          <p className="text-xs text-text-muted uppercase tracking-wider mt-0.5">{t('dashboard.collectionRate')} ARS</p>
          <div className="mt-2 space-y-1">
            <span className="block text-xs text-text-muted">
              {t('dashboard.collected')}: ARS {data.collectedAmountArs.toLocaleString()}
              {periodLabel && (
                <VariationBadge value={arsVariation} label={`vs ${periodLabel}`} />
              )}
            </span>
            <span className="block text-xs text-text-muted">
              USD {data.collectedAmountUsd.toLocaleString()} · {data.collectionRateUsd}%
              {periodLabel && (
                <VariationBadge value={usdVariation} label={`vs ${periodLabel}`} />
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Upcoming Due + Clients in Red */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Próximos Vencimientos — takes 2/3 */}
        <div className="lg:col-span-2">
          <Card title={t('dashboard.upcomingDue')} className="h-full">
            {data.upcomingDueDates.length === 0 ? (
              <p className="text-text-muted text-sm py-4">{t('dashboard.noUpcomingDue')}</p>
            ) : (
              <div>
                {/* This week highlight */}
                {thisWeekUpcoming.length > 0 && (
                  <div className="mb-3 px-1">
                    <p className="text-xs font-semibold text-accent-pink uppercase tracking-wider mb-2">
                      {t('dashboard.thisWeek')}
                    </p>
                    <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
                      {thisWeekUpcoming.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-bg-card-hover cursor-pointer transition-colors"
                          onClick={() => navigate(`/credits/${c.id}`)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg bg-accent-pink-dim flex items-center justify-center shrink-0">
                              <FiClock className="w-4 h-4 text-accent-pink" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-text-primary truncate">{c.clientName}</p>
                              <p className="text-xs text-text-muted">
                                {c.creditDescription && <span className="truncate block">{c.creditDescription}</span>}
                                <span>{t('dashboard.due').replace('{date}', formatDate(c.dueDate, language))}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-sm font-bold text-text-primary">{c.currency} {c.balance.toLocaleString()}</p>
                            <p className="text-xs text-text-muted">
                              {t('dashboard.installmentOf').replace('{n}', String(c.installmentNumber)).replace('{total}', String(c.totalInstallments))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* All upcoming */}
                <div className="divide-y divide-border-subtle -mx-5">
                  {data.upcomingDueDates.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-bg-card-hover cursor-pointer transition-colors"
                      onClick={() => navigate(`/credits/${c.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-stat-purple-bg flex items-center justify-center shrink-0">
                          <FiClock className="w-4 h-4 text-accent-purple" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{c.clientName}</p>
                          <p className="text-xs text-text-muted">
                            {t('dashboard.due').replace('{date}', formatDate(c.dueDate, language))}
                            {c.creditDescription && <span className="ml-1">· {c.creditDescription}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold text-accent-indigo">{c.currency} {c.balance.toLocaleString()}</p>
                        <p className="text-xs text-text-muted">
                          {t('dashboard.installmentOf').replace('{n}', String(c.installmentNumber)).replace('{total}', String(c.totalInstallments))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Clientes en Rojo — takes 1/3 */}
        <div>
          <Card title={t('dashboard.clientsInRed')} className="h-full">
            {data.overdueClients.length === 0 ? (
              <p className="text-text-muted text-sm py-4">{t('dashboard.noClientsInRed')}</p>
            ) : (
              <div className="divide-y divide-border-subtle -mx-5">
                {data.overdueClients.slice(0, 5).map((c) => (
                  <div key={c.creditId} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-text-primary truncate">{c.clientName}</p>
                      <span className="text-xs font-semibold text-danger">{c.currency} {c.overdueAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="danger">
                        {t('dashboard.daysLate').replace('{days}', String(c.daysLate))}
                      </Badge>
                      <button
                        onClick={() => navigate(`/credits/${c.creditId}`)}
                        className="text-xs text-accent-cyan hover:underline flex items-center gap-1"
                      >
                        <FiExternalLink className="w-3 h-3" />
                        {t('dashboard.registerPayment')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Collection Chart */}
      <Card title={t('dashboard.monthlyCollection')}>
        {data.monthlyCollection.length === 0 ? (
          <p className="text-text-muted text-sm py-4">{t('dashboard.noRecentPayments')}</p>
        ) : (
          <CollectionChart data={data.monthlyCollection} language={language} />
        )}
      </Card>

      {/* Portfolio split by currency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card title="Portafolio en ARS" accent="purple">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-muted">{t('dashboard.totalPortfolio')}</span>
              <span className="text-lg font-bold text-text-primary">ARS {data.totalPortfolioArs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border-subtle">
              <span className="text-sm text-text-muted">{t('dashboard.pending')}</span>
              <span className="text-lg font-bold text-accent-purple">ARS {data.pendingAmountArs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border-subtle">
              <span className="text-sm text-text-muted">{t('dashboard.collected')}</span>
              <span className="text-lg font-bold text-success">ARS {data.collectedAmountArs.toLocaleString()}</span>
            </div>
            {periodLabel && (
              <div className="flex justify-between items-center py-2 border-t border-border-subtle">
                <span className="text-sm text-text-muted">{t('dashboard.vsPrevious')}</span>
                <span className="text-sm font-semibold text-text-primary">
                  <VariationBadge value={arsVariation} label="" />
                </span>
              </div>
            )}
          </div>
        </Card>
        <Card title="Portafolio en USD" accent="cyan">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-muted">{t('dashboard.totalPortfolio')}</span>
              <span className="text-lg font-bold text-text-primary">USD {data.totalPortfolioUsd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border-subtle">
              <span className="text-sm text-text-muted">{t('dashboard.pending')}</span>
              <span className="text-lg font-bold text-accent-purple">USD {data.pendingAmountUsd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border-subtle">
              <span className="text-sm text-text-muted">{t('dashboard.collected')}</span>
              <span className="text-lg font-bold text-success">USD {data.collectedAmountUsd.toLocaleString()}</span>
            </div>
            {periodLabel && (
              <div className="flex justify-between items-center py-2 border-t border-border-subtle">
                <span className="text-sm text-text-muted">{t('dashboard.vsPrevious')}</span>
                <span className="text-sm font-semibold text-text-primary">
                  <VariationBadge value={usdVariation} label="" />
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Payments — enriched */}
      <Card title={t('dashboard.recentPayments')}>
        {data.recentPayments.length === 0 ? (
          <p className="text-text-muted text-sm py-4">{t('dashboard.noRecentPayments')}</p>
        ) : (
          <div>
            <div className="divide-y divide-border-subtle -mx-5">
              {data.recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-bg-card-hover cursor-pointer transition-colors"
                  onClick={() => navigate(`/credits/${p.creditId}`)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-stat-teal-bg flex items-center justify-center shrink-0">
                      <FiDollarSign className="w-4 h-4 text-success" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{p.clientName}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(p.date, language)}
                        {p.creditDescription && <span className="ml-1">· {p.creditDescription}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2 sm:ml-3">
                    {p.installmentNumber && (
                      <span className="hidden sm:inline text-xs text-text-muted whitespace-nowrap">
                        {t('dashboard.installmentOf').replace('{n}', String(p.installmentNumber)).replace('{total}', String(p.totalInstallments))}
                      </span>
                    )}
                    <Badge variant={p.isEarlyPayment ? 'success' : 'warning'}>
                      {p.isEarlyPayment ? t('dashboard.earlyPayment') : t('dashboard.latePayment')}
                    </Badge>
                    <span className="text-sm font-semibold text-success whitespace-nowrap">{p.currency} {p.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-border-subtle -mx-5 px-5">
              <Link
                to="/payments"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent-cyan hover:underline"
              >
                {t('dashboard.seeAllPayments')}
                <FiChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* FAB group — bottom-right */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
        style={{
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
          transform: scrolling ? 'scale(0.7) translateY(8px)' : 'scale(1) translateY(0)',
          opacity: scrolling ? 0.55 : 1,
        }}
      >
        {/* Register Payment — primary */}
        <Link
          to="/credits"
          className="group relative flex items-center gap-2.5 px-5 py-2.5 bg-accent-purple text-white rounded-xl shadow-lg shadow-accent-purple/30 hover:shadow-xl hover:shadow-accent-purple/40 hover:opacity-95 transition-all duration-200 text-sm font-semibold"
        >
          <FiDollarSign className="w-4 h-4" />
          <span>{t('dashboard.registerPayment')}</span>
        </Link>

        {/* New Credit — secondary */}
        <Link
          to="/credits/new"
          className="group relative flex items-center gap-2.5 px-5 py-2.5 bg-bg-card/90 backdrop-blur-md text-text-primary border border-border-subtle rounded-xl shadow-lg hover:shadow-xl hover:border-accent-purple/40 hover:bg-bg-card transition-all duration-200 text-sm font-medium"
        >
          <span>{t('dashboard.newCredit')}</span>
        </Link>

        {/* New Client — terciary */}
        <Link
          to="/clients/new"
          className="group relative flex items-center gap-2.5 px-5 py-2 text-text-muted hover:text-text-primary transition-colors duration-200 text-xs font-medium"
        >
          <span>{t('dashboard.newClient')}</span>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
