import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const formatDate = (d: Date): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isInRange = (d: Date, start: Date, end: Date) =>
  d >= start && d <= end;

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const getFirstDayOfWeek = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [leftMonth, setLeftMonth] = useState(value.start.getMonth());
  const [leftYear, setLeftYear] = useState(value.start.getFullYear());
  const [selecting, setSelecting] = useState<'start' | 'done'>('done');
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Right month is always leftMonth + 1
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  // Close on outside click (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelecting('done');
        setTempStart(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile]);

  const goLeft = () => {
    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear(leftYear - 1);
    } else {
      setLeftMonth(leftMonth - 1);
    }
  };

  const goRight = () => {
    if (leftMonth === 11) {
      setLeftMonth(0);
      setLeftYear(leftYear + 1);
    } else {
      setLeftMonth(leftMonth + 1);
    }
  };

  const handleDayClick = useCallback((date: Date) => {
    if (selecting === 'done' || !tempStart) {
      setTempStart(date);
      setSelecting('start');
    } else {
      const start = date < tempStart ? date : tempStart;
      const end = date < tempStart ? tempStart : date;
      onChange({ start, end });
      setSelecting('done');
      setTempStart(null);
      setIsOpen(false);
    }
  }, [selecting, tempStart, onChange]);

  // Determine visual range for highlighting
  const rangeStart = selecting === 'start' && tempStart
    ? (hoverDate && hoverDate < tempStart ? hoverDate : tempStart)
    : value.start;
  const rangeEnd = selecting === 'start' && tempStart
    ? (hoverDate && hoverDate > tempStart ? hoverDate : tempStart)
    : value.end;

  const renderMonth = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    // Pad last week
    const lastWeek = weeks[weeks.length - 1];
    while (lastWeek.length < 7) lastWeek.push(null);

    const cellHeight = isMobile ? 'h-11' : 'h-8';

    return (
      <div className={isMobile ? 'w-full' : 'w-[280px]'}>
        <div className="text-center text-sm font-semibold text-gray-800 mb-3">
          {MONTHS_RU[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {WEEKDAYS_RU.map(wd => (
            <div key={wd} className="text-center text-[10px] font-medium text-gray-400 uppercase py-1">{wd}</div>
          ))}
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              if (!day) {
                return <div key={`${wi}-${di}`} className={cellHeight} />;
              }
              const date = new Date(year, month, day);
              const isStart = isSameDay(date, rangeStart);
              const isEnd = isSameDay(date, rangeEnd);
              const inRange = isInRange(date, rangeStart, rangeEnd);
              const isToday = isSameDay(date, new Date());

              let cellClass = `${cellHeight} w-full flex items-center justify-center text-xs cursor-pointer transition-colors `;

              if (isStart || isEnd) {
                cellClass += 'bg-ordo-darkGreen text-white font-bold ';
                if (isStart && !isEnd) cellClass += 'rounded-l-full ';
                if (isEnd && !isStart) cellClass += 'rounded-r-full ';
                if (isStart && isEnd) cellClass += 'rounded-full ';
              } else if (inRange) {
                cellClass += 'bg-sky-50 text-ordo-darkGreen ';
              } else {
                cellClass += 'text-gray-700 hover:bg-gray-100 rounded-full ';
              }

              if (isToday && !isStart && !isEnd) {
                cellClass += 'font-bold underline ';
              }

              return (
                <div
                  key={`${wi}-${di}`}
                  className={cellClass}
                  onClick={() => handleDayClick(date)}
                  onMouseEnter={() => setHoverDate(date)}
                >
                  {day}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Preset ranges
  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    onChange({ start, end });
    setIsOpen(false);
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    onChange({ start, end });
    setIsOpen(false);
  };

  const setLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    onChange({ start, end });
    setIsOpen(false);
  };

  const presets = [
    { label: 'Сегодня', fn: () => setPreset(1) },
    { label: 'Последние 7 дней', fn: () => setPreset(7) },
    { label: 'Последние 14 дней', fn: () => setPreset(14) },
    { label: 'Последние 30 дней', fn: () => setPreset(30) },
    { label: 'Последние 90 дней', fn: () => setPreset(90) },
    { label: 'Этот месяц', fn: () => setThisMonth() },
    { label: 'Прошлый месяц', fn: () => setLastMonth() },
  ];

  // Mobile full-screen overlay
  const renderMobileOverlay = () => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col overflow-y-auto"
        style={{ paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 16px)' }}
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Выберите период</h3>
          <button
            onClick={() => { setIsOpen(false); setSelecting('done'); setTempStart(null); }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Preset chips */}
        <div className="px-4 py-3 flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={p.fn}
              className="px-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-sky-50 hover:text-ordo-darkGreen hover:border-sky-200 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 mb-2">
          <button onClick={goLeft} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <button onClick={goRight} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-gray-100">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Calendars stacked */}
        <div className="px-4 space-y-6">
          {renderMonth(leftYear, leftMonth)}
          {renderMonth(rightYear, rightMonth)}
        </div>

        {selecting === 'start' && (
          <div className="mt-3 text-xs text-gray-400 text-center">Выберите конечную дату</div>
        )}
      </div>
    );
  };

  // Desktop popover
  const renderDesktopPopover = () => {
    if (!isOpen) return null;

    return (
      <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-5 z-50 flex gap-6">
        {/* Presets */}
        <div className="flex flex-col gap-1 border-r border-gray-100 pr-5 min-w-[140px]">
          <span className="text-[10px] uppercase font-semibold text-gray-400 mb-2 tracking-wider">Быстрый выбор</span>
          {presets.map(p => (
            <button
              key={p.label}
              onClick={p.fn}
              className="text-left text-sm text-gray-600 hover:text-ordo-darkGreen hover:bg-sky-50 px-2 py-1.5 rounded transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Calendars */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={goLeft} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={goRight} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex gap-8">
            {renderMonth(leftYear, leftMonth)}
            {renderMonth(rightYear, rightMonth)}
          </div>
          {selecting === 'start' && (
            <div className="mt-3 text-xs text-gray-400 text-center">Выберите конечную дату</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 mr-3">
          {formatDate(value.start)} — {formatDate(value.end)}
        </span>
        <Calendar className="w-4 h-4 text-gray-400" />
      </button>

      {isMobile ? renderMobileOverlay() : renderDesktopPopover()}
    </div>
  );
};

export default DateRangePicker;
