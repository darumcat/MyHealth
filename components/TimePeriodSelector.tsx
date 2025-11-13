import React from 'react';

interface TimePeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

const periods = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'year', label: 'Год' },
  { key: 'all', label: 'Все время' },
];

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({ selectedPeriod, onPeriodChange }) => {
  return (
    <div className="flex items-center flex-wrap gap-2">
      {periods.map(period => (
        <button
          key={period.key}
          onClick={() => onPeriodChange(period.key)}
          className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
            selectedPeriod === period.key
              ? 'bg-teal-600 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};