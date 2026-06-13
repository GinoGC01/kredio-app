import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientService } from '../services/client.service';
import { Client, Credit } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/AlertContext';
import { formatDate } from '../utils/date';
import { FiUser, FiBriefcase, FiArrowLeft, FiChevronRight } from 'react-icons/fi';

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

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const { t, language } = useLanguage();
  const { addToast } = useToast();

  const loadClient = () => {
    if (id) {
      clientService.getById(id).then((res) => setClient(res.data));
    }
  };

  useEffect(loadClient, [id]);

  const handleDelete = async () => {
    try {
      await clientService.delete(id!);
      addToast('success', t('confirm.deleteClient.success'));
      navigate('/clients');
    } catch {
      addToast('error', t('confirm.deleteClient.error'));
    }
  };

  if (!client) return <PageLoader />;

  const visibleCredits = client.credits?.filter((c) => c.status !== 'ARCHIVED') ?? [];

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
            <Button variant="danger" onClick={() => setShowDelete(true)}>
              Eliminar
            </Button>
            <Button variant="primary" onClick={() => navigate(`/credits/new?clientId=${client.id}`)}>
              {t('clientDetail.newCredit')}
            </Button>
          </div>
        </div>
      </div>

      {/* Contact & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card title={t('clientDetail.contactInfo')} accent="purple">
          <div className="space-y-2 text-sm">
            {client.email && (
              <div className="flex justify-between">
                <span className="text-text-muted">{t('clientDetail.email')}</span>
                <span className="text-text-primary">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex justify-between">
                <span className="text-text-muted">{t('clientDetail.phone')}</span>
                <span className="text-text-primary">{client.phone}</span>
              </div>
            )}
            {client.notes && (
              <div className="flex justify-between">
                <span className="text-text-muted">{t('clientDetail.notes')}</span>
                <span className="text-text-primary">{client.notes}</span>
              </div>
            )}
            {!client.email && !client.phone && !client.notes && (
              <p className="text-text-muted text-sm">-</p>
            )}
          </div>
        </Card>

        <Card title={t('clientDetail.summary')} accent="cyan">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">{t('clientDetail.creditsCount').split('{count}')[0]}</span>
              <span className="text-text-primary font-medium">{visibleCredits.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Deuda Total</span>
              <span className="text-text-primary font-semibold">
                {(client.credits?.reduce((s, c) => s + Number(c.balance), 0) ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Credits list */}
      <Card title={t('clientDetail.credits')} accent="orange">
        {visibleCredits.length === 0 ? (
          <p className="text-text-muted text-sm">{t('clientDetail.noCredits')}</p>
        ) : (
          <div className="divide-y divide-border-subtle -mx-5">
            {visibleCredits.map((credit: Credit) => (
              <div
                key={credit.id}
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-bg-card-hover transition-colors"
                onClick={() => navigate(`/credits/${credit.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stat-purple-bg flex items-center justify-center">
                    <FiBriefcase className="w-4 h-4 text-accent-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {credit.currency} {Number(credit.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-text-muted">
                      {t('clientDetail.due').replace('{date}', formatDate(credit.dueDate, language))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(credit.status, t)}
                  <span className="text-sm font-semibold text-text-primary">
                    {credit.currency} {Number(credit.balance).toLocaleString()}
                  </span>
                  <FiChevronRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title={t('confirm.deleteClient.title')}
        message={t('confirm.deleteClient.message')}
        confirmText={t('confirm.deleteClient.confirm')}
        variant="danger"
      />
    </div>
  );
};

export default ClientDetailPage;
