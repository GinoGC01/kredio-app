import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../services/payment.service';
import { Payment, PaymentMethod } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/AlertContext';
import { formatDate } from '../utils/date';
import { FiArrowLeft } from 'react-icons/fi';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  DEBIT_CARD: 'Débito',
  CREDIT_CARD: 'Crédito',
  OTHER: 'Otro',
  BIEN: 'Bien Material',
};

const statusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'ACTIVE': return <Badge variant="info">{t('status.active')}</Badge>;
    case 'PAID': return <Badge variant="success">{t('status.paid')}</Badge>;
    case 'OVERDUE': return <Badge variant="danger">{t('status.overdue')}</Badge>;
    case 'CANCELLED': return <Badge variant="default">{t('status.cancelled')}</Badge>;
    default: return <Badge variant="default">{status}</Badge>;
  }
};

const PaymentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    paymentService.getById(id)
      .then((res) => setPayment(res.data))
      .catch(() => addToast('error', 'Error al cargar el pago'))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  if (loading) return <PageLoader />;
  if (!payment) return null;

  const credit = payment.credit;
  const client = credit?.client;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/payments')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-input hover:text-text-primary transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {t('payments.title')}
          </h1>
          <p className="text-sm text-text-muted">
            {client?.name ?? t('payments.unknown')} — {credit?.description || ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card accent="pink" title="Detalle del Pago">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <span className="text-sm text-text-muted">{t('payments.register.amount')}</span>
                <span className={`text-lg font-bold ${credit?.currency === 'USD' ? 'text-warning' : 'text-success'}`}>
                  {credit?.currency ?? 'ARS'} ${Number(payment.amount).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-bg-card">
                  <p className="text-xs text-text-muted mb-1">Capital</p>
                  <p className="text-sm font-semibold text-text-primary">
                    ${Number(payment.originalAmount).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-bg-card">
                  <p className="text-xs text-text-muted mb-1">Interés</p>
                  <p className="text-sm font-semibold text-text-primary">
                    ${Number(payment.interestAmount).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-bg-card">
                  <p className="text-xs text-text-muted mb-1">Mora</p>
                  <p className="text-sm font-semibold text-danger">
                    ${Number(payment.moraAmount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border-subtle">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Saldo anterior</span>
                  <span className="text-xs text-text-muted">
                    ${Number(payment.previousBalance).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card accent="cyan" title="Información">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Fecha</span>
                <span className="text-sm text-text-primary">{formatDate(payment.date, language)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{t('payments.register.method')}</span>
                <Badge variant={payment.method === 'BIEN' ? 'warning' : 'info'}>
                  {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                </Badge>
              </div>
              {payment.installmentNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Cuota</span>
                  <span className="text-sm text-text-primary">{payment.installmentNumber}/{credit?.installments}</span>
                </div>
              )}
              {payment.note && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">{t('payments.register.note')}</span>
                  <span className="text-sm text-text-primary italic">{payment.note}</span>
                </div>
              )}
              {payment.isVoided && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Estado</span>
                  <Badge variant="danger">Anulado</Badge>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card accent="purple" title={t('payments.register.selectCredit') || 'Crédito'}>
            {credit && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Moneda</span>
                  <span className={`text-sm font-semibold ${credit.currency === 'USD' ? 'text-warning' : 'text-success'}`}>
                    {credit.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Cuotas</span>
                  <span className="text-sm text-text-primary">{credit.installments} ({credit.frequency})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Saldo</span>
                  <span className="text-sm font-semibold text-text-primary">
                    ${Number(credit.balance).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Estado</span>
                  {statusBadge(credit.status, t)}
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/credits/${credit.id}`)}
                  >
                    Ver Crédito Completo
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {client && (
            <Card accent="teal" title={t('payments.register.client') || 'Cliente'}>
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-primary">{client.name}</p>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  Ver Cliente
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailPage;
