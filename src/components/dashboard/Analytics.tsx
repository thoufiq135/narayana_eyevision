import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { useAppStore } from '../../store';
import { fetchKnownData, fetchUnknownData } from '../../api/dashboardApi';
import { SkeletonCard } from '../ui/Skeleton';

type MealType = 'breakfast' | 'lunch' | 'dinner';

type ApiItem = {
  id?: string;
  name?: string;
  studentId?: string;
  department?: string;
  year?: string;
  time?: string;
  confidence?: number;
  cameraId?: string;
  cameraName?: string;
  streamQuality?: string;
  mealStatus?: 'eaten' | 'pending';
  alertStatus?: 'pending' | 'accepted' | 'rejected';
  type?: 'registered' | 'unknown';
  mealType?: MealType | '';
  captured_at?: string;
  capturedAt?: string;
  [key: string]: any;
};

function ChartCard({ title, subtitle, children, delay = 0, loading = false }: {
  title: string; subtitle?: string; children: React.ReactNode; delay?: number; loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-brand-border shadow-card p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-brand-textPrimary">{title}</h3>
        {subtitle && <p className="text-xs text-brand-textSecondary mt-0.5">{subtitle}</p>}
      </div>
      {loading ? <SkeletonCard lines={3} className="border-0 shadow-none p-0" /> : children}
    </motion.div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #DCEEFF',
    borderRadius: 12,
    fontSize: 12,
    boxShadow: '0 4px 16px rgba(33,150,243,0.1)',
  },
  labelStyle: { color: '#1F2937', fontWeight: 600 },
};

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: '#F39C12',
  lunch: '#2196F3',
  dinner: '#9C27B0',
};

function getMealType(value?: string): MealType | '' {
  const val = String(value ?? '').toLowerCase();
  if (val.includes('breakfast')) return 'breakfast';
  if (val.includes('lunch')) return 'lunch';
  if (val.includes('dinner')) return 'dinner';
  if (!val) return '';
  return '';
}

function getDateKey(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toISOString().slice(0, 10);
}

function toDateLabel(date: string) {
  const d = new Date(date + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function dateRangeList(from: string, to: string) {
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const list: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    list.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return list;
}

export default function Analytics() {
  const { selectedHall, dateRange, selectedDate } = useAppStore();
  const hallId = selectedHall?.id ?? '';

  const [known, setKnown] = useState<ApiItem[]>([]);
  const [unknown, setUnknown] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hallId || !selectedDate) {
      setKnown([]);
      setUnknown([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const [knownData, unknownData] = await Promise.all([
          fetchKnownData<ApiItem>(selectedDate, hallId),
          fetchUnknownData<ApiItem>(selectedDate, hallId),
        ]);

        if (cancelled) return;

        setKnown(knownData ?? []);
        setUnknown(unknownData ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [hallId, selectedDate]);

  const analytics = useMemo(() => {
    const dailyRecords = dateRangeList(dateRange.from, dateRange.to);

    const weekly = dailyRecords.map((day) => {
      const byMeal: Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0 };

      known.forEach((item) => {
        const d = getDateKey(item.captured_at ?? item.capturedAt ?? item.time ?? item.date ?? day);
        if (d !== day) return;

        const mealType = getMealType(item.mealType ?? item.meal ?? item.type ?? '');
        if (mealType) byMeal[mealType] += 1;
      });

      const unreg = unknown.filter((item) => {
        const d = getDateKey(item.captured_at ?? item.capturedAt ?? item.time ?? item.date ?? day);
        return d === day;
      }).length;

      return {
        day: toDateLabel(day),
        breakfast: byMeal.breakfast,
        lunch: byMeal.lunch,
        dinner: byMeal.dinner,
        unregistered: unreg,
      };
    });

    const mealDist = (['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => {
      const value = known.filter((item) => {
        const type = getMealType(item.mealType ?? item.meal ?? item.type ?? '');
        return type === meal;
      }).length + unknown.filter((item) => {
        const type = getMealType(item.mealType ?? item.meal ?? item.type ?? '');
        return type === meal;
      }).length;

      return { name: meal.charAt(0).toUpperCase() + meal.slice(1), value, color: MEAL_COLORS[meal] };
    });

    const hourly = Array.from({ length: 24 }, (_, hour) => {
      const hourLabel = `${String(hour).padStart(2, '0')}:00`;
      const count = known.filter((item) => {
        const raw = item.captured_at ?? item.capturedAt ?? item.time;
        if (!raw) return false;
        const d = new Date(raw);
        return !Number.isNaN(d.getTime()) && d.getHours() === hour;
      }).length + unknown.filter((item) => {
        const raw = item.captured_at ?? item.capturedAt ?? item.time;
        if (!raw) return false;
        const d = new Date(raw);
        return !Number.isNaN(d.getTime()) && d.getHours() === hour;
      }).length;

      return { hour: hourLabel, count };
    }).filter((item) => item.count > 0);

    const regUnreg = dailyRecords.map((day) => {
      const reg = known.filter((item) => {
        const d = getDateKey(item.captured_at ?? item.capturedAt ?? item.time ?? item.date ?? day);
        return d === day;
      }).length;

      const unreg = unknown.filter((item) => {
        const d = getDateKey(item.captured_at ?? item.capturedAt ?? item.time ?? item.date ?? day);
        return d === day;
      }).length;

      return { day: toDateLabel(day), reg, unreg };
    });

    const utilization = Array.from({ length: 12 }, (_, i) => {
      const hour = i * 2;
      const count = known.filter((item) => {
        const raw = item.captured_at ?? item.capturedAt ?? item.time;
        if (!raw) return false;
        const d = new Date(raw);
        return !Number.isNaN(d.getTime()) && d.getHours() >= hour && d.getHours() < hour + 2;
      }).length + unknown.filter((item) => {
        const raw = item.captured_at ?? item.capturedAt ?? item.time;
        if (!raw) return false;
        const d = new Date(raw);
        return !Number.isNaN(d.getTime()) && d.getHours() >= hour && d.getHours() < hour + 2;
      }).length;

      const util = count > 0 ? Math.min((count / 80) * 100, 100) : 0;

      return {
        time: `${String(hour).padStart(2, '0')}:00`,
        util: Number(util.toFixed(1)),
      };
    });

    const totalKnown = known.length;
    const totalUnknown = unknown.length;
    const totalEaten = totalKnown + unknown.filter((i) => {
      const status = String(i.alertStatus ?? i.status ?? '').toLowerCase();
      return status.includes('accepted') || status.includes('approved') || status.includes('resolved');
    }).length;

    return {
      weekly,
      mealDist,
      hourly,
      regUnreg,
      utilization,
      totalKnown,
      totalUnknown,
      totalEaten,
    };
  }, [known, unknown, dateRange.from, dateRange.to]);

  const loadingState = loading || !selectedHall || !selectedDate;

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-brand-textPrimary mb-3">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <ChartCard title="Weekly Attendance" subtitle={`${dateRange.from} → ${dateRange.to}`} delay={0} loading={loadingState}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.weekly} barSize={8} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="breakfast" name="Breakfast" fill="#F39C12" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lunch" name="Lunch" fill="#2196F3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="dinner" name="Dinner" fill="#9C27B0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Meal Distribution" subtitle={`${selectedDate}`} delay={0.08} loading={loadingState}>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={analytics.mealDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {(analytics.mealDist ?? []).map((entry: { color: string }, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 space-y-3">
              {(analytics.mealDist ?? []).map((d: { name: string; value: number; color: string }) => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-brand-textSecondary">{d.name}</span>
                    <span className="font-bold text-brand-textPrimary">{d.value}</span>
                  </div>
                  <div className="h-1.5 bg-brand-light rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((d.value / Math.max(analytics.totalKnown + analytics.totalUnknown, 1)) * 100, 100)}%`,
                        background: d.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Peak Hours" subtitle={`Hourly footfall – ${selectedDate}`} delay={0.16} loading={loadingState}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics.hourly}>
              <defs>
                <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2196F3" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="count" name="Students" stroke="#2196F3" strokeWidth={2} fill="url(#peakGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance Trend" subtitle={`${dateRange.from} → ${dateRange.to}`} delay={0.24} loading={loadingState}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="breakfast" name="Breakfast" stroke="#F39C12" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lunch" name="Lunch" stroke="#2196F3" strokeWidth={2.5} dot={{ fill: '#2196F3', r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="dinner" name="Dinner" stroke="#9C27B0" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Registered vs Unregistered" subtitle={`${dateRange.from} → ${dateRange.to}`} delay={0.32} loading={loadingState}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.regUnreg} barSize={10} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="reg" name="Registered" fill="#2196F3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unreg" name="Unregistered" fill="#E74C3C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hall Utilization" subtitle={`Capacity usage – ${selectedDate}`} delay={0.4} loading={loadingState}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics.utilization}>
              <defs>
                <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Utilization']} />
              <Area type="monotone" dataKey="util" name="Utilization" stroke="#2ECC71" strokeWidth={2} fill="url(#utilGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
