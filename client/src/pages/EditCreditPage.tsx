import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { creditService } from '../services/credit.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/AlertContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const EditCreditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    amount: '',
    interestRate: '',
    installments: '',
    frequency: 'MONTHLY',
    currency: 'ARS',
    description: '',
    dueDate: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      creditService.getById(id).then((res) => {
        const c = res.data;
        setForm({
          clientName: c.client?.name ?? '',
          amount: String(c.amount),
          interestRate: String(c.interestRate),
          installments: String(c.installments),
          frequency: c.frequency,
          currency: c.currency,
          description: c.description || '',
          dueDate: c.dueDate.slice(0, 10),
        });
      }).catch(() => setError(t('editCredit.errorLoad')))
      .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.installments || !form.dueDate) {
      setError(t('createCredit.requiredFields'));
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    try {
      await creditService.update(id!, {
        amount: parseFloat(form.amount),
        interestRate: parseFloat(form.interestRate || '0'),
        installments: parseInt(form.installments),
        frequency: form.frequency as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
        description: form.description,
        dueDate: form.dueDate,
      });
      addToast('success', t('editCredit.success'));
      navigate(`/credits/${id}`);
    } catch {
      setError(t('editCredit.error'));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-text-primary">{t('editCredit.title')}</h1>
      <Card hover={false}>
        {error && <div className="bg-stat-red-bg text-danger p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('createCredit.client')}</label>
            <input
              className="input-base !bg-bg-card !text-text-muted cursor-not-allowed"
              value={form.clientName}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('createCredit.currency')}</label>
            <input
              className="input-base !bg-bg-card !text-text-muted cursor-not-allowed"
              value={form.currency === 'USD' ? 'USD - Dólares' : 'ARS - Pesos'}
              disabled
            />
          </div>
          <Input
            label={t('createCredit.amount')}
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <Input
            label={t('createCredit.interestRate')}
            type="number"
            step="0.01"
            value={form.interestRate}
            onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('createCredit.frequency')}</label>
            <select
              className="input-base"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              required
            >
              <option value="WEEKLY">{t('createCredit.weekly')}</option>
              <option value="BIWEEKLY">{t('createCredit.biweekly')}</option>
              <option value="MONTHLY">{t('createCredit.monthly')}</option>
            </select>
          </div>
          <Input
            label={t('createCredit.installments')}
            type="number"
            value={form.installments}
            onChange={(e) => setForm({ ...form, installments: e.target.value })}
            required
          />
          <Input
            label={t('createCredit.dueDate')}
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('createCredit.description')}</label>
            <textarea
              className="input-base min-h-[72px]"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit">{t('editCredit.save')}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/credits/${id}`)}>
              {t('editCredit.cancel')}
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title={t('confirm.editCredit.title')}
        message={t('confirm.editCredit.message')}
        confirmText={t('confirm.editCredit.confirm')}
        variant="warning"
      />
    </div>
  );
};

export default EditCreditPage;
