import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientService } from '../services/client.service';
import { paymentService } from '../services/payment.service';
import { Client, Credit, RecentPayment } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageLoader } from '../components/ui/Loader';
import { RegisterPaymentModal } from '../components/payments/RegisterPaymentModal';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/AlertContext';
import { formatDate, calculateNextDueDate } from '../utils/date';
import { FiUser, FiBriefcase, FiArrowLeft, FiChevronRight, FiDollarSign } from 'react-icons/fi';

const statusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'ACTIVE': return <Badge variant="info">{t('status.active')}</Badge>;
    case 'PAID': return <Badge variant="success">{t('status.paid')}</Badge>;
    case 'OVERDUE': return <Badge variant="danger">{t('status.overdue')}</Badge>;
    case 'CANCELLED': return <Badge variant="default">{t('status.cancelled')}</Badge>;
    case 'ARCHIVED': return <Badge variant="default">{t('status.archived')}</Badge>;
    default: return <Badge variant="default">{status}</Badge>;
  }
};

function getDaysInfo(credit: Credit) {
  const paidCount = credit.payments?.filter((p) => !p.isVoided).length ?? 0;
  const nextDue = calculateNextDueDate(credit.dueDate, paidCount, credit.frequency);
  const now = new Date();
  const diffMs = nextDue.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { days, nextDue, paidCount };
}

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCreditId, setPaymentCreditId] = useState<string | undefined>(undefined);
  const { t, language } = useLanguage();
  const { addToast } = useToast();

  const loadClient = () => {
    if (id) {
      clientService.getById(id).then((res) => setClient(res.data));
      clientService.getRecentPayments(id, 5).then((res) => setRecentPayments(res.data));
    }
  };

  useEffect(loadClient, [id]);

  const handleDelete = async () => {
    if (deleteConfirmText !== client?.name) return;
    try {
      await clientService.delete(id!);
      addToast('success', t('confirm.deleteClient.success'));
      navigate('/clients');
    } catch {
      addToast('error', t('confirm.deleteClient.error'));
    }
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
    addToast('success', t('creditDetail.successPayment'));
    loadClient();
  };

  if (!client) return <PageLoader />;

  const visibleCredits = client.credits?.filter((c) => c.status !== 'ARCHIVED') ?? [];

  // Alert logic
  const hasOverdue = visibleCredits.some((c) => c.status === 'OVERDUE');
  const soonCredits = visibleCredits
    .map((c) => ({ credit: c, ...getDaysInfo(c) }))
    .filter(({ days }) => days >= 0 && days <= 2);
  const alertBanner = hasOverdue
    ? { type: 'error' as const, message: t('clientDetail.overdueAlert') }
    : soonCredits.length > 0
    ? { type: 'warning' as const, message: soonCredits.some((s) => s.days === 0) ? t('clientDetail.dueToday') : t('clientDetail.dueSoonAlert').replace('{days}', String(Math.min(...soonCredits.map((s) => s.days)))) }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/clients" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent-purple transition-colors mb-2">
          <FiArrowLeft className="w-3 h-3" />
          {t('clientDetail.backToClients')}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stat-blue-bg flex items-center justify-center">
              <FiUser className="w-5 h-5 text-accent-indigo" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">{client.name}</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => navigate(`/clients/${id}/edit`)}>
              Editar
            </Button>
            <Button variant="ghost" className="text-xs text-text-muted" onClick={() => setShowDelete(true)}>
              Eliminar
            </Button>
            <Button variant="primary" onClick={() => navigate(`/credits/new?clientId=${client.id}`)}>
              {t('clientDetail.newCredit')}
            </Button>
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {alertBanner && (
        <Alert type={alertBanner.type} message={alertBanner.message} />
      )}

      {/* Summary metrics */}
      <Card title={t('clientDetail.summary')} accent="cyan">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-text-muted">{t('clientDetail.creditsCount').split('{count}')[0]}</p>
            <p className="text-lg font-bold text-text-primary">{visibleCredits.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted">{t('clientDetail.totalBorrowed')}</p>
            <p className="text-lg font-bold text-text-primary">
              ${Number(client.totalBorrowed ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted">{t('clientDetail.totalCollected')}</p>
            <p className="text-lg font-bold text-success">
              ${Number(client.totalCollected ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted">{t('clientDetail.debtArs')}</p>
            <p className="text-lg font-bold text-text-primary">
              ${Number(client.debtArs ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted">{t('clientDetail.debtUsd')}</p>
            <p className="text-lg font-bold text-text-primary">
              ${Number(client.debtUsd ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted">{t('clientDetail.clientSince')}</p>
            <p className="text-lg font-bold text-text-primary">
              {formatDate(client.clientSince ?? client.createdAt, language)}
            </p>
          </div>
        </div>
      </Card>

      {/* Credits list */}
      <Card title={t('clientDetail.credits')} accent="orange">
        {visibleCredits.length === 0 ? (
          <p className="text-text-muted text-sm">{t('clientDetail.noCredits')}</p>
        ) : (
          <div className="divide-y divide-border-subtle -mx-5">
            {visibleCredits.map((credit: Credit) => {
              const { days, paidCount } = getDaysInfo(credit);
              return (
                <div
                  key={credit.id}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-bg-card-hover transition-colors"
                  onClick={() => navigate(`/credits/${credit.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-stat-purple-bg flex items-center justify-center shrink-0">
                      <FiBriefcase className="w-4 h-4 text-accent-purple" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {credit.currency} {Number(credit.amount).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted mt-0.5">
                        <span>{t('clientDetail.installmentProgress').replace('{paid}', String(paidCount)).replace('{total}', String(credit.installments))}</span>
                        <span className="text-border">·</span>
                        {days < 0 ? (
                          <span className="text-danger font-medium">
                            {t('clientDetail.overdueDays').replace('{days}', String(Math.abs(days)))}
                          </span>
                        ) : days === 0 ? (
                          <span className="text-warning font-medium">{t('clientDetail.dueToday')}</span>
                        ) : days === 1 ? (
                          <span className="text-warning font-medium">{t('clientDetail.dueTomorrow')}</span>
                        ) : (
                          <span>{t('clientDetail.daysRemaining').replace('{days}', String(days))}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge(credit.status, t)}
                    <span className="text-sm font-semibold text-text-primary">
                      {credit.currency} {Number(credit.balance).toLocaleString()}
                    </span>
                    {(credit.status === 'ACTIVE' || credit.status === 'OVERDUE') && (
                      <button
                        className="text-xs text-accent-purple hover:text-accent-pink font-medium whitespace-nowrap transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentCreditId(credit.id);
                          setPaymentModalOpen(true);
                        }}
                      >
                        {t('clientDetail.registerPayment')}
                      </button>
                    )}
                    <FiChevronRight className="w-4 h-4 text-text-muted" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent activity */}
      <Card title={t('clientDetail.recentActivity')} accent="purple">
        {recentPayments.length === 0 ? (
          <p className="text-text-muted text-sm">{t('clientDetail.noRecentActivity')}</p>
        ) : (
          <div className="divide-y divide-border-subtle -mx-5">
            {recentPayments.map((rp) => (
              <div
                key={rp.id}
                className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-bg-card-hover transition-colors"
                onClick={() => navigate(`/credits/${rp.creditId}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stat-teal-bg flex items-center justify-center">
                    <FiDollarSign className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {rp.currency} ${Number(rp.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-text-muted">
                      {rp.creditDescription ?? `#${rp.installmentNumber ?? ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {rp.method === 'BIEN' && (
                    <Badge variant="info">Bien Material</Badge>
                  )}
                  <span className="text-text-muted">{formatDate(rp.date, language)}</span>
                  <FiChevronRight className="w-3 h-3 text-text-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payment modal */}
      <RegisterPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => { setPaymentModalOpen(false); setPaymentCreditId(undefined); }}
        onSubmit={handlePaymentSubmit}
        credits={visibleCredits}
        defaultCreditId={paymentCreditId}
      />

      {/* Delete dialog with double confirmation */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteConfirmText(''); }}
        onConfirm={handleDelete}
        title={t('confirm.deleteClient.title')}
        message={
          <div className="space-y-3">
            <p>{t('confirm.deleteClient.message')}</p>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Escribí <strong>{client.name}</strong> para confirmar
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={client.name}
                className="input-base w-full text-sm"
                autoFocus
              />
            </div>
          </div>
        }
        confirmText={t('confirm.deleteClient.confirm')}
        variant="danger"
        disabled={deleteConfirmText !== client.name}
      />
    </div>
  );
};

export default ClientDetailPage;
