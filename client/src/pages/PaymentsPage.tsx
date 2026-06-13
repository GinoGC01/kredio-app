import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/payment.service';
import { Payment, Period } from '../types';
import { Card } from '../components/ui/Card';
import { DateSegmentFilter } from '../components/ui/DateSegmentFilter';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { formatDate } from '../utils/date';
import { FiDollarSign } from 'react-icons/fi';

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();

  const period = (searchParams.get('period') as Period) || 'all';

  const fetchPayments = useCallback(() => {
    const filter = period === 'all' ? undefined : { period };
    paymentService.list(filter).then((res) => setPayments(res.data)).finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handlePeriodChange = (newPeriod: Period) => {
    setSearchParams(newPeriod === 'all' ? {} : { period: newPeriod });
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">{t('payments.title')}</h1>
        <DateSegmentFilter value={period} onChange={handlePeriodChange} />
      </div>
      <Card accent="pink">
        {payments.length === 0 ? (
          <p className="text-text-muted text-center py-8">{t('payments.noPayments')}</p>
        ) : (
          <div className="divide-y divide-border-subtle -mx-5">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stat-teal-bg flex items-center justify-center">
                    <FiDollarSign className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {payment.credit?.client?.name ?? t('payments.unknown')}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(payment.date, language)}
                      {payment.note && ` - ${payment.note}`}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-success">
                  {payment.credit?.currency ?? 'ARS'} {Number(payment.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentsPage;
