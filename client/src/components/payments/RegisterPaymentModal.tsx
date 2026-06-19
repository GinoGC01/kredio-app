import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useLanguage } from '../../context/LanguageContext';
import { Credit, PaymentBreakdown } from '../../types';
import { paymentService } from '../../services/payment.service';

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    creditId: string;
    amount: number;
    originalAmount: number;
    interestAmount: number;
    moraAmount: number;
    method: string;
    note?: string;
    date?: string;
  }) => Promise<void>;
  credits: Credit[];
  defaultCreditId?: string;
}

export const RegisterPaymentModal = ({ isOpen, onClose, onSubmit, credits, defaultCreditId }: RegisterPaymentModalProps) => {
  const { t } = useLanguage();
  const [creditId, setCreditId] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [interestAmount, setInterestAmount] = useState('');
  const [moraAmount, setMoraAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  const selectedCredit = credits.find((c) => c.id === creditId);
  const total = (parseFloat(originalAmount || '0') + parseFloat(interestAmount || '0') + parseFloat(moraAmount || '0'));
  const isBien = method === 'BIEN';

  useEffect(() => {
    if (isOpen) {
      setCreditId(defaultCreditId || '');
      setOriginalAmount('');
      setInterestAmount('');
      setMoraAmount('');
      setMethod('CASH');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
      setBreakdown(null);
    }
  }, [isOpen, defaultCreditId]);

  useEffect(() => {
    if (!creditId) {
      setBreakdown(null);
      return;
    }
    setLoadingBreakdown(true);
    paymentService.calculateBreakdown(creditId)
      .then((res) => {
        const b = res.data;
        setBreakdown(b);
        if (b.currentInstallment) {
          setOriginalAmount(b.currentInstallment.originalAmount.toFixed(2));
          setInterestAmount(b.currentInstallment.interestAmount.toFixed(2));
          setMoraAmount(b.currentInstallment.moraAmount.toFixed(2));
        }
      })
      .catch(() => setBreakdown(null))
      .finally(() => setLoadingBreakdown(false));
  }, [creditId]);

  const handleSubmit = async () => {
    if (!creditId) { setError(t('payments.register.selectCredit')); return; }
    const orig = parseFloat(originalAmount || '0');
    const inter = parseFloat(interestAmount || '0');
    const mora = parseFloat(moraAmount || '0');
    if (total <= 0) { setError('El total debe ser mayor a 0'); return; }
    if (isBien && !note.trim()) { setError('Debe describir el bien material utilizado para el pago'); return; }

    if (selectedCredit && (orig + inter) > Number(selectedCredit.balance)) {
      setError('El capital + interés supera el saldo restante del crédito');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        creditId,
        amount: parseFloat(total.toFixed(2)),
        originalAmount: orig,
        interestAmount: inter,
        moraAmount: mora,
        method,
        note: note || undefined,
        date: date || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('payments.register.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (val: number) => selectedCredit
    ? `${selectedCredit.currency} $${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${val.toFixed(2)}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('payments.register.title')}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">{t('payments.register.selectCredit')}</label>
          <select
            value={creditId}
            onChange={(e) => setCreditId(e.target.value)}
            className="input-base w-full"
          >
            <option value="">{t('payments.register.selectCredit')}</option>
            {credits.filter((c) => c.status === 'ACTIVE' || c.status === 'OVERDUE').map((c) => (
              <option key={c.id} value={c.id}>
                {c.client?.name} - {c.currency} ${Number(c.amount).toLocaleString()} ({t('payments.register.balance')}: ${Number(c.balance).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {selectedCredit && (
          <div className="text-xs text-text-muted bg-bg-input rounded-lg p-3 space-y-1">
            <p>{t('payments.register.client')}: <span className="text-text-primary font-medium">{selectedCredit.client?.name}</span></p>
            <p>{t('payments.register.total')}: <span className="text-text-primary">{selectedCredit.currency} ${Number(selectedCredit.totalAmount).toLocaleString()}</span></p>
            <p>{t('payments.register.balance')}: <span className="text-text-primary font-semibold">{selectedCredit.currency} ${Number(selectedCredit.balance).toLocaleString()}</span></p>
          </div>
        )}

        {/* Breakdown section */}
        {creditId && (
          <div className="bg-bg-input rounded-lg p-4 border border-border-subtle">
            {loadingBreakdown ? (
              <p className="text-sm text-text-muted text-center">Calculando...</p>
            ) : breakdown ? (
              <div className="space-y-3">
                {breakdown.currentInstallment ? (
                  <>
                    {/* Current installment (FIFO) */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary">
                        Cuota a pagar (FIFO) #{breakdown.currentInstallment.number} de {breakdown.currentInstallment.totalInstallments}
                      </span>
                      {breakdown.currentInstallment.daysLate > 0 ? (
                        <span className="text-xs font-medium text-danger bg-stat-red-bg px-2 py-0.5 rounded">
                          {breakdown.currentInstallment.daysLate} día(s) de atraso
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-success bg-stat-teal-bg px-2 py-0.5 rounded">
                          A tiempo
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-text-primary w-24">Capital:</label>
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={originalAmount}
                            onChange={(e) => setOriginalAmount(e.target.value)}
                            className="input-base w-full pl-6 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-text-primary w-24">Interés:</label>
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={interestAmount}
                            onChange={(e) => setInterestAmount(e.target.value)}
                            className="input-base w-full pl-6 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-text-primary w-24">Mora:</label>
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={moraAmount}
                            onChange={(e) => setMoraAmount(e.target.value)}
                            className="input-base w-full pl-6 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border-subtle pt-2 flex justify-between items-center">
                      <span className="text-sm font-semibold text-text-primary">Total esta cuota</span>
                      <span className="text-sm font-bold text-accent-orange">{formatMoney(total)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-text-success text-center font-medium">Todas las cuotas están pagadas</p>
                )}

                {/* Overdue installments list */}
                {breakdown.overdueInstallments.length > 1 && (
                  <div className="border-t border-border-subtle pt-3">
                    <p className="text-xs font-semibold text-text-muted mb-2">Cuotas vencidas</p>
                    <div className="space-y-1.5">
                      {breakdown.overdueInstallments.map((oi) => (
                        <div key={oi.number} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-bg-card">
                          <span className="text-text-primary">#{oi.number}</span>
                          <span className="text-text-muted">{oi.daysLate} día(s) atraso</span>
                          <span className="text-danger font-medium">{formatMoney(oi.moraAmount)}</span>
                          <span className="text-text-primary font-medium">{formatMoney(oi.totalWithMora)}</span>
                        </div>
                      ))}
                    </div>
                    {breakdown.totalOverdueMora > 0 && (
                      <p className="text-xs text-text-muted text-right mt-2">
                        Mora total acumulada: <span className="text-danger font-semibold">{formatMoney(breakdown.totalOverdueMora)}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center">No se pudo calcular el desglose</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('payments.register.method')}</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
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
        </div>

        <Input
          label={t('payments.register.date')}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <Input
          label={isBien ? 'Bien material utilizado *' : t('payments.register.note')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isBien ? 'Ej: TV LCD, teléfono, mueble...' : t('payments.register.notePlaceholder')}
        />
        {isBien && <p className="text-xs text-danger">Campo obligatorio para pagos con bien material</p>}

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>{t('payments.register.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('payments.register.submitting') : t('payments.register.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};