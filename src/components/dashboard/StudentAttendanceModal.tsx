import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, XCircle, Clock3, Camera, Star,
  GraduationCap, Hash, BookOpen, Calendar, TrendingUp
} from 'lucide-react';
import { StudentAttendanceRecord, MealRecord } from '../../types';
import { useStudentAttendance } from '../../api/hooks';
import { useAppStore } from '../../store';

// ── Meal config ───────────────────────────────────────────
const MEALS = [
  { key: 'breakfast' as const, label: 'Breakfast', icon: '🌅', time: '6:00 AM – 9:00 AM',  color: { ring: 'ring-amber-400',  bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  bar: 'bg-amber-400'  } },
  { key: 'lunch'     as const, label: 'Lunch',     icon: '☀️', time: '12:00 PM – 2:00 PM', color: { ring: 'ring-blue-400',   bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   bar: 'bg-blue-500'   } },
  { key: 'dinner'    as const, label: 'Dinner',    icon: '🌙', time: '7:00 PM – 9:00 PM',  color: { ring: 'ring-purple-400', bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', bar: 'bg-purple-500' } },
];

// ── Meal status pill ──────────────────────────────────────
function MealStatusPill({ record, label }: { record: MealRecord; label: string }) {
  if (record.status === 'eaten')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 size={10} /> {label} ✓
      </span>
    );
  if (record.status === 'skipped')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
        <XCircle size={10} /> {label} ✗
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
      <Clock3 size={10} /> {label} –
    </span>
  );
}

// ── Single meal block ─────────────────────────────────────
function MealBlock({ mealCfg, record }: { mealCfg: typeof MEALS[0]; record: MealRecord }) {
  const c = mealCfg.color;
  const isEaten   = record.status === 'eaten';
  const isSkipped = record.status === 'skipped';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 flex flex-col gap-3 ${
        isEaten   ? `${c.bg} ${c.border}` :
        isSkipped ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{mealCfg.icon}</span>
          <div>
            <p className="text-sm font-bold text-brand-textPrimary">{mealCfg.label}</p>
            <p className="text-[10px] text-brand-textSecondary flex items-center gap-1">
              <Clock3 size={9} /> {mealCfg.time}
            </p>
          </div>
        </div>

        {/* Big status badge */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
          isEaten   ? `bg-green-100 border-green-400`  :
          isSkipped ? 'bg-red-100 border-red-400'      :
                      'bg-gray-100 border-gray-300'
        }`}>
          {isEaten   && <CheckCircle2 size={20} className="text-green-600" />}
          {isSkipped && <XCircle      size={20} className="text-red-500"   />}
          {!isEaten && !isSkipped && <Clock3 size={20} className="text-gray-400" />}
        </div>
      </div>

      {/* Status label */}
      <div className={`text-center py-1.5 rounded-xl text-xs font-bold ${
        isEaten   ? 'bg-green-100 text-green-700' :
        isSkipped ? 'bg-red-100 text-red-600'     :
                    'bg-gray-100 text-gray-500'
      }`}>
        {isEaten ? 'Meal Consumed' : isSkipped ? 'Meal Skipped' : 'Not Yet Started'}
      </div>

      {/* Details (only if eaten) */}
      {isEaten && record.time && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/70 rounded-xl p-2 border border-white">
            <p className="text-[9px] text-brand-textSecondary mb-0.5 flex items-center gap-1">
              <Clock3 size={9} /> Time
            </p>
            <p className="text-xs font-bold text-brand-textPrimary">{record.time}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-2 border border-white">
            <p className="text-[9px] text-brand-textSecondary mb-0.5 flex items-center gap-1">
              <Star size={9} /> Confidence
            </p>
            <p className="text-xs font-bold text-green-700">{record.confidence}%</p>
          </div>
          {record.cameraName && (
            <div className="col-span-2 bg-white/70 rounded-xl p-2 border border-white">
              <p className="text-[9px] text-brand-textSecondary mb-0.5 flex items-center gap-1">
                <Camera size={9} /> Detected by
              </p>
              <p className="text-xs font-semibold text-brand-textPrimary">{record.cameraName} · {record.cameraId}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Attendance ring ───────────────────────────────────────
function AttendanceRing({ pct, eaten, total = 3 }: { pct: number; eaten: number; total?: number }) {
  const size = 88;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 67 ? '#2ECC71' : pct >= 33 ? '#F39C12' : '#E74C3C';
  return (
    <div className="relative flex-shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E3F2FD" strokeWidth={8} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-brand-textPrimary leading-none">{pct}%</span>
        <span className="text-[9px] text-brand-textSecondary leading-none mt-0.5">{eaten}/{total} meals</span>
      </div>
    </div>
  );
}

// ── Modal inner content (fetches data) ───────────────────
function ModalContent({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const { selectedHall, selectedDate } = useAppStore();
  const { data: record, loading } = useStudentAttendance(selectedHall?.id ?? '', studentId, selectedDate);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-white rounded-2xl shadow-card-hover border border-brand-border w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-light/50">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-brand-primary" />
          <span className="text-sm font-bold text-brand-textPrimary">Daily Meal Attendance</span>
          <span className="text-xs text-brand-textSecondary bg-white border border-brand-border px-2 py-0.5 rounded-full">{selectedDate}</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 hover:text-red-500 text-brand-textSecondary transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : !record ? (
          <div className="p-8 text-center text-brand-textSecondary text-sm">No attendance data found</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Student profile row */}
            <div className="flex items-center gap-4 p-4 bg-brand-light rounded-2xl border border-brand-border">
              <img
                src={record.capturedFrame}
                alt={record.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-border flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.name)}&background=2196F3&color=fff&size=64`; }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-brand-textPrimary">{record.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="flex items-center gap-1 text-[10px] text-brand-textSecondary bg-white border border-brand-border px-2 py-0.5 rounded-full">
                    <Hash size={9} /> {record.studentId}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-brand-textSecondary bg-white border border-brand-border px-2 py-0.5 rounded-full">
                    <GraduationCap size={9} /> {record.department}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-brand-textSecondary bg-white border border-brand-border px-2 py-0.5 rounded-full">
                    <BookOpen size={9} /> {record.year}
                  </span>
                </div>
              </div>
              <AttendanceRing pct={record.attendancePct} eaten={record.totalMealsEaten} />
            </div>

            {/* Quick summary pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-brand-textSecondary flex items-center gap-1">
                <TrendingUp size={12} className="text-brand-primary" /> Today's meals:
              </span>
              {MEALS.map((m) => (
                <MealStatusPill key={m.key} record={record[m.key]} label={m.label} />
              ))}
            </div>

            {/* Three meal blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MEALS.map((m) => (
                <MealBlock key={m.key} mealCfg={m} record={record[m.key]} />
              ))}
            </div>

            {/* Summary bar */}
            <div className="bg-brand-light rounded-2xl border border-brand-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-brand-textPrimary">Overall Day Attendance</span>
                <span className={`text-xs font-bold ${record.attendancePct >= 67 ? 'text-green-600' : record.attendancePct >= 33 ? 'text-amber-600' : 'text-red-600'}`}>
                  {record.totalMealsEaten} / 3 meals · {record.attendancePct}%
                </span>
              </div>
              <div className="h-2.5 bg-white rounded-full overflow-hidden border border-brand-border">
                <motion.div
                  className={`h-full rounded-full ${record.attendancePct >= 67 ? 'bg-green-500' : record.attendancePct >= 33 ? 'bg-amber-400' : 'bg-red-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${record.attendancePct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                {MEALS.map((m) => (
                  <div key={m.key} className="flex items-center gap-1 text-[10px] text-brand-textSecondary">
                    <span>{m.icon}</span>
                    <span className={record[m.key].status === 'eaten' ? 'text-green-600 font-semibold' : record[m.key].status === 'skipped' ? 'text-red-500' : 'text-gray-400'}>
                      {record[m.key].status === 'eaten' ? '✓' : record[m.key].status === 'skipped' ? '✗' : '–'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Exported modal wrapper ────────────────────────────────
interface Props {
  studentId: string | null;
  onClose: () => void;
}

export default function StudentAttendanceModal({ studentId, onClose }: Props) {
  return (
    <AnimatePresence>
      {studentId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <ModalContent studentId={studentId} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
