import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FiSearch, FiX } from 'react-icons/fi';

interface PaymentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  method: string;
  onMethodChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: () => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
}

export const PaymentFilters = ({
  search, onSearchChange,
  currency, onCurrencyChange,
  method, onMethodChange,
  status, onStatusChange,
  sortBy, onSortByChange,
  sortOrder, onSortOrderChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
}: PaymentFiltersProps) => {
  const { t } = useLanguage();
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) onSearchChange(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search, onSearchChange]);

  const hasActiveFilters = currency || method || status || dateFrom || dateTo || searchInput;

  const clearFilters = () => {
    setSearchInput('');
    onSearchChange('');
    onCurrencyChange('');
    onMethodChange('');
    onStatusChange('');
    onDateFromChange('');
    onDateToChange('');
  };

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative basis-128">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-[500]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('payments.searchPlaceholder')}
            className="input-base pl-9 pr-3 py-2 text-sm w-full"
          />
        </div>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="input-base basis-64"
        >
          <option value="">{t('payments.filter.allCurrencies')}</option>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value)}
          className="input-base basis-64"
        >
          <option value="">{t('payments.filter.allMethods')}</option>
          <option value="CASH">{t('payments.method.cash')}</option>
          <option value="TRANSFER">{t('payments.method.transfer')}</option>
          <option value="DEBIT_CARD">{t('payments.method.debitCard')}</option>
          <option value="CREDIT_CARD">{t('payments.method.creditCard')}</option>
          <option value="OTHER">{t('payments.method.other')}</option>
          <option value="BIEN">Bien Material</option>
        </select>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="input-base basis-64"
        >
          <option value="">{t('payments.filter.allStatuses')}</option>
          <option value="on_time">{t('payments.status.onTime')}</option>
          <option value="late">{t('payments.status.late')}</option>
          <option value="early">{t('payments.status.early')}</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex gap-2 items-center">
          <label className="text-xs text-text-muted whitespace-nowrap">{t('payments.filter.from')}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="input-base"
          />
          <label className="text-xs text-text-muted whitespace-nowrap">{t('payments.filter.to')}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="input-base"
          />
        </div>

        <div className="flex gap-2 items-center ml-auto">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="input-base min-w-[120px]"
          >
            <option value="date">{t('payments.sort.date')}</option>
            <option value="amount">{t('payments.sort.amount')}</option>
            <option value="client">{t('payments.sort.client')}</option>
          </select>
          <button
            onClick={onSortOrderChange}
            className="input-base px-2 flex items-center justify-center min-w-[36px]"
            title={sortOrder === 'desc' ? t('payments.sort.desc') : t('payments.sort.asc')}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs text-danger hover:bg-stat-red-bg rounded-lg transition-colors"
            >
              <FiX className="w-3 h-3" />
              {t('payments.filter.clear')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
