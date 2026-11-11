import { State, MealSession, DetectedPerson, KPIData, Notification, Report, StudentAttendanceRecord } from '../types';

export const statesData: State[] = [
  {
    id: 'ap', name: 'Andhra Pradesh',
    branches: [
      {
        id: 'nmch-nellore', name: 'Narayana Medical College & Hospital', location: 'Nellore, AP',
        halls: [
          {
            id: 'hall-1', name: 'Dining Hall – 1', number: 'DH-001', capacity: 500,
            registeredStudents: 36, aiStatus: 'online',
            cameras: [
              { id: 'cam-01', name: 'Entry Gate Cam',  status: 'online',  fps: 30, resolution: '1080p', recording: true },
              { id: 'cam-02', name: 'Counter Cam A',   status: 'online',  fps: 25, resolution: '1080p', recording: true },
              { id: 'cam-03', name: 'Counter Cam B',   status: 'online',  fps: 28, resolution: '720p',  recording: true },
              { id: 'cam-04', name: 'Exit Gate Cam',   status: 'offline', fps: 0,  resolution: '1080p', recording: false },
            ],
          },
          {
            id: 'hall-2', name: 'Dining Hall – 2', number: 'DH-002', capacity: 350,
            registeredStudents: 860, aiStatus: 'online',
            cameras: [
              { id: 'cam-05', name: 'Main Entry',  status: 'online', fps: 30, resolution: '1080p', recording: true },
              { id: 'cam-06', name: 'Serving Area', status: 'online', fps: 30, resolution: '1080p', recording: true },
            ],
          },
        ],
      },
      {
        id: 'nmch-vijayawada', name: 'Narayana Medical College & Hospital', location: 'Vijayawada, AP',
        halls: [
          {
            id: 'hall-3', name: 'Dining Hall – 1', number: 'DH-001', capacity: 600,
            registeredStudents: 1580, aiStatus: 'online',
            cameras: [
              { id: 'cam-07', name: 'Entry Cam', status: 'online', fps: 30, resolution: '4K',   recording: true },
              { id: 'cam-08', name: 'Hall Cam',  status: 'online', fps: 30, resolution: '1080p', recording: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ts', name: 'Telangana',
    branches: [
      {
        id: 'nmch-hyd', name: 'Narayana Medical College & Hospital', location: 'Hyderabad, TS',
        halls: [
          {
            id: 'hall-4', name: 'Dining Hall – 1', number: 'DH-001', capacity: 700,
            registeredStudents: 2100, aiStatus: 'online',
            cameras: [
              { id: 'cam-09', name: 'Gate A', status: 'online', fps: 30, resolution: '4K',   recording: true },
              { id: 'cam-10', name: 'Gate B', status: 'online', fps: 30, resolution: '1080p', recording: true },
            ],
          },
        ],
      },
    ],
  },
];

export const getMockMeals = (): MealSession[] => {
  const now = new Date();
  const h = now.getHours();
  const getStatus = (start: number, end: number) =>
    h < start ? 'upcoming' : h < end ? 'ongoing' : 'completed';
  return [
    { type: 'breakfast', label: 'Breakfast', timeRange: '6:00 AM – 9:00 AM',   startHour: 6,  endHour: 9,  registered: 312, unregistered: 4, total: 316, status: getStatus(6, 9) },
    { type: 'lunch',     label: 'Lunch',     timeRange: '12:00 PM – 2:00 PM',  startHour: 12, endHour: 14, registered: 487, unregistered: 7, total: 494, status: getStatus(12, 14) },
    { type: 'dinner',    label: 'Dinner',    timeRange: '7:00 PM – 9:00 PM',   startHour: 19, endHour: 21, registered: 0,   unregistered: 0, total: 0,   status: getStatus(19, 21) },
  ];
};

export const mockKPI: KPIData = { registeredEaten: 799, unregisteredPersons: 11, totalEaten: 810, registeredNotEaten: 441 };

// ── Realistic avatar placeholder (deterministic by seed) ──
function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=2196F3&textColor=ffffff&fontSize=38`;
}

// ── Unknown person captured frame (grey silhouette with red overlay) ──
function unknownFrameUrl(camId: string) {
  // Uses a public placeholder that looks like a camera capture
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${camId}&backgroundColor=1a1a2e&shapeColor=e74c3c`;
}

// ── Registered students per meal ──────────────────────────
const registeredBase: DetectedPerson[] = [
  { id: 'r01', type: 'registered', name: 'Arjun Reddy',      studentId: 'NMCH2021001', confidence: 98.4, department: 'MBBS',       year: '3rd Year', course: 'Medicine',   mealStatus: 'eaten',   time: '12:34 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p' },
  { id: 'r02', type: 'registered', name: 'Priya Sharma',     studentId: 'NMCH2021042', confidence: 97.1, department: 'BDS',        year: '2nd Year', course: 'Dentistry',  mealStatus: 'eaten',   time: '12:35 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p' },
  { id: 'r03', type: 'registered', name: 'Kiran Kumar',      studentId: 'NMCH2022018', confidence: 99.2, department: 'MBBS',       year: '1st Year', course: 'Medicine',   mealStatus: 'eaten',   time: '12:37 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p' },
  { id: 'r04', type: 'registered', name: 'Sneha Patel',      studentId: 'NMCH2021089', confidence: 96.8, department: 'Nursing',    year: '4th Year', course: 'B.Sc Nursing', mealStatus: 'eaten', time: '12:38 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  streamQuality: '1080p' },
  { id: 'r05', type: 'registered', name: 'Rahul Verma',      studentId: 'NMCH2023005', confidence: 95.5, department: 'MBBS',       year: '1st Year', course: 'Medicine',   mealStatus: 'pending', time: '12:41 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p' },
  { id: 'r06', type: 'registered', name: 'Divya Nair',       studentId: 'NMCH2020034', confidence: 98.9, department: 'Pharmacy',   year: '5th Year', course: 'Pharm.D',    mealStatus: 'eaten',   time: '12:42 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  streamQuality: '1080p' },
  { id: 'r07', type: 'registered', name: 'Suresh Babu',      studentId: 'NMCH2022067', confidence: 94.3, department: 'MBBS',       year: '2nd Year', course: 'Medicine',   mealStatus: 'eaten',   time: '12:43 PM', cameraId: 'cam-03', cameraName: 'Counter Cam B',  streamQuality: '720p'  },
  { id: 'r08', type: 'registered', name: 'Ananya Singh',     studentId: 'NMCH2021103', confidence: 97.6, department: 'BDS',        year: '3rd Year', course: 'Dentistry',  mealStatus: 'eaten',   time: '12:44 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p' },
  { id: 'r09', type: 'registered', name: 'Vikram Rao',       studentId: 'NMCH2020089', confidence: 96.1, department: 'Nursing',    year: '3rd Year', course: 'B.Sc Nursing', mealStatus: 'eaten', time: '12:45 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  streamQuality: '1080p' },
  { id: 'r10', type: 'registered', name: 'Meena Krishnan',   studentId: 'NMCH2023021', confidence: 99.0, department: 'MBBS',       year: '1st Year', course: 'Medicine',   mealStatus: 'eaten',   time: '12:46 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p' },
  { id: 'r11', type: 'registered', name: 'Aditya Sharma',    studentId: 'NMCH2021055', confidence: 95.8, department: 'Pharmacy',   year: '3rd Year', course: 'Pharm.D',    mealStatus: 'eaten',   time: '12:47 PM', cameraId: 'cam-03', cameraName: 'Counter Cam B',  streamQuality: '720p'  },
  { id: 'r12', type: 'registered', name: 'Lakshmi Devi',     studentId: 'NMCH2022044', confidence: 97.3, department: 'MBBS',       year: '2nd Year', course: 'Medicine',   mealStatus: 'pending', time: '12:48 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  streamQuality: '1080p' },
  { id: 'r13', type: 'registered', name: 'Ravi Teja',        studentId: 'NMCH2020112', confidence: 98.1, department: 'BDS',        year: '4th Year', course: 'Dentistry',  mealStatus: 'eaten',   time: '12:49 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p' },
  { id: 'r14', type: 'registered', name: 'Pooja Reddy',      studentId: 'NMCH2023038', confidence: 96.4, department: 'Nursing',    year: '1st Year', course: 'B.Sc Nursing', mealStatus: 'eaten', time: '12:50 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  streamQuality: '1080p' },
  { id: 'r15', type: 'registered', name: 'Naveen Kumar',     studentId: 'NMCH2021078', confidence: 94.7, department: 'MBBS',       year: '3rd Year', course: 'Medicine',   mealStatus: 'eaten',   time: '12:51 PM', cameraId: 'cam-03', cameraName: 'Counter Cam B',  streamQuality: '720p'  },
  { id: 'r16', type: 'registered', name: 'Sravani Reddy',    studentId: 'NMCH2022091', confidence: 97.9, department: 'Pharmacy',   year: '2nd Year', course: 'Pharm.D',    mealStatus: 'eaten',   time: '12:52 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p' },
  { id: 'r17', type: 'registered', name: 'Harish Babu',      studentId: 'NMCH2020056', confidence: 95.2, department: 'MBBS',       year: '5th Year', course: 'Medicine',   mealStatus: 'eaten',   time: '12:53 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  streamQuality: '1080p' },
  { id: 'r18', type: 'registered', name: 'Kavitha Rao',      studentId: 'NMCH2021067', confidence: 98.6, department: 'BDS',        year: '3rd Year', course: 'Dentistry',  mealStatus: 'eaten',   time: '12:54 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p' },
];

// Add avatar URLs
const registeredWithAvatars: DetectedPerson[] = registeredBase.map((p) => ({
  ...p,
  capturedFrame: avatarUrl(p.name ?? p.id),
}));

// ── Unknown persons ───────────────────────────────────────
const unknownBase: DetectedPerson[] = [
  { id: 'u01', type: 'unknown', confidence: 72.3, time: '12:36 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  streamQuality: '1080p', alertStatus: 'pending',  meal: 'lunch' },
  { id: 'u02', type: 'unknown', confidence: 68.1, time: '12:40 PM', cameraId: 'cam-03', cameraName: 'Counter Cam B',  streamQuality: '720p',  alertStatus: 'pending',  meal: 'lunch' },
  { id: 'u03', type: 'unknown', confidence: 81.5, time: '07:12 AM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p', alertStatus: 'rejected', meal: 'breakfast' },
  { id: 'u04', type: 'unknown', confidence: 65.9, time: '07:45 AM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  streamQuality: '1080p', alertStatus: 'accepted', meal: 'breakfast' },
  { id: 'u05', type: 'unknown', confidence: 77.4, time: '12:55 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', streamQuality: '1080p', alertStatus: 'pending',  meal: 'lunch' },
  { id: 'u06', type: 'unknown', confidence: 59.2, time: '01:10 PM', cameraId: 'cam-03', cameraName: 'Counter Cam B',  streamQuality: '720p',  alertStatus: 'pending',  meal: 'lunch' },
  { id: 'u07', type: 'unknown', confidence: 83.7, time: '08:05 AM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  streamQuality: '1080p', alertStatus: 'accepted', meal: 'breakfast' },
];

const unknownWithFrames: DetectedPerson[] = unknownBase.map((p) => ({
  ...p,
  capturedFrame: unknownFrameUrl(p.cameraId + p.id),
}));

export const mockDetectedPersons: DetectedPerson[] = [...registeredWithAvatars, ...unknownWithFrames];

// ── Per-meal attendee lists ────────────────────────────────
export function getMockMealAttendees(meal: 'breakfast' | 'lunch' | 'dinner'): DetectedPerson[] {
  if (meal === 'dinner') return [];
  const mealRegistered = registeredWithAvatars
    .filter((_, i) => meal === 'breakfast' ? i < 8 : i >= 8)
    .map((p) => ({ ...p, meal }));
  const mealUnknown = unknownWithFrames.filter((u) => u.meal === meal);
  return [...mealRegistered, ...mealUnknown];
}

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'unknown_person',      message: 'Unknown person detected at Entry Gate Cam',          time: '12:36 PM', read: false, severity: 'danger' },
  { id: 'n2', type: 'camera_offline',      message: 'Exit Gate Cam (cam-04) went offline',                time: '11:52 AM', read: false, severity: 'warning' },
  { id: 'n3', type: 'report_generated',    message: 'Breakfast report generated successfully',            time: '9:00 AM',  read: true,  severity: 'info' },
  { id: 'n4', type: 'unknown_person',      message: 'Unknown person detected at Counter Cam B',           time: '12:40 PM', read: false, severity: 'danger' },
  { id: 'n5', type: 'attendance_complete', message: 'Breakfast attendance finalized – 316 students',      time: '9:01 AM',  read: true,  severity: 'info' },
];

export const mockReports: Report[] = [
  { id: 'r1', date: '2025-01-15', state: 'Andhra Pradesh', branch: 'NMCH Nellore', hall: 'Dining Hall – 1', meal: 'Breakfast', mealTiming: '6:00 AM – 9:00 AM',  capacity: 500, registered: 23, registeredEaten: 312, registeredNotEaten: 928, unregistered: 4, totalAttendance: 316, attendancePct: 25.2, generatedAt: '9:00 AM' },
  { id: 'r2', date: '2025-01-15', state: 'Andhra Pradesh', branch: 'NMCH Nellore', hall: 'Dining Hall – 1', meal: 'Lunch',     mealTiming: '12:00 PM – 2:00 PM', capacity: 500, registered: 23, registeredEaten: 487, registeredNotEaten: 753, unregistered: 7, totalAttendance: 494, attendancePct: 39.3, generatedAt: '2:00 PM' },
  { id: 'r3', date: '2025-01-14', state: 'Andhra Pradesh', branch: 'NMCH Nellore', hall: 'Dining Hall – 1', meal: 'Dinner',    mealTiming: '7:00 PM – 9:00 PM',  capacity: 500, registered: 23, registeredEaten: 601, registeredNotEaten: 639, unregistered: 2, totalAttendance: 603, attendancePct: 48.5, generatedAt: '9:00 PM' },
  { id: 'r4', date: '2025-01-14', state: 'Andhra Pradesh', branch: 'NMCH Nellore', hall: 'Dining Hall – 1', meal: 'Lunch',     mealTiming: '12:00 PM – 2:00 PM', capacity: 500, registered: 23, registeredEaten: 521, registeredNotEaten: 719, unregistered: 5, totalAttendance: 526, attendancePct: 42.0, generatedAt: '2:00 PM' },
];

export const weeklyAttendanceData = [
  { day: 'Mon', breakfast: 298, lunch: 512, dinner: 589 },
  { day: 'Tue', breakfast: 321, lunch: 498, dinner: 601 },
  { day: 'Wed', breakfast: 287, lunch: 534, dinner: 578 },
  { day: 'Thu', breakfast: 312, lunch: 487, dinner: 612 },
  { day: 'Fri', breakfast: 334, lunch: 521, dinner: 598 },
  { day: 'Sat', breakfast: 256, lunch: 445, dinner: 534 },
  { day: 'Sun', breakfast: 198, lunch: 389, dinner: 467 },
];

export const mealDistributionData = [
  { name: 'Breakfast', value: 312, color: '#F39C12' },
  { name: 'Lunch',     value: 487, color: '#2196F3' },
  { name: 'Dinner',    value: 0,   color: '#9C27B0' },
];

export const hourlyData = [
  { hour: '6AM',  count: 45  }, { hour: '7AM',  count: 142 }, { hour: '8AM',  count: 98  },
  { hour: '9AM',  count: 27  }, { hour: '10AM', count: 8   }, { hour: '11AM', count: 12  },
  { hour: '12PM', count: 187 }, { hour: '1PM',  count: 234 }, { hour: '2PM',  count: 66  },
  { hour: '3PM',  count: 14  }, { hour: '4PM',  count: 9   }, { hour: '5PM',  count: 11  },
  { hour: '6PM',  count: 18  }, { hour: '7PM',  count: 0   }, { hour: '8PM',  count: 0   },
];

// ── Student daily attendance records ────────────────────────────────
const today = new Date().toISOString().split('T')[0];

export const mockStudentAttendance: StudentAttendanceRecord[] = [
  {
    studentId: 'NMCH2021001', name: 'Arjun Reddy',    department: 'MBBS',    year: '3rd Year', course: 'Medicine',    date: today,
    capturedFrame: avatarUrl('Arjun Reddy'),
    breakfast: { status: 'eaten',   time: '07:42 AM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 98.4 },
    lunch:     { status: 'eaten',   time: '12:34 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 97.8 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2021042', name: 'Priya Sharma',   department: 'BDS',     year: '2nd Year', course: 'Dentistry',   date: today,
    capturedFrame: avatarUrl('Priya Sharma'),
    breakfast: { status: 'skipped' },
    lunch:     { status: 'eaten',   time: '12:35 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 97.1 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 1, attendancePct: 33,
  },
  {
    studentId: 'NMCH2022018', name: 'Kiran Kumar',    department: 'MBBS',    year: '1st Year', course: 'Medicine',    date: today,
    capturedFrame: avatarUrl('Kiran Kumar'),
    breakfast: { status: 'eaten',   time: '06:58 AM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 99.2 },
    lunch:     { status: 'eaten',   time: '12:37 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 98.9 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2021089', name: 'Sneha Patel',    department: 'Nursing', year: '4th Year', course: 'B.Sc Nursing', date: today,
    capturedFrame: avatarUrl('Sneha Patel'),
    breakfast: { status: 'eaten',   time: '07:15 AM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  confidence: 96.8 },
    lunch:     { status: 'eaten',   time: '12:38 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  confidence: 95.4 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2023005', name: 'Rahul Verma',    department: 'MBBS',    year: '1st Year', course: 'Medicine',    date: today,
    capturedFrame: avatarUrl('Rahul Verma'),
    breakfast: { status: 'skipped' },
    lunch:     { status: 'eaten',   time: '12:41 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 95.5 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 1, attendancePct: 33,
  },
  {
    studentId: 'NMCH2020034', name: 'Divya Nair',     department: 'Pharmacy', year: '5th Year', course: 'Pharm.D',   date: today,
    capturedFrame: avatarUrl('Divya Nair'),
    breakfast: { status: 'eaten',   time: '07:30 AM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  confidence: 98.9 },
    lunch:     { status: 'eaten',   time: '12:42 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  confidence: 98.1 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2022067', name: 'Suresh Babu',    department: 'MBBS',    year: '2nd Year', course: 'Medicine',    date: today,
    capturedFrame: avatarUrl('Suresh Babu'),
    breakfast: { status: 'eaten',   time: '08:02 AM', cameraId: 'cam-03', cameraName: 'Counter Cam B',  confidence: 94.3 },
    lunch:     { status: 'skipped' },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 1, attendancePct: 33,
  },
  {
    studentId: 'NMCH2021103', name: 'Ananya Singh',   department: 'BDS',     year: '3rd Year', course: 'Dentistry',   date: today,
    capturedFrame: avatarUrl('Ananya Singh'),
    breakfast: { status: 'eaten',   time: '07:55 AM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 97.6 },
    lunch:     { status: 'eaten',   time: '12:44 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 96.9 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2020089', name: 'Vikram Rao',     department: 'Nursing', year: '3rd Year', course: 'B.Sc Nursing', date: today,
    capturedFrame: avatarUrl('Vikram Rao'),
    breakfast: { status: 'skipped' },
    lunch:     { status: 'eaten',   time: '12:45 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  confidence: 96.1 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 1, attendancePct: 33,
  },
  {
    studentId: 'NMCH2023021', name: 'Meena Krishnan', department: 'MBBS',    year: '1st Year', course: 'Medicine',    date: today,
    capturedFrame: avatarUrl('Meena Krishnan'),
    breakfast: { status: 'eaten',   time: '06:45 AM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 99.0 },
    lunch:     { status: 'eaten',   time: '12:46 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 98.7 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2021055', name: 'Aditya Sharma',  department: 'Pharmacy', year: '3rd Year', course: 'Pharm.D',   date: today,
    capturedFrame: avatarUrl('Aditya Sharma'),
    breakfast: { status: 'eaten',   time: '07:20 AM', cameraId: 'cam-03', cameraName: 'Counter Cam B',  confidence: 95.8 },
    lunch:     { status: 'eaten',   time: '12:47 PM', cameraId: 'cam-03', cameraName: 'Counter Cam B',  confidence: 94.2 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2022044', name: 'Lakshmi Devi',   department: 'MBBS',    year: '2nd Year', course: 'Medicine',    date: today,
    capturedFrame: avatarUrl('Lakshmi Devi'),
    breakfast: { status: 'skipped' },
    lunch:     { status: 'skipped' },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 0, attendancePct: 0,
  },
  {
    studentId: 'NMCH2020112', name: 'Ravi Teja',      department: 'BDS',     year: '4th Year', course: 'Dentistry',   date: today,
    capturedFrame: avatarUrl('Ravi Teja'),
    breakfast: { status: 'eaten',   time: '07:48 AM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 98.1 },
    lunch:     { status: 'eaten',   time: '12:49 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 97.5 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2023038', name: 'Pooja Reddy',    department: 'Nursing', year: '1st Year', course: 'B.Sc Nursing', date: today,
    capturedFrame: avatarUrl('Pooja Reddy'),
    breakfast: { status: 'eaten',   time: '08:10 AM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  confidence: 96.4 },
    lunch:     { status: 'eaten',   time: '12:50 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  confidence: 95.8 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2021078', name: 'Naveen Kumar',   department: 'MBBS',    year: '3rd Year', course: 'Medicine',    date: today,
    capturedFrame: avatarUrl('Naveen Kumar'),
    breakfast: { status: 'skipped' },
    lunch:     { status: 'eaten',   time: '12:51 PM', cameraId: 'cam-03', cameraName: 'Counter Cam B',  confidence: 94.7 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 1, attendancePct: 33,
  },
  {
    studentId: 'NMCH2022091', name: 'Sravani Reddy',  department: 'Pharmacy', year: '2nd Year', course: 'Pharm.D',   date: today,
    capturedFrame: avatarUrl('Sravani Reddy'),
    breakfast: { status: 'eaten',   time: '07:05 AM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 97.9 },
    lunch:     { status: 'eaten',   time: '12:52 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 97.2 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2020056', name: 'Harish Babu',    department: 'MBBS',    year: '5th Year', course: 'Medicine',    date: today,
    capturedFrame: avatarUrl('Harish Babu'),
    breakfast: { status: 'eaten',   time: '07:38 AM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  confidence: 95.2 },
    lunch:     { status: 'eaten',   time: '12:53 PM', cameraId: 'cam-02', cameraName: 'Counter Cam A',  confidence: 94.8 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
  {
    studentId: 'NMCH2021067', name: 'Kavitha Rao',    department: 'BDS',     year: '3rd Year', course: 'Dentistry',   date: today,
    capturedFrame: avatarUrl('Kavitha Rao'),
    breakfast: { status: 'eaten',   time: '07:52 AM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 98.6 },
    lunch:     { status: 'eaten',   time: '12:54 PM', cameraId: 'cam-01', cameraName: 'Entry Gate Cam', confidence: 98.0 },
    dinner:    { status: 'upcoming' },
    totalMealsEaten: 2, attendancePct: 67,
  },
];

export function getMockStudentAttendance(studentId: string, _date: string): StudentAttendanceRecord | null {
  return mockStudentAttendance.find((s) => s.studentId === studentId) ?? null;
}

export function getMockAllStudentAttendance(_hallId: string, _date: string): StudentAttendanceRecord[] {
  return mockStudentAttendance;
}
