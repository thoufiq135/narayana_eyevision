import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import { DateRange, DateRangePreset } from '../../types';
import { today, daysAgo } from '../../api/hooks';

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  singleDate?: boolean;           // if true, shows single date picker
  singleValue?: string;
  onSingleChange?: (date: string) => void;
  maxDate?: string;               // YYYY-MM-DD, defaults to today
  minDate?: string;               // YYYY-MM-DD, defaults to 90 days ago
}

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'today',     label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7days',     label: 'Last 7 Days' },
  { id: '30days',    label: 'Last 30 Days' },
  { id: 'custom',    label: 'Custom Range' },
];

function presetToRange(preset: DateRangePreset): DateRange {
  const t = today();
  switch (preset) {
    case 'today':     return { from: t, to: t, preset };
    case 'yesterday': { const y = daysAgo(1); return { from: y, to: y, preset }; }
    case '7days':     return { from: daysAgo(6), to: t, preset };
    case '30days':    return { from: daysAgo(29), to: t, preset };
    default:          return { from: daysAgo(6), to: t, preset: '7days' };
  }
}

function formatDisplay(range: DateRange): string {
  if (range.preset !== 'custom') {
    return PRESETS.find((p) => p.id === range.preset)?.label ?? range.from;
  }
  if (range.from === range.to) return fmtDate(range.from);
  return `${fmtDate(range.from)} – ${fmtDate(range.to)}`;
}

function fmtDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildCalendar(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function DateRangePicker({ value, onChange, singleDate, singleValue, onSingleChange, maxDate, minDate }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'presets' | 'calendar'>('presets');
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const maxD = maxDate ?? today();
  const minD = minDate ?? daysAgo(90);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const weeks = buildCalendar(calYear, calMonth);
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  }
  function nextMonth() {
    const now = new Date();
    if (calYear === now.getFullYear() && calMonth === now.getMonth()) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  }

  function handleDayClick(d: string) {
    if (d < minD || d > maxD) return;
    if (singleDate && onSingleChange) {
      onSingleChange(d);
      setOpen(false);
      return;
    }
    if (!rangeStart) {
      setRangeStart(d);
    } else {
      const from = rangeStart < d ? rangeStart : d;
      const to   = rangeStart < d ? d : rangeStart;
      onChange({ from, to, preset: 'custom' });
      setRangeStart(null);
      setOpen(false);
    }
  }

  function isDayInRange(d: string): boolean {
    if (!d) return false;
    if (singleDate) return d === (singleValue ?? '');
    if (rangeStart && hoverDate) {
      const lo = rangeStart < hoverDate ? rangeStart : hoverDate;
      const hi = rangeStart < hoverDate ? hoverDate : rangeStart;
      return d >= lo && d <= hi;
    }
    return d >= value.from && d <= value.to;
  }

  function isDayStart(d: string) {
    if (singleDate) return d === (singleValue ?? '');
    return d === (rangeStart ?? value.from);
  }
  function isDayEnd(d: string) {
    if (singleDate) return d === (singleValue ?? '');
    if (rangeStart && hoverDate) return d === (rangeStart < hoverDate ? hoverDate : rangeStart);
    return d === value.to;
  }

  const displayLabel = singleDate
    ? (singleValue ? fmtDate(singleValue) : 'Select date')
    : formatDisplay(value);

  return (
    <div className="relative z-[200] overflow-visible isolate">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-[210] flex items-center gap-2 px-3 py-2 bg-white border border-brand-border rounded-xl text-sm font-medium text-brand-textPrimary hover:border-brand-primary hover:bg-brand-light transition-all shadow-sm"
      >
        <Calendar size={14} className="text-brand-primary flex-shrink-0" />
        <span className="max-w-[160px] truncate">{displayLabel}</span>
        <ChevronDown
          size={13}
          className={`text-brand-textSecondary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[300] mt-2 w-[320px] overflow-visible rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.15)]">
          {/* Header tabs */}
          {!singleDate && (
            <div className="flex border-b border-brand-border">
              {(['presets', 'calendar'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setView(t)}
                  className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                    view === t ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-light/50' : 'text-brand-textSecondary hover:text-brand-textPrimary'
                  }`}
                >
                  {t === 'presets' ? 'Quick Select' : 'Calendar'}
                </button>
              ))}
            </div>
          )}

          {/* Presets */}
          {!singleDate && view === 'presets' && (
            <div className="p-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.id === 'custom') { setView('calendar'); return; }
                    onChange(presetToRange(p.id));
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                    value.preset === p.id
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-textSecondary hover:bg-brand-light hover:text-brand-textPrimary'
                  }`}
                >
                  <span>{p.label}</span>
                  {p.id !== 'custom' && (
                    <span className={`text-xs ${value.preset === p.id ? 'text-white/70' : 'text-brand-textSecondary'}`}>
                      {p.id === 'today' ? today() : p.id === 'yesterday' ? daysAgo(1) : `${daysAgo(p.id === '7days' ? 6 : 29)} → ${today()}`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Calendar */}
          {(singleDate || view === 'calendar') && (
            <div className="p-3">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-light transition-colors">
                  <ChevronLeft size={14} className="text-brand-textSecondary" />
                </button>
                <span className="text-sm font-semibold text-brand-textPrimary">{monthLabel}</span>
                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-light transition-colors">
                  <ChevronRight size={14} className="text-brand-textSecondary" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-brand-textSecondary py-1">{d}</div>
                ))}
              </div>

              {/* Days */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((d, di) => {
                    if (!d) return <div key={di} />;
                    const disabled = d < minD || d > maxD;
                    const inRange = isDayInRange(d);
                    const isStart = isDayStart(d);
                    const isEnd = isDayEnd(d);
                    const isToday = d === today();
                    return (
                      <button
                        key={di}
                        disabled={disabled}
                        onClick={() => handleDayClick(d)}
                        onMouseEnter={() => setHoverDate(d)}
                        onMouseLeave={() => setHoverDate(null)}
                        className={`relative h-8 text-xs font-medium transition-colors
                          ${disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                          ${inRange && !isStart && !isEnd ? 'bg-brand-light text-brand-primary' : ''}
                          ${isStart || isEnd ? 'bg-brand-primary text-white rounded-lg z-10' : ''}
                          ${!inRange && !disabled ? 'hover:bg-brand-light hover:text-brand-primary rounded-lg' : ''}
                          ${isToday && !isStart && !isEnd ? 'font-bold text-brand-primary' : ''}
                        `}
                      >
                        {parseInt(d.split('-')[2])}
                        {isToday && !isStart && !isEnd && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Range hint */}
              {!singleDate && (
                <div className="mt-3 pt-3 border-t border-brand-border">
                  {rangeStart ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-textSecondary">From: <strong className="text-brand-primary">{fmtDate(rangeStart)}</strong></span>
                      <button onClick={() => setRangeStart(null)} className="text-brand-textSecondary hover:text-brand-danger">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-brand-textSecondary text-center">Click to set start date</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
