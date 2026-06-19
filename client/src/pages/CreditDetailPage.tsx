import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { creditService } from '../services/credit.service';
import { paymentService } from '../services/payment.service';
import { Credit, Payment, PaymentBreakdown } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/AlertContext';
import { formatDate, calculateNextDueDate } from '../utils/date';
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
  const [paymentOriginalAmount, setPaymentOriginalAmount] = useState('');
  const [paymentInterestAmount, setPaymentInterestAmount] = useState('');
  const [paymentMoraAmount, setPaymentMoraAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);
  const [paymentBreakdownLoading, setPaymentBreakdownLoading] = useState(false);

  const paymentTotal = (parseFloat(paymentOriginalAmount || '0') + parseFloat(paymentInterestAmount || '0') + parseFloat(paymentMoraAmount || '0'));
  const isBien = paymentMethod === 'BIEN';

  const loadData = () => {
    if (id) {
      creditService.getById(id).then((res) => setCredit(res.data));
      paymentService.listByCredit(id).then((res) => setPayments(res.data));
    }
  };

  useEffect(loadData, [id]);

  useEffect(() => {
    if (showPaymentModal && id) {
      setPaymentBreakdownLoading(true);
      paymentService.calculateBreakdown(id)
        .then((res) => {
          const b = res.data;
          setPaymentBreakdown(b);
          if (b.currentInstallment) {
            setPaymentOriginalAmount(b.currentInstallment.originalAmount.toFixed(2));
            setPaymentInterestAmount(b.currentInstallment.interestAmount.toFixed(2));
            setPaymentMoraAmount(b.currentInstallment.moraAmount.toFixed(2));
          }
        })
        .catch(() => setPaymentBreakdown(null))
        .finally(() => setPaymentBreakdownLoading(false));
    } else {
      setPaymentBreakdown(null);
      setPaymentOriginalAmount('');
      setPaymentInterestAmount('');
      setPaymentMoraAmount('');
      setPaymentNote('');
      setPaymentMethod('CASH');
    }
  }, [showPaymentModal, id]);

  const handleRegisterPayment = async () => {
    if (!id) return;
    const orig = parseFloat(paymentOriginalAmount || '0');
    const inter = parseFloat(paymentInterestAmount || '0');
    const mora = parseFloat(paymentMoraAmount || '0');
    if (paymentTotal <= 0) { addToast('error', 'El total debe ser mayor a 0'); return; }
    if (isBien && !paymentNote.trim()) { addToast('error', 'Debe describir el bien material utilizado'); return; }
    try {
      await paymentService.register({
        creditId: id,
        amount: parseFloat(paymentTotal.toFixed(2)),
        originalAmount: orig,
        interestAmount: inter,
        moraAmount: mora,
        note: paymentNote,
        method: paymentMethod,
      });
      setShowPaymentModal(false);
      setPaymentOriginalAmount('');
      setPaymentInterestAmount('');
      setPaymentMoraAmount('');
      setPaymentNote('');
      setPaymentMethod('CASH');
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

  const formatMoney = (val: number) => credit
    ? `${credit.currency} $${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${val.toFixed(2)}`;

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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
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
          <p className="text-xs text-text-muted uppercase tracking-wider">Próxima cuota</p>
          <p className="text-lg font-bold text-accent-cyan mt-1">
            {formatDate(calculateNextDueDate(credit.dueDate, credit.payments?.length ?? 0, credit.frequency).toISOString(), language)}
          </p>
        </div>
        {credit.moraType && credit.moraRate ? (
          <div className="card p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider">Mora</p>
            <p className="text-lg font-bold text-danger mt-1">
              {credit.moraType === 'FIXED_AMOUNT' ? '$' : ''}{Number(credit.moraRate).toFixed(2)}{credit.moraType === 'PERCENTAGE' ? '%' : ''} / {credit.moraPeriod === 'DAILY' ? 'día' : credit.moraPeriod === 'WEEKLY' ? 'semana' : 'mes'}
            </p>
          </div>
        ) : (
          <div className="card p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider">{t('creditDetail.status')}</p>
            <div className="mt-1.5">{statusBadge(credit.status, t)}</div>
          </div>
        )}
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
                      {payment.method === 'BIEN' && <span className="ml-1 text-warning">(Bien)</span>}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Cap: ${Number(payment.originalAmount || 0).toFixed(2)} | Int: ${Number(payment.interestAmount || 0).toFixed(2)}{Number(payment.moraAmount || 0) > 0 ? ` | Mora: $${Number(payment.moraAmount).toFixed(2)}` : ''}
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

          {/* Breakdown */}
          {paymentBreakdownLoading ? (
            <p className="text-sm text-text-muted text-center">Calculando...</p>
          ) : paymentBreakdown ? (
            <div className="bg-bg-input rounded-lg p-4 border border-border-subtle space-y-3">
              {paymentBreakdown.currentInstallment ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">
                      Cuota a pagar (FIFO) #{paymentBreakdown.currentInstallment.number} de {paymentBreakdown.currentInstallment.totalInstallments}
                    </span>
                    {paymentBreakdown.currentInstallment.daysLate > 0 ? (
                      <span className="text-xs font-medium text-danger bg-stat-red-bg px-2 py-0.5 rounded">
                        {paymentBreakdown.currentInstallment.daysLate} día(s) de atraso
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-success bg-stat-teal-bg px-2 py-0.5 rounded">
                        A tiempo
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-text-primary w-20">Capital:</label>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentOriginalAmount}
                          onChange={(e) => setPaymentOriginalAmount(e.target.value)}
                          className="input-base w-full pl-6 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-text-primary w-20">Interés:</label>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentInterestAmount}
                          onChange={(e) => setPaymentInterestAmount(e.target.value)}
                          className="input-base w-full pl-6 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-text-primary w-20">Mora:</label>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentMoraAmount}
                          onChange={(e) => setPaymentMoraAmount(e.target.value)}
                          className="input-base w-full pl-6 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border-subtle pt-2 flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-primary">Total esta cuota</span>
                    <span className="text-sm font-bold text-accent-orange">{formatMoney(paymentTotal)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-success text-center font-medium">Todas las cuotas están pagadas</p>
              )}

              {paymentBreakdown.overdueInstallments.length > 1 && (
                <div className="border-t border-border-subtle pt-3">
                  <p className="text-xs font-semibold text-text-muted mb-2">Cuotas vencidas</p>
                  <div className="space-y-1.5">
                    {paymentBreakdown.overdueInstallments.map((oi) => (
                      <div key={oi.number} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-bg-card">
                        <span className="text-text-primary">#{oi.number}</span>
                        <span className="text-text-muted">{oi.daysLate} día(s) atraso</span>
                        <span className="text-danger font-medium">{formatMoney(oi.moraAmount)}</span>
                        <span className="text-text-primary font-medium">{formatMoney(oi.totalWithMora)}</span>
                      </div>
                    ))}
                  </div>
                  {paymentBreakdown.totalOverdueMora > 0 && (
                    <p className="text-xs text-text-muted text-right mt-2">
                      Mora total: <span className="text-danger font-semibold">{formatMoney(paymentBreakdown.totalOverdueMora)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('payments.register.method')}</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-base w-full"
            >
              <option value="CASH">{t('payments.method.cash')}</option>
              <option value="TRANSFER">{t('payments.method.transfer')}</option>
              <option value="DEBIT_CARD">{t('payments.method.debitCard')}</option>
              <option value="CREDIT_CARD">{t('payments.method.creditCard')}</option>
              <option value="OTHER">{t('payments.method.other')}</option>
              <option value="BIEN">Bien Material</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {isBien ? 'Bien material utilizado *' : t('creditDetail.note')}
            </label>
            <textarea
              className="input-base min-h-[60px]"
              rows={2}
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder={isBien ? 'Ej: TV LCD, teléfono, mueble...' : ''}
            />
            {isBien && <p className="text-xs text-danger mt-1">Campo obligatorio para pagos con bien material</p>}
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