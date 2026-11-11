// ============================================================
//  STACKENZO EYE VISION – API CONFIGURATION
//  All API base URLs and endpoints are defined here.
//  To switch from mock → real backend, change BASE_URL only.
// ============================================================

export const API_CONFIG = {
  // Was previously commented out entirely, which left API_CONFIG.BASE_URL
  // undefined — harmless for `npm run dev` (Vite doesn't type-check) but
  // fails `npm run build` (tsc -b) since client.ts references this field.
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',

  // Auth token key in localStorage
  TOKEN_KEY: 'stackenzo_token',

  // Request timeout in ms
  TIMEOUT: 15000,

  // WebSocket URL for live updates
  WS_URL: 'wss://ws.stackenzo.io/live',
  // WS_URL: 'ws://localhost:8000/ws',
} as const;

// ── Remote Detection API Base ──────────────────────────────
const REMOTE_DETECTION_BASE = '/getData';

// ── Build Remote Detection URLs ─────────────────────────────
const buildRemoteDetectionUrl = (type: string, params?: { date?: string; hallId?: string }) => {
  const url = `${REMOTE_DETECTION_BASE}/${type}`;
  // const url = ``;
  const searchParams = new URLSearchParams();

  if (params?.date && params.date !== '') {
    searchParams.append('date', params.date);
  }

  if (params?.hallId && params.hallId !== '') {
    searchParams.append('hallId', params.hallId);
  }

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
};

// ── Endpoint builders ─────────────────────────────────────
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: () => `/auth/login`,
    LOGOUT: () => `/auth/logout`,
    REFRESH: () => `/auth/refresh`,
    ME: () => `/auth/me`,
  },

  // Hierarchy
  STATES: () => `/states`,
  BRANCHES: (stateId: string) => `/states/${stateId}/branches`,
  HALLS: (branchId: string) => `/branches/${branchId}/halls`,
  HALL_DETAIL: (hallId: string) => `/halls/${hallId}`,

  // KPI – date-aware
  KPI: {
    SUMMARY: (hallId: string, date: string) => `/halls/${hallId}/kpi?date=${date}`,
    RANGE: (hallId: string, from: string, to: string) => `/halls/${hallId}/kpi/range?from=${from}&to=${to}`,
  },

  // Meals – date-aware
  MEALS: {
    SESSIONS: (hallId: string, date: string) => `/halls/${hallId}/meals?date=${date}`,
    SESSION_DETAIL: (hallId: string, mealType: string, date: string) => `/halls/${hallId}/meals/${mealType}?date=${date}`,
  },

  // Attendance – date-aware
  ATTENDANCE: {
    DAILY: (hallId: string, date: string) => `/halls/${hallId}/attendance?date=${date}`,
    RANGE: (hallId: string, from: string, to: string) => `/halls/${hallId}/attendance/range?from=${from}&to=${to}`,
    NOT_EATEN: (hallId: string, date: string, meal: string) => `/halls/${hallId}/attendance/not-eaten?date=${date}&meal=${meal}`,
    STUDENTS: (hallId: string, date: string) => `/halls/${hallId}/attendance/students?date=${date}`,
    STUDENT_DETAIL: (hallId: string, studentId: string, date: string) => `/halls/${hallId}/attendance/students/${studentId}?date=${date}`,
  },

  // Live detection
  DETECTION: {
    LIVE: (hallId: string) => `/halls/${hallId}/detection/live`,
    HISTORY: (hallId: string, date: string) => `/halls/${hallId}/detection/history?date=${date}`,
    UNKNOWN: (params?: { date?: string; hallId?: string }) => buildRemoteDetectionUrl('unknown-data', params),
    KNOWN: (params?: { date?: string; hallId?: string }) => buildRemoteDetectionUrl('known', params),
    UNKNOWN_DATA: (params?: { date?: string; hallId?: string }) => buildRemoteDetectionUrl('unknown-data', params),
  },

  // Analytics – date-aware
  ANALYTICS: {
    WEEKLY: (hallId: string, from: string, to: string) => `/halls/${hallId}/analytics/weekly?from=${from}&to=${to}`,
    HOURLY: (hallId: string, date: string) => `/halls/${hallId}/analytics/hourly?date=${date}`,
    MEAL_DIST: (hallId: string, date: string) => `/halls/${hallId}/analytics/meal-distribution?date=${date}`,
    UTILIZATION: (hallId: string, date: string) => `/halls/${hallId}/analytics/utilization?date=${date}`,
    REG_VS_UNREG: (hallId: string, from: string, to: string) => `/halls/${hallId}/analytics/reg-vs-unreg?from=${from}&to=${to}`,
    TREND: (hallId: string, from: string, to: string) => `/halls/${hallId}/analytics/trend?from=${from}&to=${to}`,
  },

  // Reports – date-aware
  REPORTS: {
    LIST: (hallId: string, from: string, to: string) => `/halls/${hallId}/reports?from=${from}&to=${to}`,
    DETAIL: (reportId: string) => `/reports/${reportId}`,
    EXPORT_PDF: (reportId: string) => `/reports/${reportId}/export/pdf`,
    EXPORT_EXCEL: (reportId: string) => `/reports/${reportId}/export/excel`,
    EXPORT_CSV: (reportId: string) => `/reports/${reportId}/export/csv`,
    GENERATE: (hallId: string) => `/halls/${hallId}/reports/generate`,
  },

  // Cameras
  CAMERAS: {
    LIST: (hallId: string) => `/halls/${hallId}/cameras`,
    DETAIL: (cameraId: string) => `/cameras/${cameraId}`,
    STREAM: (cameraId: string) => `/cameras/${cameraId}/stream`,
    HEALTH: (cameraId: string) => `/cameras/${cameraId}/health`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: (hallId: string) => `/halls/${hallId}/notifications`,
    MARK_READ: (notifId: string) => `/notifications/${notifId}/read`,
    MARK_ALL_READ: (hallId: string) => `/halls/${hallId}/notifications/read-all`,
  },
} as const;

// ── Export individual endpoints for convenience ────────────
// These now correctly use the unknown-data endpoint
export const REGISTERED_USERS = (params?: { date?: string; hallId?: string }) =>
  buildRemoteDetectionUrl('known', params);

export const UNKNOWN_USERS = (params?: { date?: string; hallId?: string }) =>
  buildRemoteDetectionUrl('unknown-data', params);

export const UNKNOWN_USERS_LEGACY = (params?: { date?: string; hallId?: string }) =>
  buildRemoteDetectionUrl('unknown', params);