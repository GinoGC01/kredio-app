import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../services/client.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/AlertContext';

const CreateClientPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t('createClient.nameRequired'));
      return;
    }
    try {
      await clientService.create(form);
      addToast('success', t('createClient.success'));
      navigate('/clients');
    } catch {
      setError(t('createClient.error'));
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-text-primary">{t('createClient.title')}</h1>
      <Card accent="purple">
        {error && <div className="bg-stat-red-bg text-danger p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('createClient.name')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label={t('createClient.phone')}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label={t('createClient.email')}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('createClient.notes')}</label>
            <textarea
              className="input-base min-h-[72px]"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit">{t('createClient.save')}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/clients')}>
              {t('createClient.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateClientPage;
