import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { creditService } from '../services/credit.service';
import { Credit } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { FiDollarSign, FiChevronRight } from 'react-icons/fi';

const statusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'ACTIVE': return <Badge variant="info">{t('status.active')}</Badge>;
    case 'PAID': return <Badge variant="success">{t('status.paid')}</Badge>;
    case 'OVERDUE': return <Badge variant="danger">{t('status.overdue')}</Badge>;
    case 'CANCELLED': return <Badge variant="default">{t('status.cancelled')}</Badge>;
    default: return <Badge variant="default">{status}</Badge>;
  }
};

const CreditsPage = () => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    creditService.list().then((res) => setCredits(res.data.filter((c) => c.status !== 'ARCHIVED'))).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t('credits.title')}</h1>
        <Link
          to="/credits/new"
          className="px-4 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t('credits.newCredit')}
        </Link>
      </div>

      <Card hover={false}>
        {credits.length === 0 ? (
          <p className="text-text-muted text-center py-8">{t('credits.noCredits')}</p>
        ) : (
          <div className="divide-y divide-border-subtle -mx-5">
            {credits.map((credit) => (
              <div
                key={credit.id}
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-bg-card-hover transition-colors"
                onClick={() => navigate(`/credits/${credit.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stat-purple-bg flex items-center justify-center">
                    <FiDollarSign className="w-4 h-4 text-accent-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {credit.client?.name ?? t('credits.unknown')}
                    </p>
                    <p className="text-xs text-text-muted">
                      {t('credits.due').replace('{date}', new Date(credit.dueDate).toLocaleDateString())}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(credit.status, t)}
                  <span className="text-sm font-semibold text-text-primary">
                    {credit.currency} {Number(credit.amount).toLocaleString()}
                  </span>
                  <FiChevronRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CreditsPage;
