import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { creditService } from '../services/credit.service';
import { paymentService } from '../services/payment.service';
import { Credit, Period } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DateSegmentFilter } from '../components/ui/DateSegmentFilter';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, calculateNextDueDate } from '../utils/date';
import { FiDollarSign, FiSearch } from 'react-icons/fi';
import { RegisterPaymentModal } from '../components/payments/RegisterPaymentModal';

const statusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'ACTIVE': return <Badge variant="info">{t('status.active')}</Badge>;
    case 'PAID': return <Badge variant="success">{t('status.paid')}</Badge>;
    case 'OVERDUE': return <Badge variant="danger">{t('status.overdue')}</Badge>;
    case 'CANCELLED': return <Badge variant="default">{t('status.cancelled')}</Badge>;
    default: return <Badge variant="default">{status}</Badge>;
  }
};

type StatusFilter = 'ALL' | 'ACTIVE' | 'OVERDUE' | 'PAID';

const CreditsPage = () => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const period = (searchParams.get('period') as Period) || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCreditId, setPaymentCreditId] = useState<string | undefined>(undefined);

  const fetchCredits = useCallback(() => {
    const filter = period === 'all' ? undefined : { period };
    setLoading(true);
    creditService
      .list(filter)
      .then((res) => setCredits(res.data.filter((c) => c.status !== 'ARCHIVED')))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handlePeriodChange = (newPeriod: Period) => {
    setSearchParams(newPeriod === 'all' ? {} : { period: newPeriod });
  };

  const filteredCredits = credits.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      c.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeCount = credits.filter((c) => c.status === 'ACTIVE').length;
  const overdueCount = credits.filter((c) => c.status === 'OVERDUE').length;
  const totalArs = credits
    .filter((c) => c.currency === 'ARS' && (c.status === 'ACTIVE' || c.status === 'OVERDUE'))
    .reduce((sum, c) => sum + Number(c.balance), 0);
  const totalUsd = credits
    .filter((c) => c.currency === 'USD' && (c.status === 'ACTIVE' || c.status === 'OVERDUE'))
    .reduce((sum, c) => sum + Number(c.balance), 0);

  const getDaysOverdue = (firstDueDate: string, paidCount: number, frequency: string) => {
    const nextDue = calculateNextDueDate(firstDueDate, paidCount, frequency);
    return Math.floor((Date.now() - nextDue.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleQuickPayment = (e: React.MouseEvent, creditId: string) => {
    e.stopPropagation();
    setPaymentCreditId(creditId);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (data: {
    creditId: string;
    amount: number;
    originalAmount: number;
    interestAmount: number;
    moraAmount: number;
    method: string;
    note?: string;
    date?: string;
  }) => {
    await paymentService.register(data);
    fetchCredits();
  };

  const formatAmount = (amount: number) =>
    Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <PageLoader />;

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: t('credits.filterAll') },
    { key: 'ACTIVE', label: t('credits.filterActive') },
    { key: 'OVERDUE', label: t('credits.filterOverdue') },
    { key: 'PAID', label: t('credits.filterPaid') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">{t('credits.title')}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('credits.search')}
              className="input-base pl-9 pr-3 py-2 text-sm w-48"
            />
          </div>
          <DateSegmentFilter value={period} onChange={handlePeriodChange} />
          <Link
            to="/credits/new"
            className="px-4 py-2 bg-accent-orange text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {t('credits.newCredit')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stat-purple-bg flex items-center justify-center">
            <span className="text-xs font-bold text-accent-purple">A</span>
          </div>
          <div>
            <p className="text-xs text-text-muted">{t('credits.summaryActive')}</p>
            <p className="text-lg font-bold text-text-primary">{activeCount}</p>
          </div>
        </div>
        <div className="card px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stat-red-bg flex items-center justify-center">
            <span className="text-xs font-bold text-danger">V</span>
          </div>
          <div>
            <p className="text-xs text-text-muted">{t('credits.summaryOverdue')}</p>
            <p className="text-lg font-bold text-text-primary">{overdueCount}</p>
          </div>
        </div>
        <div className="card px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stat-teal-bg flex items-center justify-center">
            <span className="text-xs font-bold text-success">$</span>
          </div>
          <div>
            <p className="text-xs text-text-muted">ARS</p>
            <p className="text-lg font-bold text-text-primary">${formatAmount(totalArs)}</p>
          </div>
        </div>
        <div className="card px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stat-blue-bg flex items-center justify-center">
            <span className="text-xs font-bold text-warning">$</span>
          </div>
          <div>
            <p className="text-xs text-text-muted">USD</p>
            <p className="text-lg font-bold text-text-primary">${formatAmount(totalUsd)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.key
                ? 'bg-accent-orange text-white'
                : 'bg-bg-input text-text-muted hover:text-text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card accent="orange">
        {filteredCredits.length === 0 ? (
          <p className="text-text-muted text-center py-8">{t('credits.noCredits')}</p>
        ) : (
          <div className="divide-y divide-border-subtle -mx-5">
            {filteredCredits.map((credit) => {
              const paidCount = credit._count?.payments ?? 0;
              const nextDue = calculateNextDueDate(credit.dueDate, paidCount, credit.frequency);
              const daysOverdue = getDaysOverdue(credit.dueDate, paidCount, credit.frequency);
              const identifier = credit.description || `#${credit.id.slice(0, 6)}`;

              return (
                <div
                  key={credit.id}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-bg-card-hover transition-colors"
                  onClick={() => navigate(`/credits/${credit.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-stat-purple-bg flex items-center justify-center shrink-0">
                      <FiDollarSign className="w-4 h-4 text-accent-purple" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {credit.client?.name ?? t('credits.unknown')}
                      </p>
                      <p className="text-xs text-text-muted truncate">{identifier}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {credit.status === 'OVERDUE' ? (
                          <span className="text-xs font-medium text-danger">
                            {t('credits.overdueDays').replace('{days}', String(Math.max(0, daysOverdue)))}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">
                            {t('credits.due').replace('{date}', formatDate(nextDue.toISOString(), language))}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {t('credits.pendingVsOriginal')
                          .replace('{currency}', credit.currency)
                          .replace('{balance}', formatAmount(Number(credit.balance)))
                          .replace('{amount}', formatAmount(Number(credit.amount)))}
                      </p>
                      <p className="text-xs text-accent-orange font-medium mt-0.5">
                        {t('credits.installmentProgress')
                          .replace('{paid}', String(paidCount))
                          .replace('{total}', String(credit.installments))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end gap-1.5">
                      {statusBadge(credit.status, t)}
                      {(credit.status === 'ACTIVE' || credit.status === 'OVERDUE') && (
                        <button
                          onClick={(e) => handleQuickPayment(e, credit.id)}
                          className="px-2.5 py-1 text-xs font-medium text-accent-orange bg-stat-purple-bg rounded-lg hover:opacity-80 transition-opacity whitespace-nowrap"
                        >
                          {t('credits.registerPayment')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <RegisterPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => { setPaymentModalOpen(false); setPaymentCreditId(undefined); }}
        onSubmit={handlePaymentSubmit}
        credits={credits.filter((c) => c.status === 'ACTIVE' || c.status === 'OVERDUE')}
        defaultCreditId={paymentCreditId}
      />
    </div>
  );
};

export default CreditsPage;
