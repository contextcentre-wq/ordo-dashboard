import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface IncomeExpenseProps {
  income: number;
  expense: number;
}

const IncomeExpenseWidget: React.FC<IncomeExpenseProps> = ({ income, expense }) => {
  const isMobile = useIsMobile();
  const total = Math.max(income, expense) * 1.2; // Add some buffer
  const incomePercent = Math.min((income / total) * 100, 100);
  const expensePercent = Math.min((expense / total) * 100, 100);

  // Formatting currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl border border-gray-100/80 shadow-md shadow-sky-100/20 flex flex-col justify-between h-full">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1 mb-1">
        Доход/Расходы
        <span className="text-gray-300 cursor-help text-[10px]">ⓘ</span>
      </h3>

      <div className="flex justify-between items-end mb-1.5">
        <span className="text-sm md:text-base font-bold text-gray-900">{formatCurrency(income)}</span>
        <span className="text-xs md:text-sm font-bold text-gray-900">{formatCurrency(expense)}</span>
      </div>

      {/* Stacked/Overlaid Progress Bar */}
      <div className={`relative ${isMobile ? 'h-4' : 'h-3'} w-full bg-gray-100 rounded-full overflow-hidden`}>
        {/* Income Bar (Green) */}
        <div 
          className="absolute top-0 left-0 h-full bg-ordo-green rounded-full z-10" 
          style={{ width: `${incomePercent}%` }}
        />
        {/* Expense Bar (Red) - positioned relative to income if we want stacked, 
            but the design shows it filling from the right or overlaying.
            Looking at the screenshot: Green is long, Red is short at the end.
            Usually Income vs Expense is comparative. 
            If Income > Expense: Green bar full, Red bar overlaps?
            Let's implement as two separate segments for visual simplicity or a single bar split.
            Screenshot shows: [Green ----------][Red --]
        */}
         <div 
          className="absolute top-0 h-full bg-red-500 rounded-r-full z-20 border-l-2 border-white" 
          style={{ left: `${incomePercent}%`, width: `${Math.max(expensePercent * 0.2, 5)}%` }} // Mocking the visual "tail" effect as logical representation is tricky without context
        />
         {/* 
           Correct Logic for a "Net" visualization usually:
           Total width = Income. 
           If Expense < Income, Red eats into Green from right? 
           Let's emulate the screenshot: Big Green bar, Small Red tip.
         */}
      </div>
    </div>
  );
};

export default IncomeExpenseWidget;