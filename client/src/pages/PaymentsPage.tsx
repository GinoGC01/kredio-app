import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../services/payment.service';
import { creditService } from '../services/credit.service';
import { Payment, PaymentStats, PaymentMethod, Period, Credit } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DateSegmentFilter } from '../components/ui/DateSegmentFilter';
import { PageLoader } from '../components/ui/Loader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/AlertContext';
import { formatDate } from '../utils/date';
import { PaymentStatsBar } from '../components/payments/PaymentStatsBar';
import { PaymentFilters } from '../components/payments/PaymentFilters';
import { RegisterPaymentModal } from '../components/payments/RegisterPaymentModal';
import { Pagination } from '../components/payments/Pagination';
import { FiDollarSign, FiPlus, FiDownload, FiEye, FiXCircle } from 'react-icons/fi';

const PAYMENT_METHOD_VARIANTS: Record<PaymentMethod, { variant: 'info' | 'success' | 'warning' | 'default' | 'danger' }> = {
  CASH: { variant: 'success' },
  TRANSFER: { variant: 'info' },
  DEBIT_CARD: { variant: 'warning' },
  CREDIT_CARD: { variant: 'danger' },
  OTHER: { variant: 'default' },
  BIEN: { variant: 'warning' },
};

const PaymentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { addToast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [voidingPaymentId, setVoidingPaymentId] = useState<string | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  // const [showDetailId, setShowDetailId] = useState<string | null>(null);

  // Filter state from URL params
  const period = (searchParams.get('period') as Period) || 'all';
  const search = searchParams.get('search') || '';
  const currency = searchParams.get('currency') || '';
  const method = searchParams.get('method') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sortBy') || 'date';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  const dateFrom = searchParams.get('from') || '';
  const dateTo = searchParams.get('to') || '';

  const updateSearchParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentService.list({
        period: period !== 'all' ? period : undefined,
        search: search || undefined,
        currency: currency || undefined,
        method: method || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page,
        limit,
      });
      setPayments(res.data.data);
      setTotal(res.data.total);
      setPage(res.data.page);
      setTotalPages(Math.ceil(res.data.total / res.data.limit));
    } catch {
      addToast('error', t('payments.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [period, search, currency, method, status, sortBy, sortOrder, dateFrom, dateTo, page, limit, t, addToast]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await paymentService.getStats({
        period: period !== 'all' ? period : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });
      setStats(res.data);
    } catch {
      // Stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, [period, dateFrom, dateTo]);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await creditService.list();
      setCredits(res.data);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const handlePeriodChange = (newPeriod: Period) => {
    const params = new URLSearchParams(searchParams);
    if (newPeriod === 'all') {
      params.delete('period');
    } else {
      params.set('period', newPeriod);
    }
    params.delete('from');
    params.delete('to');
    params.delete('page');
    setSearchParams(params);
  };

  const handleRegisterPayment = async (data: { creditId: string; amount: number; originalAmount: number; interestAmount: number; moraAmount: number; method: string; note?: string; date?: string }) => {
    await paymentService.register(data);
    addToast('success', t('payments.successRegister'));
    fetchPayments();
    fetchStats();
    fetchCredits();
  };

  const handleVoidPayment = async () => {
    if (!voidingPaymentId) return;
    try {
      await paymentService.remove(voidingPaymentId);
      addToast('success', t('payments.successVoid'));
      fetchPayments();
      fetchStats();
      fetchCredits();
    } catch {
      addToast('error', t('payments.errorVoid'));
    } finally {
      setShowVoidConfirm(false);
      setVoidingPaymentId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Cliente', 'Crédito', 'Capital', 'Interés', 'Mora', 'Total', 'Moneda', 'Método', 'Cuota', 'Fecha', 'Nota'];
    const rows = payments.map((p) => [
      p.credit?.client?.name || '',
      p.credit?.description || p.creditId,
      Number(p.originalAmount || 0).toFixed(2),
      Number(p.interestAmount || 0).toFixed(2),
      Number(p.moraAmount || 0).toFixed(2),
      Number(p.amount).toFixed(2),
      p.credit?.currency || '',
      t(`payments.method.${p.method.toLowerCase()}`),
      p.installmentNumber ? `${p.installmentNumber}/${p.credit?.installments}` : '',
      new Date(p.date).toLocaleDateString(),
      p.note || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPaymentStatus = (payment: Payment): { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' } => {
    if (!payment.credit?.dueDate) return { label: t('payments.status.onTime'), variant: 'success' };

    if (payment.credit.status === 'PAID') {
      return { label: t('payments.status.paid'), variant: 'success' };
    }

    if (payment.credit.status === 'CANCELLED') {
      return { label: t('payments.status.cancelled'), variant: 'default' };
    }

    const paymentDate = new Date(payment.date);
    const dueDate = new Date(payment.credit.dueDate);

    if (payment.installmentNumber && payment.credit.installments) {
      const freq = payment.credit.frequency;
      if (freq === 'WEEKLY') dueDate.setDate(dueDate.getDate() + (payment.installmentNumber - 1) * 7);
      else if (freq === 'BIWEEKLY') dueDate.setDate(dueDate.getDate() + (payment.installmentNumber - 1) * 14);
      else if (freq === 'MONTHLY') dueDate.setMonth(dueDate.getMonth() + (payment.installmentNumber - 1));
    }

    const diffDays = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= -1) return { label: t('payments.status.early'), variant: 'info' };
    if (diffDays <= 0) return { label: t('payments.status.onTime'), variant: 'success' };
    return { label: t('payments.status.lateDays').replace('{days}', diffDays.toString()), variant: 'danger' };
  };

  if (loading && payments.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">{t('payments.title')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <FiDownload className="w-4 h-4" />
            CSV
          </Button>
          <Button onClick={() => setShowRegisterModal(true)}>
            <FiPlus className="w-4 h-4" />
            {t('payments.registerPayment')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <PaymentStatsBar stats={stats} loading={statsLoading} onOverdueClick={() => navigate('/credits?status=OVERDUE')} />

      {/* Date Filter */}
      <DateSegmentFilter value={period} onChange={handlePeriodChange} />

      {/* Filters */}
      <PaymentFilters
        search={search}
        onSearchChange={(v) => updateSearchParam('search', v)}
        currency={currency}
        onCurrencyChange={(v) => updateSearchParam('currency', v)}
        method={method}
        onMethodChange={(v) => updateSearchParam('method', v)}
        status={status}
        onStatusChange={(v) => updateSearchParam('status', v)}
        sortBy={sortBy}
        onSortByChange={(v) => updateSearchParam('sortBy', v)}
        sortOrder={sortOrder}
        onSortOrderChange={() => updateSearchParam('sortOrder', sortOrder === 'desc' ? 'asc' : 'desc')}
        dateFrom={dateFrom}
        onDateFromChange={(v) => updateSearchParam('from', v)}
        dateTo={dateTo}
        onDateToChange={(v) => updateSearchParam('to', v)}
      />

      {/* Payments List */}
      <Card accent="pink">
        {payments.length === 0 ? (
          <p className="text-text-muted text-center py-8">{t('payments.noPayments')}</p>
        ) : (
          <div className="divide-y divide-border-subtle -mx-5">
              {payments.map((payment) => {
                const statusInfo = getPaymentStatus(payment);
                const methodCfg = PAYMENT_METHOD_VARIANTS[payment.method] || PAYMENT_METHOD_VARIANTS.OTHER;

                return (
                  <div
                    key={payment.id}
                    className="px-5 py-4 hover:bg-bg-card-hover transition-colors cursor-pointer"
                    onClick={() => navigate(`/payments/${payment.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          payment.credit?.currency === 'USD' ? 'bg-stat-blue-bg text-warning' : 'bg-stat-teal-bg text-success'
                        }`}>
                          <FiDollarSign className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-text-primary">
                              {payment.credit?.client?.name ?? t('payments.unknown')}
                            </span>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted flex-wrap">
                            <span>{formatDate(payment.date, language)}</span>
                            <span>·</span>
                            <Badge variant={methodCfg.variant}>{t(`payments.method.${payment.method.toLowerCase()}`)}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-sm font-bold ${payment.credit?.currency === 'USD' ? 'text-warning' : 'text-success'}`}>
                            {payment.credit?.currency ?? 'ARS'} ${Number(payment.amount).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/credits/${payment.creditId}`)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-input hover:text-text-primary transition-colors"
                            title={t('payments.viewDetail')}
                          >
                            <FiEye className="w-3.5 h-3.5" />
                          </button>
                          {!payment.isVoided && (
                            <button
                              onClick={() => { setShowVoidConfirm(true); setVoidingPaymentId(payment.id); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-stat-red-bg hover:text-danger transition-colors"
                              title={t('payments.void')}
                            >
                              <FiXCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(p) => updateSearchParam('page', p.toString())}
        />
      </Card>

      {/* Register Payment Modal */}
      <RegisterPaymentModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSubmit={handleRegisterPayment}
        credits={credits}
      />

      {/* Void Confirm Dialog */}
      <ConfirmDialog
        isOpen={showVoidConfirm}
        onClose={() => { setShowVoidConfirm(false); setVoidingPaymentId(null); }}
        onConfirm={handleVoidPayment}
        title={t('payments.voidConfirmTitle')}
        message={t('payments.voidConfirmMessage')}
        confirmText={t('payments.voidConfirm')}
        variant="danger"
      />
    </div>
  );
};

export default PaymentsPage;
