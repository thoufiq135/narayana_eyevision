import { useEffect, useMemo, useState } from 'react';
import { fetchKnownData, fetchUnknownData } from './dashboardApi';
import { ENDPOINTS } from './config';
import type { StudentAttendanceRecord } from '../types';

// ── Date helpers ──────────────────────────────────────────
// Several components import these directly from hooks.ts.
export function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}
export function today(): string { return toDateStr(new Date()); }
export function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return toDateStr(d);
}

type HookState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

function buildDateRange(from: string, to: string): string[] {
  if (!from || !to) return [];
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getMealType(value?: string): 'breakfast' | 'lunch' | 'dinner' | '' {
  const v = String(value ?? '').toLowerCase();
  if (v.includes('breakfast')) return 'breakfast';
  if (v.includes('lunch')) return 'lunch';
  if (v.includes('dinner')) return 'dinner';
  return '';
}

function getDateKey(value?: string, fallback = ''): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString().slice(0, 10);
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  // Use UTC methods to get UTC time
  return d.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false, // optional: use 24-hour format
    timeZone: 'UTC' // explicitly use UTC
  });
}

function normalizeMealRecords(list: any[] = []) {
  return list.map((item) => ({
    ...item,
    mealType: getMealType(item.meal_type ?? item.mealType ?? item.meal ?? item.type ?? ''),
    time: item.time ?? item.captured_at ?? item.capturedAt ?? '',
  }));
}

// ── Single-day data hooks ──────────────────────────────────
export function useKnownData(date: string, hallId: string): HookState<any[]> {
  const [state, setState] = useState<HookState<any[]>>({
    data: [],
    loading: !!date && !!hallId,
    error: null,
  });

  useEffect(() => {
    if (!date || !hallId) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let active = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await fetchKnownData(date, hallId);
        if (!active) return;

        setState({ data: normalizeMealRecords(result), loading: false, error: null });
      } catch (error) {
        if (!active) return;

        setState({
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load known data',
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [date, hallId]);

  return state;
}

export function useUnknownData(date: string, hallId: string): HookState<any[]> {
  const [state, setState] = useState<HookState<any[]>>({
    data: [],
    loading: !!date && !!hallId,
    error: null,
  });

  useEffect(() => {
    if (!date || !hallId) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let active = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await fetchUnknownData(date, hallId);
        if (!active) return;

        setState({ data: normalizeMealRecords(result), loading: false, error: null });
      } catch (error) {
        if (!active) return;

        setState({
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load unknown data',
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [date, hallId]);

  return state;
}

export function useStudentAttendance(
  hallId: string,
  studentId: string,
  date: string
): HookState<StudentAttendanceRecord | null> {
  const [state, setState] = useState<HookState<StudentAttendanceRecord | null>>({
    data: null,
    loading: !!hallId && !!studentId && !!date,
    error: null,
  });

  useEffect(() => {
    if (!hallId || !studentId || !date) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let active = true;

    const load = async () => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await fetch(
          ENDPOINTS.ATTENDANCE.STUDENT_DETAIL(hallId, studentId, date),
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const payload = await response.json();
        if (active) {
          setState({ data: payload.data ?? payload, loading: false, error: null });
        }
      } catch (error) {
        if (!active) return;
        console.error('Error fetching student attendance:', error);
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load student attendance',
        });
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [hallId, studentId, date]);

  return state;
}

// ── Multi-day range hooks ──────────────────────────────────
function useKnownDataRange(from: string, to: string, hallId: string): HookState<any[]> {
  const [state, setState] = useState<HookState<any[]>>({
    data: [],
    loading: !!from && !!to && !!hallId,
    error: null,
  });

  useEffect(() => {
    if (!from || !to || !hallId) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let active = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const days = buildDateRange(from, to);
        const perDay = await Promise.all(days.map((d) => fetchKnownData(d, hallId)));
        if (!active) return;
        setState({ data: normalizeMealRecords(perDay.flat()), loading: false, error: null });
      } catch (error) {
        if (!active) return;
        setState({
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load known data range',
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [from, to, hallId]);

  return state;
}

function useUnknownDataRange(from: string, to: string, hallId: string): HookState<any[]> {
  const [state, setState] = useState<HookState<any[]>>({
    data: [],
    loading: !!from && !!to && !!hallId,
    error: null,
  });

  useEffect(() => {
    if (!from || !to || !hallId) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let active = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const days = buildDateRange(from, to);
        const perDay = await Promise.all(days.map((d) => fetchUnknownData(d, hallId)));
        if (!active) return;
        setState({ data: normalizeMealRecords(perDay.flat()), loading: false, error: null });
      } catch (error) {
        if (!active) return;
        setState({
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load unknown data range',
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [from, to, hallId]);

  return state;
}

// ── Analytics: weekly attendance ─────────────────────────────
export function useWeeklyAttendance(hallId: string, from: string, to: string): HookState<any[]> {
  const known = useKnownDataRange(from, to, hallId);
  const unknown = useUnknownDataRange(from, to, hallId);

  return useMemo(() => {
    if (known.loading || unknown.loading) {
      return { data: [], loading: true, error: null };
    }

    const days = buildDateRange(from, to);

    const series = days.map((day) => {
      const breakfast = known.data.filter((item) => {
        const key = getDateKey(item.captured_at ?? item.capturedAt ?? item.time, day);
        return key === day && (item.mealType ?? '').toLowerCase() === 'breakfast';
      }).length;

      const lunch = known.data.filter((item) => {
        const key = getDateKey(item.captured_at ?? item.capturedAt ?? item.time, day);
        return key === day && (item.mealType ?? '').toLowerCase() === 'lunch';
      }).length;

      const dinner = known.data.filter((item) => {
        const key = getDateKey(item.captured_at ?? item.capturedAt ?? item.time, day);
        return key === day && (item.mealType ?? '').toLowerCase() === 'dinner';
      }).length;

      const unregistered = unknown.data.filter((item) => {
        const key = getDateKey(item.captured_at ?? item.capturedAt ?? item.time, day);
        return key === day;
      }).length;

      return {
        day: new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        breakfast,
        lunch,
        dinner,
        unregistered,
      };
    });

    return { data: series, loading: false, error: known.error ?? unknown.error ?? null };
  }, [from, to, known, unknown]);
}

// ── Analytics: hourly footfall ─────────────────────────────
export function useHourlyData(hallId: string, date: string): HookState<any[]> {
  const known = useKnownData(date, hallId);
  const unknown = useUnknownData(date, hallId);

  return useMemo(() => {
    if (known.loading || unknown.loading) {
      return { data: [], loading: true, error: null };
    }

    const result = Array.from({ length: 24 }, (_, hour) => {
      const hourLabel = `${String(hour).padStart(2, '0')}:00`;
      const count = [...known.data, ...unknown.data].filter((item) => {
        const raw = item.captured_at ?? item.capturedAt ?? item.time;
        if (!raw) return false;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return false;
        return d.getHours() === hour;
      }).length;

      return { hour: hourLabel, count };
    }).filter((item) => item.count > 0);

    return { data: result, loading: false, error: known.error ?? unknown.error ?? null };
  }, [hallId, date, known, unknown]);
}

// ── Analytics: meal distribution ────────────────────────────
export function useMealDistribution(hallId: string, date: string): HookState<{ name: string; value: number; color: string }[]> {
  const known = useKnownData(date, hallId);
  const unknown = useUnknownData(date, hallId);

  return useMemo(() => {
    if (known.loading || unknown.loading) {
      return { data: [], loading: true, error: null };
    }

    const counts = {
      breakfast: known.data.filter((item) => (item.mealType ?? '').toLowerCase() === 'breakfast').length +
        unknown.data.filter((item) => (item.mealType ?? '').toLowerCase() === 'breakfast').length,
      lunch: known.data.filter((item) => (item.mealType ?? '').toLowerCase() === 'lunch').length +
        unknown.data.filter((item) => (item.mealType ?? '').toLowerCase() === 'lunch').length,
      dinner: known.data.filter((item) => (item.mealType ?? '').toLowerCase() === 'dinner').length +
        unknown.data.filter((item) => (item.mealType ?? '').toLowerCase() === 'dinner').length,
    };

    const palette = { breakfast: '#F39C12', lunch: '#2196F3', dinner: '#9C27B0' };

    return {
      data: (['breakfast', 'lunch', 'dinner'] as const).map((meal) => ({
        name: meal.charAt(0).toUpperCase() + meal.slice(1),
        value: counts[meal],
        color: palette[meal],
      })),
      loading: false,
      error: known.error ?? unknown.error ?? null,
    };
  }, [hallId, date, known, unknown]);
}

// ── Analytics: reg vs unreg ──────────────────────────────────
export function useRegVsUnreg(hallId: string, from: string, to: string): HookState<any[]> {
  const known = useKnownDataRange(from, to, hallId);
  const unknown = useUnknownDataRange(from, to, hallId);

  return useMemo(() => {
    if (known.loading || unknown.loading) {
      return { data: [], loading: true, error: null };
    }

    const days = buildDateRange(from, to);

    const series = days.map((day) => {
      const reg = known.data.filter((item) => getDateKey(item.captured_at ?? item.capturedAt ?? item.time, day) === day).length;
      const unreg = unknown.data.filter((item) => getDateKey(item.captured_at ?? item.capturedAt ?? item.time, day) === day).length;

      return {
        day: new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        reg,
        unreg,
      };
    });

    return { data: series, loading: false, error: known.error ?? unknown.error ?? null };
  }, [hallId, from, to, known, unknown]);
}

// ── Analytics: utilization ──────────────────────────────────
export function useUtilization(hallId: string, date: string): HookState<any[]> {
  const known = useKnownData(date, hallId);
  const unknown = useUnknownData(date, hallId);

  return useMemo(() => {
    if (known.loading || unknown.loading) {
      return { data: [], loading: true, error: null };
    }

    const result = Array.from({ length: 12 }, (_, idx) => {
      const hour = idx * 2;
      const count = [...known.data, ...unknown.data].filter((item) => {
        const raw = item.captured_at ?? item.capturedAt ?? item.time;
        if (!raw) return false;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return false;
        return d.getHours() >= hour && d.getHours() < hour + 2;
      }).length;

      const util = count > 0 ? Math.min((count / 80) * 100, 100) : 0;

      return { time: `${String(hour).padStart(2, '0')}:00`, util: Number(util.toFixed(1)) };
    });

    return { data: result, loading: false, error: known.error ?? unknown.error ?? null };
  }, [hallId, date, known, unknown]);
}

// ── Live detection feed ─────────────────────────────────────
export function useDetection(hallId: string, date: string): HookState<any[]> {
  const known = useKnownData(date, hallId);
  const unknown = useUnknownData(date, hallId);

  return useMemo(() => {
    if (known.loading || unknown.loading) {
      return { data: [], loading: true, error: null };
    }

    const normalize = (raw: any, fallbackType: 'registered' | 'unknown') => {
      const capturedAt = raw.captured_at ?? raw.capturedAt ?? raw.time;
      return {
        ...raw,
        id: String(raw.id ?? `${fallbackType}-${Math.random().toString(36).slice(2)}`),
        type: raw.type ?? fallbackType,
        name: raw.name ?? (fallbackType === 'unknown' ? 'Unknown Person' : 'Unnamed'),
        studentId: raw.studentId ?? raw.student_id,
        confidence: Number(raw.confidence ?? raw.match_confidence ?? 0),
        cameraId: raw.cameraId ?? raw.camera_id,
        time: formatTime(capturedAt),
        mealStatus: raw.mealStatus ?? raw.meal_status,
        _sortTime: capturedAt ? new Date(capturedAt).getTime() : 0,
      };
    };

    const merged = [
      ...known.data.map((r) => normalize(r, 'registered')),
      ...unknown.data.map((r) => normalize(r, 'unknown')),
    ].sort((a, b) => b._sortTime - a._sortTime);

    return { data: merged, loading: false, error: known.error ?? unknown.error ?? null };
  }, [hallId, date, known, unknown]);
}

// ── Cameras hook ─────────────────────────────────────────────
export interface Camera {
  id: string;
  name: string;
  location?: string;
  status: 'online' | 'offline' | 'error';
  streamUrl?: string;
  hallId?: string;
  lastSeen?: string;
  resolution?: string;
  fps?: number;
}

export function useCameras(hallId: string): HookState<Camera[]> {
  const [state, setState] = useState<HookState<Camera[]>>({
    data: [],
    loading: !!hallId,
    error: null,
  });

  useEffect(() => {
    if (!hallId) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let active = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Replace this with your actual camera API endpoint
        const response = await fetch(`/api/cameras?hallId=${encodeURIComponent(hallId)}`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!active) return;

        // Handle different response formats
        let cameras: Camera[] = [];
        if (Array.isArray(data)) {
          cameras = data;
        } else if (data.data && Array.isArray(data.data)) {
          cameras = data.data;
        } else if (data.cameras && Array.isArray(data.cameras)) {
          cameras = data.cameras;
        } else if (data.items && Array.isArray(data.items)) {
          cameras = data.items;
        } else {
          const possibleArray = Object.values(data).find(val => Array.isArray(val));
          if (possibleArray) {
            cameras = possibleArray;
          }
        }

        setState({ 
          data: cameras.map(cam => ({
            ...cam,
            status: cam.status || 'offline',
          })), 
          loading: false, 
          error: null 
        });
      } catch (error) {
        if (!active) return;

        setState({
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load cameras',
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [hallId]);

  return state;
}

// ── Notifications API functions ─────────────────────────────
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  hallId?: string;
  cameraId?: string;
  detectionId?: string;
}

// Get notifications for a hall
export async function fetchNotifications(hallId: string): Promise<Notification[]> {
  try {
    const response = await fetch(`/api/notifications?hallId=${encodeURIComponent(hallId)}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.notifications && Array.isArray(data.notifications)) {
      return data.notifications;
    } else if (data.items && Array.isArray(data.items)) {
      return data.items;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// Mark a single notification as read
export async function markNotificationReadApi(notificationId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ read: true }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to mark notification as read' 
    };
  }
}

// Mark all notifications as read for a hall
export async function markAllNotificationsReadApi(hallId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`/api/notifications?hallId=${encodeURIComponent(hallId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ readAll: true }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to mark all notifications as read' 
    };
  }
}

// Delete a notification
export async function deleteNotificationApi(notificationId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete notification' 
    };
  }
}

// ── Notifications hook ───────────────────────────────────────
export function useNotifications(hallId: string): HookState<Notification[]> & {
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<HookState<Notification[]>>({
    data: [],
    loading: !!hallId,
    error: null,
  });

  const loadNotifications = async () => {
    if (!hallId) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const notifications = await fetchNotifications(hallId);
      setState({ data: notifications, loading: false, error: null });
    } catch (error) {
      setState({
        data: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load notifications',
      });
    }
  };

  // Load notifications on mount and when hallId changes
  useEffect(() => {
    loadNotifications();
  }, [hallId]);

  const markAsRead = async (id: string) => {
    try {
      const result = await markNotificationReadApi(id);
      if (result.success) {
        // Update local state
        setState((prev) => ({
          ...prev,
          data: prev.data?.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          ) || [],
        }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await markAllNotificationsReadApi(hallId);
      if (result.success) {
        // Update local state
        setState((prev) => ({
          ...prev,
          data: prev.data?.map(notif => ({ ...notif, read: true })) || [],
        }));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const result = await deleteNotificationApi(id);
      if (result.success) {
        // Update local state
        setState((prev) => ({
          ...prev,
          data: prev.data?.filter(notif => notif.id !== id) || [],
        }));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
  };
}

// ── Reports ──────────────────────────────────────────────────
type ReportRow = {
  id: string;
  date: string;
  hall: string;
  branch: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner';
  mealTiming: string;
  registered: number;
  registeredEaten: number;
  registeredNotEaten: number;
  unregistered: number;
  attendancePct: number;
};

const MEAL_TIMINGS: Record<'Breakfast' | 'Lunch' | 'Dinner', string> = {
  Breakfast: '08:00 - 10:00',
  Lunch: '12:00 - 14:00',
  Dinner: '18:00 - 20:00',
};

// Keeps the most recently computed report rows available by id so exportReport()
// (which only receives an id) can look up the full row without a refetch.
const reportsCache = new Map<string, ReportRow>();

export function useReports(hallId: string, from: string, to: string): HookState<ReportRow[]> {
  const known = useKnownDataRange(from, to, hallId);
  const unknown = useUnknownDataRange(from, to, hallId);

  return useMemo(() => {
    if (known.loading || unknown.loading) {
      return { data: [], loading: true, error: null };
    }

    const days = buildDateRange(from, to);
    const meals: ('Breakfast' | 'Lunch' | 'Dinner')[] = ['Breakfast', 'Lunch', 'Dinner'];

    const rows: ReportRow[] = [];
    days.forEach((day) => {
      meals.forEach((meal) => {
        const mealKey = meal.toLowerCase();
        const registeredDetections = known.data.filter((item) => {
          const key = getDateKey(item.captured_at ?? item.capturedAt ?? item.time, day);
          return key === day && (item.mealType ?? '').toLowerCase() === mealKey;
        });
        const unregisteredDetections = unknown.data.filter((item) => {
          const key = getDateKey(item.captured_at ?? item.capturedAt ?? item.time, day);
          return key === day && (item.mealType ?? '').toLowerCase() === mealKey;
        });

        const registered = registeredDetections.length;
        const unregistered = unregisteredDetections.length;
        const total = registered + unregistered;

        const row: ReportRow = {
          id: `${hallId}-${day}-${mealKey}`,
          date: day,
          hall: hallId,
          branch: '',
          meal,
          mealTiming: MEAL_TIMINGS[meal],
          registered,
          registeredEaten: registered,
          registeredNotEaten: 0,
          unregistered,
          attendancePct: total > 0 ? Math.round((registered / total) * 100) : 0,
        };

        reportsCache.set(row.id, row);
        rows.push(row);
      });
    });

    return { data: rows, loading: false, error: known.error ?? unknown.error ?? null };
  }, [hallId, from, to, known, unknown]);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function reportToCsv(row: ReportRow): string {
  const headers = ['Date', 'Hall', 'Meal', 'Timing', 'Registered', 'Eaten', 'Not Eaten', 'Unregistered', 'Attendance %'];
  const values = [row.date, row.hall, row.meal, row.mealTiming, row.registered, row.registeredEaten, row.registeredNotEaten, row.unregistered, row.attendancePct];
  return `${headers.join(',')}\n${values.join(',')}`;
}

// Client-side export
export async function exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<void> {
  const row = reportsCache.get(reportId);
  if (!row) {
    console.error(`exportReport: no cached report found for id "${reportId}". Re-render Reports first.`);
    return;
  }

  if (format === 'excel' || format === 'csv') {
    downloadBlob(new Blob([reportToCsv(row)], { type: 'text/csv' }), `report-${reportId}.csv`);
    return;
  }

  // 'pdf': open a print-ready HTML view
  const printable = window.open('', '_blank');
  if (!printable) return;
  printable.document.write(`
    <html><head><title>Report ${reportId}</title></head>
    <body style="font-family:sans-serif;padding:24px;">
      <h2>${row.hall} — ${row.meal} — ${row.date}</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr><th>Timing</th><td>${row.mealTiming}</td></tr>
        <tr><th>Registered</th><td>${row.registered}</td></tr>
        <tr><th>Eaten</th><td>${row.registeredEaten}</td></tr>
        <tr><th>Not Eaten</th><td>${row.registeredNotEaten}</td></tr>
        <tr><th>Unregistered</th><td>${row.unregistered}</td></tr>
        <tr><th>Attendance %</th><td>${row.attendancePct}%</td></tr>
      </table>
      <script>window.onload = () => window.print();</script>
    </body></html>
  `);
  printable.document.close();
}

// ── Export all hooks and functions ──────────────────────────
export default {
  useKnownData,
  useUnknownData,
  useWeeklyAttendance,
  useHourlyData,
  useMealDistribution,
  useRegVsUnreg,
  useUtilization,
  useDetection,
  useCameras,
  useNotifications,
  useReports,
  fetchNotifications,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
  exportReport,
  toDateStr,
  today,
  daysAgo,
};