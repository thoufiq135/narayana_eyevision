export interface State { id: string; name: string; branches: Branch[]; }
export interface Branch { id: string; name: string; location: string; halls: Hall[]; }
export interface Hall {
  id: string; name: string; number: string; capacity: number;
  registeredStudents: number; cameras: Camera[]; aiStatus: 'online' | 'offline';
}
export interface Camera {
  id: string; name: string; status: 'online' | 'offline'; fps: number;
  resolution: string; recording: boolean; streamUrl?: string;
}
export interface MealSession {
  type: 'breakfast' | 'lunch' | 'dinner';
  label: string; timeRange: string; startHour: number; endHour: number;
  registered: number; unregistered: number; total: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}
export interface DetectedPerson {
  id: string; type: 'registered' | 'unknown';
  // registered fields
  name?: string; studentId?: string; confidence: number;
  department?: string; year?: string; course?: string;
  mealStatus?: 'eaten' | 'pending';
  // unknown fields
  capturedFrame?: string;   // base64 or URL of camera snapshot
  cameraName?: string;
  streamQuality?: string;   // e.g. '1080p', '720p', '4K'
  alertStatus?: 'pending' | 'accepted' | 'rejected';
  // common
  time: string; cameraId: string;
  meal?: 'breakfast' | 'lunch' | 'dinner';
  bbox?: { x: number; y: number; w: number; h: number };
}
export interface KPIData {
  registeredEaten: number; unregisteredPersons: number;
  totalEaten: number; registeredNotEaten: number;
}
export interface Notification {
  id: string; type: 'unknown_person' | 'camera_offline' | 'ai_offline' | 'report_generated' | 'attendance_complete';
  message: string; time: string; read: boolean; severity: 'info' | 'warning' | 'danger';
}
export interface Report {
  id: string; date: string; state: string; branch: string; hall: string;
  meal: string; mealTiming: string; capacity: number; registered: number;
  registeredEaten: number; registeredNotEaten: number; unregistered: number;
  totalAttendance: number; attendancePct: number; generatedAt: string;
}

// ── Student daily attendance record ─────────────────────
export interface MealRecord {
  status: 'eaten' | 'skipped' | 'upcoming';
  time?: string;          // time eaten e.g. '07:42 AM'
  cameraId?: string;
  cameraName?: string;
  confidence?: number;
}
export interface StudentAttendanceRecord {
  studentId: string;
  name: string;
  department: string;
  year: string;
  course: string;
  capturedFrame?: string;
  date: string;
  breakfast: MealRecord;
  lunch: MealRecord;
  dinner: MealRecord;
  totalMealsEaten: number;   // 0-3
  attendancePct: number;     // 0-100
}

// ── Date range ────────────────────────────────────────────
export type DateRangePreset = 'today' | 'yesterday' | '7days' | '30days' | 'custom';
export interface DateRange {
  from: string;   // YYYY-MM-DD
  to: string;     // YYYY-MM-DD
  preset: DateRangePreset;
}

// ── App store ─────────────────────────────────────────────
export interface AppState {
  selectedState: State | null;
  selectedBranch: Branch | null;
  selectedHall: Hall | null;
  refreshKey: number;
  sidebarOpen: boolean;
  activeSection: string;
  notifications: Notification[];
  kpi: KPIData;
  meals: MealSession[];
  detectedPersons: DetectedPerson[];
  reports: Report[];
  // Date context
  selectedDate: string;           // YYYY-MM-DD – single date view
  dateRange: DateRange;           // range view (analytics, reports)
  setSelectedState: (s: State | null) => void;
  setSelectedBranch: (b: Branch | null) => void;
  setSelectedHall: (h: Hall | null) => void;
  clearLocation: () => void;
  setSidebarOpen: (v: boolean) => void;
  setActiveSection: (s: string) => void;
  markNotificationRead: (id: string) => void;
  updateKPI: (data: Partial<KPIData>) => void;
  setSelectedDate: (date: string) => void;
  setDateRange: (range: DateRange) => void;
}
