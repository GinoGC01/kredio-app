import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { creditService } from '../services/credit.service';
import { paymentService } from '../services/payment.service';
import { Credit, Payment } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/AlertContext';
import { formatDate } from '../utils/date';
import { FiArrowLeft, FiCalendar } from 'react-icons/fi';

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

const CreditDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const [credit, setCredit] = useState<Credit | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const loadData = () => {
    if (id) {
      creditService.getById(id).then((res) => setCredit(res.data));
      paymentService.listByCredit(id).then((res) => setPayments(res.data));
    }
  };

  useEffect(loadData, [id]);

  const handleRegisterPayment = async () => {
    if (!paymentAmount || !id) return;
    try {
      await paymentService.register({
        creditId: id,
        amount: parseFloat(paymentAmount),
        note: paymentNote,
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
      addToast('success', t('creditDetail.successPayment'));
      loadData();
    } catch {
      addToast('error', t('creditDetail.errorPayment'));
    }
  };

  const handleArchive = async () => {
    try {
      await creditService.archive(id!);
      addToast('success', t('confirm.archiveCredit.success'));
      loadData();
    } catch {
      addToast('error', t('confirm.archiveCredit.error'));
    }
  };

  const isEditable = credit && !['PAID', 'CANCELLED', 'ARCHIVED'].includes(credit.status);

  if (!credit) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/credits" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent-purple transition-colors mb-2">
          <FiArrowLeft className="w-3 h-3" />
          {t('creditDetail.backToCredits')}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Crédito - {credit.currency} {Number(credit.amount).toLocaleString()}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {t('creditDetail.client').replace('{name}', credit.client?.name ?? '')}
            </p>
          </div>
          {isEditable && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate(`/credits/${id}/edit`)}>
                Editar
              </Button>
              <Button variant="secondary" onClick={() => setShowArchiveDialog(true)}>
                Archivar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="card p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">{t('creditDetail.total')}</p>
          <p className="text-xl font-bold text-text-primary mt-1">{credit.currency} {Number(credit.totalAmount).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">{t('creditDetail.balance')}</p>
          <p className="text-xl font-bold text-accent-purple mt-1">{credit.currency} {Number(credit.balance).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">{t('creditDetail.interestRate')}</p>
          <p className="text-xl font-bold text-text-primary mt-1">{credit.interestRate}%</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">{t('creditDetail.status')}</p>
          <div className="mt-1.5">{statusBadge(credit.status, t)}</div>
        </div>
      </div>

      {/* Payments section */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">{t('creditDetail.payments')}</h2>
        {credit.status !== 'PAID' && credit.status !== 'CANCELLED' && credit.status !== 'ARCHIVED' && (
          <Button onClick={() => setShowPaymentModal(true)}>{t('creditDetail.registerPayment')}</Button>
        )}
      </div>

      <Card accent="indigo">
        {payments.length === 0 ? (
          <p className="text-text-muted text-sm">{t('creditDetail.noPayments')}</p>
        ) : (
          <div className="divide-y divide-border-subtle -mx-5">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stat-teal-bg flex items-center justify-center">
                    <FiCalendar className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {credit.currency} {Number(payment.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(payment.date, language)}
                      {payment.note && ` - ${payment.note}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={t('creditDetail.registerPayment')}>
        <div className="space-y-4">
          <div className="bg-bg-card rounded-lg p-4 space-y-2 text-sm border border-border-subtle">
            <div className="flex justify-between">
              <span className="text-text-muted">Monto original</span>
              <span className="font-medium">{credit.currency} {Number(credit.totalAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Saldo pendiente</span>
              <span className="font-semibold text-accent-purple">{credit.currency} {Number(credit.balance).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Cuotas</span>
              <span className="font-medium">{credit.installments} cuotas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Valor por cuota</span>
              <span className="font-medium">{credit.currency} {(Number(credit.totalAmount) / credit.installments).toLocaleString()}</span>
            </div>
          </div>
          <Input
            label={t('creditDetail.amount')}
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('creditDetail.note')}</label>
            <textarea
              className="input-base min-h-[60px]"
              rows={2}
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleRegisterPayment}>{t('creditDetail.register')}</Button>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>{t('creditDetail.cancel')}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showArchiveDialog}
        onClose={() => setShowArchiveDialog(false)}
        onConfirm={handleArchive}
        title={t('confirm.archiveCredit.title')}
        message={t('confirm.archiveCredit.message')}
        confirmText={t('confirm.archiveCredit.confirm')}
        variant="warning"
      />
    </div>
  );
};

export default CreditDetailPage;
