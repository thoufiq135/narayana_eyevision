import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, Circle, Loader2, Users, UserX, UserCheck, Search, Camera, ShieldAlert, ShieldCheck, ShieldX, ChevronDown, ChevronUp, Eye, Wifi, Star } from 'lucide-react';
import { useAppStore } from '../../store';
import { fetchKnownData, fetchUnknownData } from '../../api/dashboardApi';
import { SkeletonCard } from '../ui/Skeleton';

type MealType = 'breakfast' | 'lunch' | 'dinner';
type MealStatus = 'ongoing' | 'upcoming' | 'completed';

type MealSession = {
  type: MealType;
  label: string;
  timeRange: string;
  registered: number;
  unregistered: number;
  total: number;
  status: MealStatus;
};

type DetectedPerson = {
  id: string;
  name: string;
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
  full_name?: string;
  employee_id?: string;
  department_id?: number;
  [key: string]: any;
};

// ---- Raw API record shape (what /getData/known-data and /getData/unknown-data actually return) ----
type ApiPagination = { currentPage: number; totalPages: number; totalRecords: number; recordsPerPage: number };
type ApiResponse<T> = { success: boolean; data: T[]; pagination: ApiPagination };

const mealIcons: Record<MealType, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
const mealColors = {
  breakfast: { bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', accent: '#F39C12', progress: 'bg-amber-400', tab: 'bg-amber-500' },
  lunch: { bg: 'from-blue-50 to-sky-50', border: 'border-blue-200', accent: '#2196F3', progress: 'bg-blue-500', tab: 'bg-blue-500' },
  dinner: { bg: 'from-purple-50 to-indigo-50', border: 'border-purple-200', accent: '#9C27B0', progress: 'bg-purple-500', tab: 'bg-purple-500' },
};

const buildAvatarUrl = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'S')}&background=2196F3&color=fff&size=80`;

const normalizeImageUrl = (value?: string) => {
  if (!value || typeof value !== 'string') return '';
  const v = value.trim();
  if (!v) return '';
  if (v.startsWith('data:')) return v;
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  if (v.startsWith('/')) return v;
  if (v.startsWith('uploads')) return `/${v.replace(/^\/+/, '')}`;
  return v;
};

const getPersonImageUrl = (person: any) => {
  const candidates = [
    person?.image,
    person?.photo,
    person?.avatar,
    person?.imageUrl,
    person?.image_url,
    person?.snapshot,
    person?.capturedFrame,
    person?.faceImage,
    person?.thumbnail,
    person?.url,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);
    if (normalized) return normalized;
  }

  return buildAvatarUrl(person?.full_name || person?.name || 'Unknown');
};

// Derive a meal bucket from a timestamp
function deriveMealType(dateStr?: string): MealType | '' {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const hour = d.getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return '';
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });
}

// Maps a raw record to the DetectedPerson shape
function normalizePerson(raw: any, fallbackType: 'registered' | 'unknown'): DetectedPerson {
  // Handle different field names from the API
  const name = raw.full_name || raw.name || (fallbackType === 'unknown' ? 'Unknown Person' : 'Unnamed');
  const studentId = raw.employee_id || raw.studentId || raw.student_id || raw.id?.toString() || '';
  const capturedAt = raw.captured_at ?? raw.capturedAt ?? raw.time ?? raw.created_at;
  
  return {
    ...raw,
    id: String(raw.id ?? raw._id ?? `${fallbackType}-${Math.random().toString(36).slice(2)}`),
    name: name,
    full_name: name,
    studentId: studentId,
    employee_id: studentId,
    department: raw.department_name || raw.department || raw.department_id?.toString() || '',
    year: raw.year || raw.year_of_study || '',
    time: formatTime(capturedAt),
    confidence: Number(raw.confidence ?? raw.match_confidence ?? 0),
    cameraId: raw.cameraId ?? raw.camera_id,
    cameraName: raw.cameraName ?? raw.camera_name ?? raw.cameraId ?? raw.camera_id,
    streamQuality: raw.streamQuality ?? raw.stream_quality ?? 'SD',
    mealStatus: raw.mealStatus ?? raw.meal_status ?? 'pending',
    alertStatus: raw.alertStatus ?? raw.alert_status ?? 'pending',
    type: raw.type ?? fallbackType,
    image: raw.image ?? raw.image_url ?? raw.imageUrl ?? (raw.image_key ? `/uploads/captures/${raw.image_key}` : undefined),
    mealType: (raw.mealType ?? raw.meal_type ?? raw.meal ?? deriveMealType(capturedAt)) as MealType | '',
  };
}

// Pulls every page for a date/hall
async function fetchAllPages<T>(
  fetchFn: (date: string, hallId: string, page?: number, limit?: number) => Promise<T[] | ApiResponse<T>>,
  date: string,
  hallId: string,
  limit = 50
): Promise<T[]> {
  const first = await fetchFn(date, hallId, 1, limit);

  if (Array.isArray(first)) {
    return first;
  }

  let all: T[] = [...(first?.data ?? [])];
  const totalPages = first?.pagination?.totalPages ?? 1;

  for (let page = 2; page <= totalPages; page++) {
    const next = await fetchFn(date, hallId, page, limit);
    all = all.concat(Array.isArray(next) ? next : next?.data ?? []);
  }

  return all;
}

async function loadKnownAndUnknown(date: string, hallId: string): Promise<{ known: DetectedPerson[]; unknown: DetectedPerson[] }> {
  const [knownRaw, unknownRaw] = await Promise.all([
    fetchAllPages<any>(fetchKnownData as any, date, hallId),
    fetchAllPages<any>(fetchUnknownData as any, date, hallId),
  ]);

  console.log('Known Raw Data:', knownRaw); // Debug log
  console.log('Unknown Raw Data:', unknownRaw); // Debug log

  return {
    known: knownRaw.map((r) => normalizePerson(r, 'registered')),
    unknown: unknownRaw.map((r) => normalizePerson(r, 'unknown')),
  };
}

function CircularProgress({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E3F2FD" strokeWidth={5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

function ConfBar({ value, color = '#2196F3' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-brand-light rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{value}%</span>
    </div>
  );
}

function StudentCard({ person, index, onViewAttendance }: { person: DetectedPerson; index: number; onViewAttendance: (person: DetectedPerson) => void; }) {
  const imageSrc = getPersonImageUrl(person);
  const name = person.full_name || person.name || 'Unknown';
  const studentId = person.employee_id || person.studentId || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white rounded-xl border border-brand-border shadow-card p-3 flex flex-col gap-2 hover:border-brand-primary/40 hover:shadow-card-hover transition-all group cursor-pointer"
      onClick={() => onViewAttendance(person)}
      title="Click to view full day attendance"
    >
      <div className="flex items-center gap-2.5">
        <div className="relative flex-shrink-0">
          <img
            src={imageSrc}
            alt={name}
            className="w-10 h-10 rounded-xl object-cover border-2 border-brand-light group-hover:border-brand-primary/30 transition-colors"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.onerror = null;
              img.src = buildAvatarUrl(name);
            }}
          />
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${person.mealStatus === 'eaten' ? 'bg-green-500' : 'bg-amber-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-brand-textPrimary truncate leading-tight">{name}</p>
          <p className="text-[10px] text-brand-textSecondary font-mono leading-tight">{studentId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <div className="bg-brand-light rounded-lg px-2 py-1 border border-brand-border">
          <p className="text-[9px] text-brand-textSecondary leading-none">Dept</p>
          <p className="text-[10px] font-semibold text-brand-textPrimary leading-tight truncate">{person.department || 'N/A'}</p>
        </div>
        <div className="bg-brand-light rounded-lg px-2 py-1 border border-brand-border">
          <p className="text-[9px] text-brand-textSecondary leading-none">Year</p>
          <p className="text-[10px] font-semibold text-brand-textPrimary leading-tight">{person.year || 'N/A'}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-brand-textSecondary flex items-center gap-1"><Star size={9} className="text-brand-primary" /> AI Confidence</span>
          <span className="text-[9px] text-brand-textSecondary flex items-center gap-0.5"><Clock size={9} />{person.time || 'N/A'}</span>
        </div>
        <ConfBar value={person.confidence ?? 0} color={person.confidence && person.confidence >= 95 ? '#2ECC71' : person.confidence && person.confidence >= 85 ? '#2196F3' : '#F39C12'} />
      </div>

      <div className="flex items-center gap-1 text-[9px] text-brand-textSecondary">
        <Camera size={9} className="text-brand-primary flex-shrink-0" />
        <span className="truncate">{person.cameraName ?? person.cameraId ?? 'Unknown Camera'}</span>
        <span className="ml-auto bg-brand-light border border-brand-border px-1 py-0.5 rounded text-[8px] font-medium">{person.streamQuality}</span>
      </div>
    </motion.div>
  );
}

function UnknownCard({ person, index, onAction }: { person: DetectedPerson; index: number; onAction: (id: string, action: 'accepted' | 'rejected') => void; }) {
  const [localStatus, setLocalStatus] = useState<'pending' | 'accepted' | 'rejected'>(person.alertStatus ?? 'pending');
  const [imgError, setImgError] = useState(false);
  const imageSrc = getPersonImageUrl(person);

  function handle(action: 'accepted' | 'rejected') {
    setLocalStatus(action);
    onAction(person.id, action);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border shadow-card overflow-hidden transition-all ${
        localStatus === 'accepted' ? 'border-green-300 bg-green-50/30' :
        localStatus === 'rejected' ? 'border-gray-200 bg-gray-50/50 opacity-70' :
        'border-red-200 bg-red-50/20 hover:border-red-300 hover:shadow-card-hover'
      }`}
    >
      <div className="relative bg-gray-900 aspect-video overflow-hidden">
        {!imgError ? (
          <img src={imageSrc} alt="Unknown person capture" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-2">
            <div className="w-12 h-12 rounded-full bg-red-900/50 border-2 border-red-500 flex items-center justify-center">
              <ShieldAlert size={20} className="text-red-400" />
            </div>
            <span className="text-red-400 text-[10px] font-bold">UNKNOWN PERSON</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="text-white text-[9px] bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1"><Camera size={8} /> {person.cameraName ?? person.cameraId}</span>
          <span className="text-white text-[9px] bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1"><Clock size={8} /> {person.time}</span>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-bold text-red-700 flex items-center gap-1"><ShieldAlert size={12} /> Unknown Person</p>
            <p className="text-[10px] text-brand-textSecondary mt-0.5">{person.cameraId} · {person.cameraName}</p>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${
            localStatus === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
            localStatus === 'rejected' ? 'bg-gray-100 text-gray-500 border-gray-200' :
            'bg-red-50 text-red-600 border-red-200'
          }`}>
            {localStatus === 'accepted' ? <ShieldCheck size={11} /> : localStatus === 'rejected' ? <ShieldX size={11} /> : <ShieldAlert size={11} />}
            {localStatus === 'accepted' ? 'Accepted' : localStatus === 'rejected' ? 'Rejected' : 'Pending'}
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-brand-textSecondary flex items-center gap-1"><Eye size={9} /> Detection Confidence</span>
            <span className="text-[9px] flex items-center gap-1 text-brand-textSecondary"><Wifi size={9} /> {person.streamQuality}</span>
          </div>
          <ConfBar value={person.confidence ?? 0} color={person.confidence && person.confidence >= 80 ? '#E74C3C' : person.confidence && person.confidence >= 65 ? '#F39C12' : '#6B7280'} />
        </div>

        {localStatus === 'pending' && (
          <div className="flex gap-2 mt-2">
            <button onClick={() => handle('accepted')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold"> <ShieldCheck size={13} /> Accept </button>
            <button onClick={() => handle('rejected')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"> <ShieldX size={13} /> Reject </button>
          </div>
        )}

        {localStatus !== 'pending' && (
          <button onClick={() => setLocalStatus('pending')} className="w-full py-1.5 rounded-lg bg-brand-light border border-brand-border text-xs text-brand-textSecondary hover:text-brand-primary hover:border-brand-primary">
            Undo
          </button>
        )}
      </div>
    </motion.div>
  );
}

function MealDetailPanel({ mealType, hallId, date }: { mealType: MealType; hallId: string; date: string }) {
  const [knownList, setKnownList] = useState<DetectedPerson[]>([]);
  const [unknownList, setUnknownList] = useState<DetectedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'registered' | 'unknown'>('registered');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<DetectedPerson | null>(null);

  useEffect(() => {
    if (!hallId || !date) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { known, unknown } = await loadKnownAndUnknown(date, hallId);

        if (cancelled) return;

        console.log('Known after normalization:', known); // Debug log
        console.log('Unknown after normalization:', unknown); // Debug log

        // Filter by meal type
        const knownFiltered = known.filter((p) => {
          const type = String(p.mealType ?? '').toLowerCase();
          return type === mealType;
        });

        const unknownFiltered = unknown.filter((p) => {
          const type = String(p.mealType ?? '').toLowerCase();
          return type === mealType;
        });

        setKnownList(knownFiltered);
        setUnknownList(unknownFiltered);
      } catch (error) {
        console.error('Error loading meal details:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [hallId, date, mealType]);

  const registered = knownList.filter((p) => p.type !== 'unknown');
  const filteredReg = registered.filter((p) =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-4"><SkeletonCard lines={4} /></div>;

  return (
    <div className="mt-4 border-t border-brand-border pt-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setTab('registered')} className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-1 sm:flex-none ${tab === 'registered' ? 'bg-brand-primary text-white shadow-sm' : 'bg-brand-light text-brand-textSecondary hover:text-brand-textPrimary border border-brand-border'}`}>
            <UserCheck size={13} /> Registered
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${tab === 'registered' ? 'bg-white/20' : 'bg-brand-primary/10 text-brand-primary'}`}>{registered.length}</span>
          </button>

          <button onClick={() => setTab('unknown')} className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-1 sm:flex-none ${tab === 'unknown' ? 'bg-red-500 text-white shadow-sm' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}>
            <ShieldAlert size={13} /> Unknown
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${tab === 'unknown' ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>{unknownList.length}</span>
          </button>
        </div>

        {tab === 'registered' && (
          <div className="relative w-full sm:w-auto sm:ml-auto">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="w-full sm:w-44 pl-7 pr-3 py-1.5 text-xs bg-brand-light border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary" />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'registered' && (
          <motion.div key="reg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filteredReg.length === 0 ? (
              <div className="text-center py-8 text-brand-textSecondary text-sm">No students found for this meal</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredReg.map((p, i) => (
                  <StudentCard key={p.id} person={p} index={i} onViewAttendance={(person) => setSelectedStudent(person)} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'unknown' && (
          <motion.div key="unk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {unknownList.length === 0 ? (
              <div className="text-center py-8 text-brand-textSecondary text-sm flex flex-col items-center gap-2">
                <ShieldCheck size={32} className="text-green-400" />
                No unknown persons detected
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unknownList.map((p, i) => (
                  <UnknownCard key={p.id} person={p} index={i} onAction={() => {}} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MealCard({ meal, hallId, date, delay }: { meal: MealSession; hallId: string; date: string; delay: number }) {
  const [expanded, setExpanded] = useState(meal.status === 'ongoing');
  const colors = mealColors[meal.type];
  const pct = meal.total > 0 ? Math.round((meal.registered / meal.total) * 100) : 0;

  const statusConfig = {
    ongoing: { label: 'Ongoing', icon: <Loader2 size={11} className="animate-spin" />, cls: 'bg-green-50 text-green-700 border-green-200' },
    upcoming: { label: 'Upcoming', icon: <Circle size={11} />, cls: 'bg-gray-50 text-gray-500 border-gray-200' },
    completed: { label: 'Completed', icon: <CheckCircle2 size={11} />, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  };

  const sc = statusConfig[meal.status];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={`bg-white rounded-2xl border ${colors.border} shadow-card overflow-hidden`}>
      <div className={`bg-gradient-to-r ${colors.bg} p-3 sm:p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{mealIcons[meal.type]}</span>
            <div>
              <h3 className="font-bold text-brand-textPrimary text-sm sm:text-base">{meal.label}</h3>
              <div className="flex items-center gap-1 text-[10px] text-brand-textSecondary mt-0.5"><Clock size={10} />{meal.timeRange}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${sc.cls}`}>{sc.icon}{sc.label}</span>
            <button onClick={() => setExpanded(!expanded)} className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/70 hover:bg-white border border-white/50 transition-colors text-brand-textSecondary flex-shrink-0">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Registered', value: meal.registered, icon: <UserCheck size={12} className="text-green-600" />, color: 'text-green-700' },
            { label: 'Unregistered', value: meal.unregistered, icon: <UserX size={12} className="text-red-500" />, color: 'text-red-600' },
            { label: 'Total', value: meal.total, icon: <Users size={12} className="text-brand-primary" />, color: 'text-brand-primary' },
            { label: 'Attendance', value: `${pct}%`, icon: null, color: 'text-brand-textPrimary' },
          ].map((s) => (
            <div key={s.label} className="bg-white/70 rounded-xl p-2 border border-white/50 text-center">
              {s.icon ? <div className="flex justify-center mb-0.5">{s.icon}</div> : (
                <div className="flex justify-center mb-0.5"><CircularProgress pct={pct} color={colors.accent} size={28} /></div>
              )}
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-brand-textSecondary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
            <motion.div className={`h-full rounded-full ${colors.progress}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut', delay }} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
            <div className="px-3 sm:px-4 pb-4">
              <MealDetailPanel mealType={meal.type} hallId={hallId} date={date} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function MealCards() {
  const { selectedHall, selectedDate, refreshKey } = useAppStore();
  const hallId = selectedHall?.id ?? '';
  const [meals, setMeals] = useState<MealSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMealData = async () => {
    if (!hallId || !selectedDate) {
      setMeals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { known, unknown } = await loadKnownAndUnknown(selectedDate, hallId);

      console.log('All Known Data:', known);
      console.log('All Unknown Data:', unknown);

      // Group known data by meal type
      const byMealType: Record<MealType, DetectedPerson[]> = { 
        breakfast: [], 
        lunch: [], 
        dinner: [] 
      };
      
      known.forEach((item) => {
        const type = item.mealType as MealType;
        if (type && byMealType[type]) {
          byMealType[type].push(item);
        } else {
          // If no meal type, try to derive from time
          const derivedType = deriveMealType(item.time || item.captured_at);
          if (derivedType && byMealType[derivedType]) {
            byMealType[derivedType].push({ ...item, mealType: derivedType });
          }
        }
      });

      // Group unknown data by meal type
      const unknownByMeal: Record<MealType, DetectedPerson[]> = { 
        breakfast: [], 
        lunch: [], 
        dinner: [] 
      };
      
      unknown.forEach((item) => {
        const type = item.mealType as MealType;
        if (type && unknownByMeal[type]) {
          unknownByMeal[type].push(item);
        } else {
          const derivedType = deriveMealType(item.time || item.captured_at);
          if (derivedType && unknownByMeal[derivedType]) {
            unknownByMeal[derivedType].push({ ...item, mealType: derivedType });
          }
        }
      });

      // Create meal sessions
      const nextMeals: MealSession[] = (['breakfast', 'lunch', 'dinner'] as MealType[]).map((type) => {
        const list = byMealType[type] ?? [];
        const unregistered = unknownByMeal[type]?.length ?? 0;
        const registered = list.length;
        const total = registered + unregistered;

        // Determine status based on current time
        const now = new Date();
        const hour = now.getHours();
        let status: MealStatus = 'upcoming';
        
        if (type === 'breakfast' && hour >= 8 && hour < 10) status = 'ongoing';
        else if (type === 'lunch' && hour >= 12 && hour < 15) status = 'ongoing';
        else if (type === 'dinner' && hour >= 18 && hour < 20) status = 'ongoing';
        else if (type === 'breakfast' && hour >= 10) status = 'completed';
        else if (type === 'lunch' && hour >= 15) status = 'completed';
        else if (type === 'dinner' && hour >= 20) status = 'completed';

        // If there are records, mark as ongoing regardless of time
        if (total > 0 && status === 'upcoming') status = 'ongoing';

        return {
          type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          timeRange: type === 'breakfast' ? '08:00 - 10:00' : type === 'lunch' ? '12:00 - 15:00' : '18:00 - 20:00',
          registered,
          unregistered,
          total,
          status,
        };
      });

      console.log('Generated Meals:', nextMeals);
      setMeals(nextMeals);
    } catch (error) {
      console.error('Error loading meal data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh
  useEffect(() => {
    fetchMealData();
  }, [hallId, selectedDate]);

  // Refresh when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined) {
      fetchMealData();
    }
  }, [refreshKey]);

  if (loading) {
    return <div className="space-y-3"><SkeletonCard lines={3} /></div>;
  }

  return (
    <div className="space-y-4">
      {meals.map((meal, index) => (
        <MealCard key={meal.type} meal={meal} hallId={hallId} date={selectedDate || ''} delay={index * 0.08} />
      ))}
    </div>
  );
}