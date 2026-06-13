import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/ui/Card';
import {
  FiHelpCircle, FiUserPlus, FiDollarSign, FiCreditCard,
  FiBarChart2, FiList, FiChevronDown, FiChevronRight,
} from 'react-icons/fi';

interface FaqItem {
  key: string;
  question: string;
  answer: string;
}

const faqKeys = [
  'whatIs', 'registerClient', 'createCredit', 'registerPayment',
  'creditStatus', 'edit', 'archive', 'darkMode',
];

const steps = [
  { icon: FiUserPlus, bg: 'bg-stat-blue-bg', color: 'text-accent-indigo', key: 'step1' },
  { icon: FiDollarSign, bg: 'bg-stat-purple-bg', color: 'text-accent-purple', key: 'step2' },
  { icon: FiCreditCard, bg: 'bg-stat-teal-bg', color: 'text-success', key: 'step3' },
  { icon: FiBarChart2, bg: 'bg-stat-purple-bg', color: 'text-accent-purple', key: 'step4' },
  { icon: FiList, bg: 'bg-stat-blue-bg', color: 'text-accent-indigo', key: 'step5' },
];

const HelpPage = () => {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [openSteps, setOpenSteps] = useState<string | null>(null);

  const faqItems: FaqItem[] = faqKeys.map((k) => ({
    key: k,
    question: t(`help.faq.${k}`),
    answer: t(`help.faq.${k}Answer`),
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-stat-purple-bg flex items-center justify-center shrink-0">
          <FiHelpCircle className="w-6 h-6 text-accent-purple" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{t('help.title')}</h1>
          <p className="text-sm text-text-muted mt-0.5">{t('help.subtitle')}</p>
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <FiHelpCircle className="w-5 h-5 text-accent-purple" />
          <h2 className="text-base font-semibold text-text-primary">{t('help.faq')}</h2>
        </div>
        <div className="divide-y divide-border-subtle -mx-5">
          {faqItems.map((item) => {
            const isOpen = openFaq === item.key;
            return (
              <div key={item.key}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : item.key)}
                  className="flex items-center justify-between w-full px-5 py-3.5 text-left hover:bg-bg-card-hover transition-colors"
                >
                  <span className="text-sm font-medium text-text-primary">{item.question}</span>
                  {isOpen ? (
                    <FiChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform" />
                  ) : (
                    <FiChevronRight className="w-4 h-4 text-text-muted shrink-0 transition-transform" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 animate-slide-up">
                    <p className="text-sm text-text-secondary leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Roadmap Section */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <FiBarChart2 className="w-5 h-5 text-accent-purple" />
          <div>
            <h2 className="text-base font-semibold text-text-primary">{t('help.roadmap')}</h2>
            <p className="text-xs text-text-muted mt-0.5">{t('help.roadmap.subtitle')}</p>
          </div>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[20px] top-2 bottom-2 w-px bg-border hidden md:block" />

          <div className="space-y-0 md:space-y-0">
            {steps.map(({ icon: Icon, bg, color, key }, idx) => {
              const isOpen = openSteps === key;
              return (
                <div key={key} className="relative flex items-start gap-4 pb-0 md:pb-0">
                  {/* Connector dot */}
                  <div className="hidden md:flex flex-col items-center shrink-0 pt-5">
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center relative z-10 ring-4 ring-bg-card`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                  </div>

                  {/* Mobile icon */}
                  <div className={`md:hidden w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1 pb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full ${bg} flex items-center justify-center md:hidden`}>
                          <span className={`text-[10px] font-bold ${color}`}>{idx + 1}</span>
                        </span>
                        <h3 className="text-sm font-semibold text-text-primary">
                          <span className="hidden md:inline text-accent-purple">{idx + 1}.</span>{' '}
                          {t(`help.${key}`)}
                        </h3>
                      </div>
                      <button
                        onClick={() => setOpenSteps(isOpen ? null : key)}
                        className="p-1 text-text-muted hover:text-text-primary transition-colors"
                      >
                        {isOpen ? (
                          <FiChevronDown className="w-4 h-4" />
                        ) : (
                          <FiChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="mt-2 animate-slide-up">
                        <p className="text-sm text-text-secondary leading-relaxed">{t(`help.${key}Desc`)}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HelpPage;