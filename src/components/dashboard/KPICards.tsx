import { useEffect, useMemo, useState } from 'react';
import { UserCheck, UserX, Users, UserMinus } from 'lucide-react';
import { useAppStore } from '../../store';
import { fetchKnownData, fetchUnknownData } from '../../api/dashboardApi';

type RegisteredStudent = {
  id?: string;
  name?: string;
  studentId?: string;
  mealStatus?: string;
  status?: string;
  type?: string;
  full_name?: string;
  employee_id?: string;
  [key: string]: any;
};

type UnknownPerson = {
  id?: string;
  alertStatus?: string;
  status?: string;
  [key: string]: any;
};

export default function KPICards() {
  const { selectedHall, selectedDate, refreshKey } = useAppStore();
  const hallId = selectedHall?.id ?? '';

  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  const [unknownPersons, setUnknownPersons] = useState<UnknownPerson[]>([]);
  const [loading, setLoading] = useState(true);

  // Declare registeredTotal as 23
  const registeredTotal = 36;

  const fetchKpiData = async () => {
    if (!hallId || !selectedDate) {
      setRegisteredStudents([]);
      setUnknownPersons([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [known, unknown] = await Promise.all([
        fetchKnownData<RegisteredStudent>(selectedDate, hallId),
        fetchUnknownData<UnknownPerson>(selectedDate, hallId),
      ]);

      console.log('Known Data (Registered Students):', known);
      console.log('Unknown Data:', unknown);

      setRegisteredStudents(known);
      setUnknownPersons(unknown);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchKpiData();
  }, [hallId, selectedDate]);

  // Refresh when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined) {
      fetchKpiData();
    }
  }, [refreshKey]);

  const kpi = useMemo(() => {
    // Check if a student has eaten - ONLY return true if there's explicit evidence
    const hasEaten = (student: RegisteredStudent): boolean => {
      // Check if student has mealType or meal_type field
      if (student.mealType || student.meal_type || student.meal) {
        return true;
      }
      
      // Check if student has a meal status that indicates eaten
      const mealStatus = String(student.mealStatus ?? student.status ?? student.type ?? '').toLowerCase();
      if (mealStatus) {
        return mealStatus.includes('eaten') || 
               mealStatus.includes('present') || 
               mealStatus.includes('checked') ||
               mealStatus.includes('completed') ||
               mealStatus.includes('done') ||
               mealStatus.includes('confirmed');
      }
      
      // Check if student has captured_at (was detected eating)
      if (student.captured_at || student.capturedAt || student.time) {
        return true;
      }
      
      // If none of the above, student has NOT eaten
      return false;
    };

    const registeredEaten = registeredStudents.filter(hasEaten).length;
    const registeredNotEaten = registeredTotal - registeredEaten;

    // Every unregistered person who triggered an alert counts as an unregistered
    // "eaten" event — that's what the card subtitle already claims, so the total
    // needs to match it instead of silently filtering down to accepted-only.
    const unregisteredPersons = unknownPersons.length;

    // Total eaten = registered students who ate + every unregistered alert
    const totalEaten = registeredEaten + unregisteredPersons;

    console.log('KPI Calculations:', {
      registeredTotal,
      registeredEaten,
      registeredNotEaten,
      unregisteredPersons,
      totalEaten
    });

    return {
      registeredTotal,
      registeredEaten,
      registeredNotEaten,
      unregisteredPersons,
      totalEaten,
    };
  }, [registeredStudents, unknownPersons]);

  const eatenPct = kpi.registeredTotal > 0
    ? Math.round((kpi.registeredEaten / kpi.registeredTotal) * 100)
    : 0;

  const notEatenPct = kpi.registeredTotal > 0
    ? Math.round((kpi.registeredNotEaten / kpi.registeredTotal) * 100)
    : 0;

  // % of everyone who showed up (registered + unregistered) who's accounted
  // for as "eaten" — used for the Total card's trend instead of a raw count.
  const totalPeople = kpi.registeredTotal + kpi.unregisteredPersons;
  const totalEatenPct = totalPeople > 0
    ? Math.round((kpi.totalEaten / totalPeople) * 100)
    : 0;

  const cards = [
    {
      title: 'Registered Students Eaten',
      value: kpi.registeredEaten,
      icon: <UserCheck size={20} className="text-green-600" />,
      gradient: 'bg-green-400',
      iconBg: 'bg-green-50',
      trend: eatenPct,
      subtitle: `${eatenPct}% of registered students`,
      delay: 0,
    },
    {
      title: 'Unregistered Persons',
      value: kpi.unregisteredPersons,
      icon: <UserX size={20} className="text-red-600" />,
      gradient: 'bg-red-400',
      iconBg: 'bg-red-50',
      trend: kpi.unregisteredPersons > 0 ? Math.round((kpi.unregisteredPersons / (kpi.registeredTotal + kpi.unregisteredPersons)) * 100) : 0,
      subtitle: 'Alerts generated',
      delay: 0.08,
    },
    {
      title: 'Total Students Eaten Today',
      value: kpi.totalEaten,
      icon: <Users size={20} className="text-brand-primary" />,
      gradient: 'bg-blue-400',
      iconBg: 'bg-blue-50',
      trend: totalEatenPct,
      subtitle: `${kpi.registeredEaten} registered + ${kpi.unregisteredPersons} unregistered`,
      delay: 0.16,
    },

    {
      title: 'Registered Not Eaten',
      value: kpi.registeredNotEaten,
      icon: <UserMinus size={20} className="text-amber-600" />,
      gradient: 'bg-amber-400',
      iconBg: 'bg-amber-50',
      trend: notEatenPct,
      subtitle: `${notEatenPct}% yet to eat`,
      delay: 0.24,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-28 rounded-2xl border border-brand-border bg-white/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="relative z-10 overflow-visible rounded-[24px] border border-white/60 bg-white/70 p-4 shadow-[0_8px_24px_rgba(33,150,243,0.08)] backdrop-blur-xl"
        >
          <div className={`absolute inset-x-0 top-0 h-1.5 ${card.gradient}`} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-textSecondary">
                {card.title}
              </p>
              <p className="mt-3 text-3xl font-semibold text-brand-textPrimary">{card.value}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-medium text-brand-textSecondary">{card.subtitle}</span>
            <span className={`text-xs font-semibold ${card.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {card.trend >= 0 ? '+' : ''}
              {card.trend}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}