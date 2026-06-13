import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { creditService } from '../services/credit.service';
import { clientService } from '../services/client.service';
import { Client } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/AlertContext';

const CreateCreditPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [form, setForm] = useState({
    clientId: searchParams.get('clientId') || '',
    amount: '',
    interestRate: '',
    installments: '',
    frequency: 'MONTHLY',
    currency: 'ARS',
    description: '',
    dueDate: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    clientService.list().then((res) => setClients(res.data)).finally(() => setClientsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.amount || !form.installments || !form.dueDate) {
      setError(t('createCredit.requiredFields'));
      return;
    }
    try {
      await creditService.create({
        clientId: form.clientId,
        amount: parseFloat(form.amount),
        interestRate: parseFloat(form.interestRate || '0'),
        installments: parseInt(form.installments),
        frequency: form.frequency as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
        currency: form.currency as 'ARS' | 'USD',
        description: form.description,
        dueDate: form.dueDate,
      });
      addToast('warning', t('createCredit.success'));
      navigate('/credits');
    } catch {
      setError(t('createCredit.error'));
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-text-primary">{t('createCredit.title')}</h1>
      <Card hover={false}>
        {error && <div className="bg-stat-red-bg text-danger p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('createCredit.client')}</label>
            {clientsLoading ? (
              <Loader size="sm" />
            ) : (
              <select
                className="input-base"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                required
              >
                <option value="">{t('createCredit.selectClient')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('createCredit.currency')}</label>
            <select
              className="input-base"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              required
            >
              <option value="ARS">ARS - {t('createCredit.pesos')}</option>
              <option value="USD">USD - {t('createCredit.dollars')}</option>
            </select>
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
            <Button type="submit">{t('createCredit.save')}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/credits')}>
              {t('createCredit.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateCreditPage;
