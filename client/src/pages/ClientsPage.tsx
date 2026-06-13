import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clientService } from '../services/client.service';
import { Client } from '../types';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { FiUsers, FiChevronRight } from 'react-icons/fi';

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    clientService.list().then((res) => setClients(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t('clients.title')}</h1>
        <Link
          to="/clients/new"
          className="px-4 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t('clients.newClient')}
        </Link>
      </div>

      <Card hover={false}>
        {clients.length === 0 ? (
          <p className="text-text-muted text-center py-8">{t('clients.noClients')}</p>
        ) : (
          <div className="divide-y divide-border-subtle -mx-5">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-bg-card-hover transition-colors"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stat-blue-bg flex items-center justify-center">
                    <FiUsers className="w-4 h-4 text-accent-indigo" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{client.name}</p>
                    <p className="text-xs text-text-muted">
                      {client.email || client.phone || t('clients.noContact')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-text-muted">
                      {t('clients.credits').replace('{count}', String(client.activeCredits ?? 0))}
                    </p>
                    <p className="text-sm font-semibold text-text-primary">
                      ${(client.totalDebt ?? 0).toLocaleString()}
                    </p>
                  </div>
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

export default ClientsPage;
