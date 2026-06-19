import React, { useEffect, useState, useMemo } from 'react';
import { activityService } from '../services/activity.service';
import { ActivityLog } from '../types';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { formatDateShort } from '../utils/date';
import {
  FiDollarSign, FiBriefcase, FiUserPlus, FiClock,
} from 'react-icons/fi';

interface ActionConfig {
  icon: React.ReactNode;
  bg: string;
  color: string;
  labelKey: string;
}

const actionConfig: Record<string, ActionConfig> = {
  'payment.registered': {
    icon: <FiDollarSign className="w-4 h-4 text-success" />,
    bg: 'bg-stat-teal-bg',
    color: 'text-success',
    labelKey: 'activity.paymentRegistered',
  },
  'credit.created': {
    icon: <FiBriefcase className="w-4 h-4 text-accent-purple" />,
    bg: 'bg-stat-purple-bg',
    color: 'text-accent-purple',
    labelKey: 'activity.creditCreated',
  },
  'client.created': {
    icon: <FiUserPlus className="w-4 h-4 text-accent-indigo" />,
    bg: 'bg-stat-blue-bg',
    color: 'text-accent-indigo',
    labelKey: 'activity.clientCreated',
  },
};

const defaultConfig: ActionConfig = {
  icon: <FiClock className="w-4 h-4 text-text-muted" />,
  bg: 'bg-bg-input',
  color: 'text-text-muted',
  labelKey: '',
};

function getActionDescription(log: ActivityLog, t: (k: string) => string): string {
  const cfg = actionConfig[log.action] ?? defaultConfig;
  const label = cfg.labelKey ? t(cfg.labelKey) : log.action;

  if (log.details) {
    const d = log.details as Record<string, unknown>;
    if (log.action === 'payment.registered' && typeof d.amount === 'number') {
      return `${label} — $${d.amount.toLocaleString()}`;
    }
    if (log.action === 'credit.created' && typeof d.amount === 'number') {
      let desc = `${label} — $${d.amount.toLocaleString()}`;
      if (typeof d.clientName === 'string') {
        desc += ` ${t('activity.forClient').replace('{name}', d.clientName)}`;
      }
      return desc;
    }
    if (log.action === 'client.created' && typeof d.name === 'string') {
      return `${label} — ${d.name}`;
    }
  }
  return label;
}

type GroupKey = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'earlier';

function getDateGroup(date: Date): GroupKey {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((startOfDay.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays <= 6) return 'thisWeek';

  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (date >= startOfThisMonth) return 'thisMonth';

  return 'earlier';
}

const groupKeys: GroupKey[] = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'earlier'];
const groupLabels: Record<GroupKey, string> = {
  today: 'activity.today',
  yesterday: 'activity.yesterday',
  thisWeek: 'activity.thisWeek',
  thisMonth: 'activity.thisMonth',
  earlier: 'activity.earlier',
};

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return date.toLocaleDateString('es-AR');
}

const ActivityPage = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    activityService.list().then((res) => setActivities(res.data)).finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map: Record<GroupKey, ActivityLog[]> = { today: [], yesterday: [], thisWeek: [], thisMonth: [], earlier: [] };
    for (const log of activities) {
      const key = getDateGroup(new Date(log.createdAt));
      map[key].push(log);
    }
    return map;
  }, [activities]);

  if (loading) return <PageLoader />;

  const hasActivity = activities.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">{t('activity.title')}</h1>

      {!hasActivity ? (
        <Card accent="pink">
          <p className="text-text-muted text-center py-8">{t('activity.noActivity')}</p>
        </Card>
      ) : (
        <Card accent="cyan">
          {groupKeys.map((groupKey) => {
            const items = grouped[groupKey];
            if (items.length === 0) return null;
            return (
              <div key={groupKey}>
                <div className=" pt-4 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t(groupLabels[groupKey])}
                  </p>
                </div>
                <div className="divide-y divide-border-subtle">
                  {items.map((log, idx) => {
                    const cfg = actionConfig[log.action] ?? defaultConfig;
                    const date = new Date(log.createdAt);
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 py-3.5 hover:bg-bg-card-hover transition-colors animate-slide-up"
                        style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                      >
                        <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">
                            {getActionDescription(log, t)}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {formatDateShort(log.createdAt, language)} · {relativeTime(date)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};

export default ActivityPage;
