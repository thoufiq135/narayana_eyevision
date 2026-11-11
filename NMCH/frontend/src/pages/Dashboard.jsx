import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  getCameras, 
  getEvents, 
  getSummary,
  getEmployees,
  isKnownEvent,
  isUnknownEvent
} from "../api/api";
import ToastStack from "../components/ToastStack";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import {
  MdPeople, MdCamera, MdWarning, MdCheckCircle, MdTimeline,
  MdTrendingUp, MdTrendingDown, MdAccessTime, MdCalendarToday,
  MdImage, MdClose, MdVideocam
} from 'react-icons/md';

const POLL_INTERVAL_MS = 8000;
const TOAST_LIFETIME_MS = 6000;

// Security-console palette: amber = live/primary signal, cyan = recognized,
// crimson = alert, slate = neutral chrome.
const COLORS = {
  primary: '#e8a33d',   // console amber — "this is active right now"
  known: '#3ddbd9',     // phosphor cyan — recognized / cleared
  unknown: '#ef4462',   // alert crimson — needs a human
  neutral: '#7d89a8',   // slate — chrome, inactive
  glow: '#f5c86c',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const CHART_COLORS = [COLORS.known, COLORS.primary, COLORS.unknown, COLORS.neutral, '#8b6fd6', '#4f9fe8'];

// ============================================================
// CameraFeed Component
// ============================================================
function CameraFeed() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      background: '#000',
      borderRadius: 16,
      padding: '8px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.05)',
      border: '2px solid #1a1a2e',
    }}>
      {/* TV Frame Effect */}
      <div style={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#0a0a0a',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Scanline Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          background: `repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          )`,
        }} />

        {/* Vignette Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9,
          background: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)`,
        }} />

        {/* Corner Glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 8,
          background: `radial-gradient(circle at top right, rgba(232,163,61,0.05), transparent 70%)`,
        }} />

        {isLoading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            zIndex: 5,
            gap: 20,
          }}>
            <div style={{
              width: 60,
              height: 60,
              border: '3px solid rgba(232,163,61,0.1)',
              borderTop: '3px solid #e8a33d',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{
              color: 'var(--text-muted)',
              fontSize: 14,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Initializing feed...
            </p>
            <div style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#ef4462',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: 11,
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
              }}>
                LIVE
              </span>
            </div>
          </div>
        )}
        
        {hasError ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            background: '#0a0a0a',
            minHeight: '300px',
            justifyContent: 'center',
            width: '100%',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MdVideocam size={32} style={{ color: '#ef4462' }} />
            </div>
            <div>
              <p style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                Camera Feed Unavailable
              </p>
              <p style={{ 
                fontSize: 13, 
                opacity: 0.6,
                margin: '4px 0 0',
                fontFamily: 'var(--font-mono)',
              }}>
                Connection lost or camera offline
              </p>
            </div>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                // Reload the image
                const img = document.querySelector('.camera-feed-image');
                if (img) {
                  img.src = `http://192.168.0.6:8000/video_feed?t=${Date.now()}`;
                }
              }}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                border: '1px solid rgba(232,163,61,0.3)',
                background: 'rgba(232,163,61,0.1)',
                color: '#e8a33d',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(232,163,61,0.2)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(232,163,61,0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <img
            src="http://192.168.0.6:8000/video_feed"
            alt="CCTV Feed"
            className="camera-feed-image"
            style={{ 
              width: "100%", 
              display: 'block',
              minHeight: '300px',
              maxHeight: '70vh',
              objectFit: 'cover',
              background: '#0a0a0a',
            }}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}

        {/* Watermark / Channel Badge */}
        {!isLoading && !hasError && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)',
              padding: '4px 12px 4px 8px',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#ef4462',
                animation: 'pulse 1.5s ease-in-out infinite',
                display: 'inline-block',
              }} />
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
              }}>
                LIVE
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)',
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#e8a33d',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-display)',
              }}>
                🎥 CCTV • CAM-01
              </span>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {!isLoading && !hasError && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 6,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.05em',
              fontFamily: 'var(--font-mono)',
            }}>
              {new Date().toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
        )}

        {/* Status Bar */}
        {!isLoading && !hasError && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 6,
            padding: '6px 12px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.15em',
              fontFamily: 'var(--font-mono)',
            }}>
              REC • 1080p • 30FPS
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono)',
            }}>
              ● SECURE
            </span>
          </div>
        )}
      </div>

      {/* TV Stand / Feet */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 80,
        marginTop: 8,
        paddingBottom: 4,
      }}>
        <div style={{
          width: 40,
          height: 6,
          background: 'linear-gradient(180deg, #1a1a2e, #0a0a0a)',
          borderRadius: '0 0 4px 4px',
          border: '1px solid rgba(255,255,255,0.03)',
          borderTop: 'none',
        }} />
        <div style={{
          width: 40,
          height: 6,
          background: 'linear-gradient(180deg, #1a1a2e, #0a0a0a)',
          borderRadius: '0 0 4px 4px',
          border: '1px solid rgba(255,255,255,0.03)',
          borderTop: 'none',
        }} />
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .camera-feed-image {
          transition: opacity 0.5s ease;
        }

        .camera-feed-image[src=""] {
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Helper Functions
// ============================================================
function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

function formatConfidence(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const pct = Number(value) <= 1 ? Number(value) * 100 : Number(value);
  return `${Math.round(pct)}%`;
}

function dayKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown";
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function dayLabel(key) {
  if (key === "unknown") return "Unknown date";
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  const d = new Date(key);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function groupByDay(events) {
  const buckets = new Map();
  for (const event of events) {
    const key = dayKey(event.event_time);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(event);
  }
  const groups = Array.from(buckets.entries()).map(([key, items]) => ({
    key,
    label: dayLabel(key),
    events: [...items].sort((a, b) => new Date(b.event_time) - new Date(a.event_time)),
  }));
  groups.sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
  return groups;
}

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  return letters.join("") || "?";
}

function minutesSince(value) {
  if (!value) return Infinity;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / 60000;
}

function computeTrend(series, key) {
  if (!series || series.length < 2) return null;
  const last = series[series.length - 1][key];
  const prev = series[series.length - 2][key];
  if (prev === 0) {
    if (last === 0) return { pct: 0, dir: "flat" };
    return { pct: 100, dir: "up" };
  }
  const pct = Math.round(((last - prev) / prev) * 100);
  return { pct: Math.abs(pct), dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

function Sparkline({ values, color }) {
  const width = 100;
  const height = 28;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - (v / max) * (height - 4) - 2).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getEventImage(event) {
  if (!event) return null;
  
  const imageFields = [
    event.image,
    event.image_url,
    event.image_data,
    event.freeze_frame,
    event.thumbnail,
    event.snapshot,
    event.person_image,
    event.face_image,
    event.capture,
    event.frame,
    event.image_base64,
    event.image_link
  ];

  for (const field of imageFields) {
    if (field) {
      if (typeof field === 'string' && field.startsWith('data:image')) {
        return field;
      }
      if (typeof field === 'string' && (field.startsWith('http://') || field.startsWith('https://'))) {
        return field;
      }
      if (typeof field === 'string' && field.length > 100 && !field.startsWith('http')) {
        if (/^[A-Za-z0-9+/=]+$/.test(field.substring(0, 100))) {
          return `data:image/jpeg;base64,${field}`;
        }
        return field;
      }
      if (typeof field === 'object' && field.url) {
        return field.url;
      }
      if (typeof field === 'object' && field.data) {
        return `data:image/jpeg;base64,${field.data}`;
      }
    }
  }

  if (event.employee && event.employee.image) {
    return event.employee.image;
  }

  return null;
}

// ============================================================
// Main Dashboard Component
// ============================================================
export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [knownEvents, setKnownEvents] = useState([]);
  const [unknownEvents, setUnknownEvents] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedImage, setSelectedImage] = useState(null);

  const activeRef = useRef(true);

  const chartData = useMemo(() => {
    const today = new Date();
    const days = [];
    const counts = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      days.push({
        date: key,
        label: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
        known: 0,
        unknown: 0,
        total: 0
      });
      counts[key] = { known: 0, unknown: 0 };
    }

    [...knownEvents, ...unknownEvents].forEach(event => {
      const key = dayKey(event.event_time);
      if (counts[key]) {
        if (isKnownEvent(event)) {
          counts[key].known++;
        } else {
          counts[key].unknown++;
        }
        counts[key].total++;
      }
    });

    return days.map(day => ({
      ...day,
      known: counts[day.date]?.known || 0,
      unknown: counts[day.date]?.unknown || 0,
      total: counts[day.date]?.total || 0
    }));
  }, [knownEvents, unknownEvents]);

  const trends = useMemo(() => ({
    total: computeTrend(chartData, 'total'),
    known: computeTrend(chartData, 'known'),
    unknown: computeTrend(chartData, 'unknown'),
  }), [chartData]);

  const mealData = useMemo(() => {
    const meals = { breakfast: 0, lunch: 0, dinner: 0, other: 0 };
    knownEvents.forEach(event => {
      const meal = (event.meal_type || event.meal || '').toLowerCase();
      if (meal.includes('breakfast')) meals.breakfast++;
      else if (meal.includes('lunch')) meals.lunch++;
      else if (meal.includes('dinner')) meals.dinner++;
      else meals.other++;
    });
    return Object.entries(meals).map(([name, value]) => ({ name, value }));
  }, [knownEvents]);

  const mealTotal = useMemo(() => mealData.reduce((sum, m) => sum + m.value, 0), [mealData]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i}:00`,
      count: 0
    }));
    [...knownEvents, ...unknownEvents].forEach(event => {
      const h = new Date(event.event_time).getHours();
      if (hours[h]) hours[h].count++;
    });
    return hours;
  }, [knownEvents, unknownEvents]);

  const cameraStats = useMemo(() => {
    const days = chartData.map(d => d.date);
    return cameras.map(camera => {
      const events = [...knownEvents, ...unknownEvents].filter(e => 
        e.camera_name === camera.name || e.camera_id === camera.id
      );
      const lastEvent = events.length > 0 ? events.reduce((a, b) => 
        new Date(a.event_time) > new Date(b.event_time) ? a : b
      ) : null;
      const dailyCounts = days.map(day => events.filter(e => dayKey(e.event_time) === day).length);
      return {
        ...camera,
        eventCount: events.length,
        lastEvent: lastEvent,
        isActive: lastEvent && (Date.now() - new Date(lastEvent.event_time).getTime()) < 300000,
        dailyCounts,
      };
    });
  }, [cameras, knownEvents, unknownEvents, chartData]);

  const todaysEmployees = useMemo(() => {
    const todayKey = dayKey(new Date());
    const latestByEmployee = new Map();

    for (const event of knownEvents) {
      if (dayKey(event.event_time) !== todayKey) continue;
      const empKey = event.employee_code || event.employee_name || event.id;
      const existing = latestByEmployee.get(empKey);
      if (!existing || new Date(event.event_time) > new Date(existing.event_time)) {
        latestByEmployee.set(empKey, event);
      }
    }

    return Array.from(latestByEmployee.values()).sort(
      (a, b) => new Date(b.event_time) - new Date(a.event_time)
    );
  }, [knownEvents]);

  const pushToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_LIFETIME_MS);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const [summaryData, eventsData, cameraData, employeeData] = await Promise.all([
        getSummary(),
        getEvents({ limit: 200 }),
        getCameras(),
        getEmployees(),
      ]);

      if (!activeRef.current) return;

      const allEvents = Array.isArray(eventsData) ? eventsData : [];

      const knownData = allEvents.filter(isKnownEvent);

      // Dedupe unknown sightings by track_id
      const latestByTrack = new Map();
      for (const e of allEvents.filter(isUnknownEvent)) {
        const key = e.track_id ?? e.id;
        const existing = latestByTrack.get(key);
        if (!existing || new Date(e.event_time) >= new Date(existing.event_time)) {
          latestByTrack.set(key, e);
        }
      }
      const unknownData = Array.from(latestByTrack.values()).sort(
        (a, b) => new Date(b.event_time) - new Date(a.event_time)
      );

      console.log(`👤 Known events: ${knownData.length}`);
      console.log(`❓ Unknown sightings (deduped by track_id): ${unknownData.length}`);

      setSummary({
        ...(summaryData || {}),
        total_events: allEvents.length,
        known_events: knownData.length,
        unknown_events: unknownData.length,
        unacknowledged_unknown: unknownData.filter((e) => !e.acknowledged).length,
      });
      setKnownEvents(knownData);
      setUnknownEvents(unknownData);
      setCameras(cameraData || []);
      setEmployees(employeeData || []);
      setError("");
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      if (activeRef.current) {
        setError("Could not connect to the backend.");
      }
    } finally {
      if (activeRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    loadDashboard();
    const pollId = setInterval(loadDashboard, POLL_INTERVAL_MS);
    return () => {
      activeRef.current = false;
      clearInterval(pollId);
    };
  }, [loadDashboard]);

  const openCameraModal = useCallback((camera) => {
    setSelectedCamera(camera);
  }, []);

  const closeCameraModal = useCallback(() => {
    setSelectedCamera(null);
  }, []);

  const openImageModal = useCallback((image) => {
    setSelectedImage(image);
  }, []);

  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const knownByDay = useMemo(() => groupByDay(knownEvents), [knownEvents]);
  const unknownByDay = useMemo(() => groupByDay(unknownEvents), [unknownEvents]);

  return (
    <div className="dashboard-container">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="brand-icon">🍽️</span>
          <span className="brand-text">Canteen Watch</span>
        </div>
        <div className="nav-links">
          <a href="#summary">Summary</a>
          <a href="#analytics">Analytics</a>
          <a href="#employees">Employees</a>
          <a href="#cameras">Cameras</a>
          <a href="#unknown">Alerts</a>
        </div>
        <div className="nav-status">
          <span className="status-dot live"></span>
          <span>Live</span>
        </div>
      </nav>

      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="subtitle">Real-time monitoring and analytics for your canteen</p>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-label">Today</span>
            <span className="stat-value">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Camera Feed Section */}
          <section className="camera-feed-section">
            <div className="section-header">
              <h2><MdVideocam /> Live Camera Feed</h2>
              <span className="badge live">🔴 LIVE</span>
            </div>
            <div className="camera-feed-container">
              <CameraFeed />
            </div>
          </section>

          {/* Summary Cards */}
          <section className="summary-section" id="summary">
            <div className="summary-grid">
              <div className="summary-card primary">
                <div className="card-icon"><MdPeople /></div>
                <div className="card-content">
                  <span className="card-label">Total Events</span>
                  <strong className="card-value">{summary?.total_events ?? 0}</strong>
                  <TrendTag trend={trends.total} goodDirection="up" />
                </div>
              </div>
              <div className="summary-card success">
                <div className="card-icon"><MdCheckCircle /></div>
                <div className="card-content">
                  <span className="card-label">Known Users</span>
                  <strong className="card-value">{summary?.known_events ?? 0}</strong>
                  <TrendTag trend={trends.known} goodDirection="up" />
                </div>
              </div>
              <div className="summary-card warning">
                <div className="card-icon"><MdWarning /></div>
                <div className="card-content">
                  <span className="card-label">Unknown Visitors</span>
                  <strong className="card-value">{summary?.unknown_events ?? 0}</strong>
                  <TrendTag trend={trends.unknown} goodDirection="down" />
                </div>
              </div>
              <div className="summary-card danger emphasis">
                <div className="card-icon"><MdAccessTime /></div>
                <div className="card-content">
                  <span className="card-label">Unacknowledged</span>
                  <strong className="card-value">{summary?.unacknowledged_unknown ?? 0}</strong>
                  <span className="card-note">
                    {(summary?.unacknowledged_unknown ?? 0) > 0 ? "⚠️ Needs review" : "✅ All clear"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Analytics Section */}
          <section className="analytics-section" id="analytics">
            <div className="section-header">
              <h2><MdTimeline /> Analytics</h2>
              <div className="time-filter">
                <button className={`filter-btn ${timeRange === 'day' ? 'active' : ''}`} onClick={() => setTimeRange('day')}>Day</button>
                <button className={`filter-btn ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>Week</button>
                <button className={`filter-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>Month</button>
              </div>
            </div>

            <div className="analytics-grid">
              {/* Trend Chart */}
              <div className="chart-card large">
                <h3>Daily Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="label" stroke="#7d89a8" tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                    <YAxis stroke="#7d89a8" tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ background: '#0d1220', border: `1px solid ${COLORS.primary}55`, borderRadius: 8, fontFamily: 'var(--font-mono)' }}
                      labelStyle={{ color: '#e8ecf6' }}
                      cursor={{ fill: 'rgba(232,163,61,0.06)' }}
                    />
                    <Legend />
                    <Bar dataKey="known" fill={COLORS.known} name="Known" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unknown" fill={COLORS.unknown} name="Unknown" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="total" stroke={COLORS.primary} name="Total" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Meal Distribution */}
              <div className="chart-card">
                <h3>Meal Distribution</h3>
                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={mealData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {mealData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#0d1220', border: `1px solid ${COLORS.primary}55`, borderRadius: 8, fontFamily: 'var(--font-mono)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <strong>{mealTotal}</strong>
                    <span>total</span>
                  </div>
                </div>
              </div>

              {/* Hourly Distribution */}
              <div className="chart-card">
                <h3>Hourly Activity</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={hourlyData.filter(h => h.count > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="label" stroke="#7d89a8" tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                    <YAxis stroke="#7d89a8" tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ background: '#0d1220', border: `1px solid ${COLORS.primary}55`, borderRadius: 8, fontFamily: 'var(--font-mono)' }}
                    />
                    <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Employees Section */}
          <section className="employees-section" id="employees">
            <div className="section-header">
              <h2><MdPeople /> Employees Today</h2>
              <span className="badge count">{todaysEmployees.length} active</span>
            </div>

            {todaysEmployees.length === 0 ? (
              <div className="empty-state">
                <p>No employees detected yet today.</p>
              </div>
            ) : (
              <div className="employees-grid">
                {todaysEmployees.map((event, i) => {
                  const isLive = minutesSince(event.event_time) < 5;
                  return (
                    <div
                      key={event.employee_code || event.employee_name || event.id}
                      className="employee-card"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    >
                      <div className={`employee-avatar ${isLive ? 'live' : ''}`}>
                        {initialsOf(event.employee_name)}
                        {isLive && <span className="pulse-ring" aria-hidden="true" />}
                      </div>
                      <div className="employee-info">
                        <strong>{event.employee_name || "Employee"}</strong>
                        <span className="employee-code">{event.employee_code || "—"}</span>
                        <span className="employee-location">{event.camera_name || "—"}</span>
                      </div>
                      <div className="employee-time">
                        <span className={`status-badge ${isLive ? 'live' : 'idle'}`}>
                          {isLive ? '● Live' : formatTime(event.event_time)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Cameras Section */}
          <section className="cameras-section" id="cameras">
            <div className="section-header">
              <h2><MdCamera /> Cameras</h2>
              <span className="badge count">{cameras.length} online</span>
            </div>

            {cameras.length === 0 ? (
              <div className="empty-state">
                <p>No cameras configured.</p>
              </div>
            ) : (
              <div className="cameras-grid">
                {cameraStats.map((camera) => (
                  <div key={camera.id || camera.name} className={`camera-card ${camera.isActive ? 'active' : 'inactive'}`}>
                    <div className="camera-preview">
                      <div className="camera-overlay">
                        <Sparkline values={camera.dailyCounts} color={camera.isActive ? COLORS.known : COLORS.neutral} />
                        <span className={`camera-status ${camera.isActive ? 'live' : 'idle'}`}>
                          {camera.isActive ? '● LIVE' : '○ IDLE'}
                        </span>
                      </div>
                    </div>
                    <div className="camera-details">
                      <h4>{camera.name}</h4>
                      <div className="camera-stats">
                        <span>Events: {camera.eventCount}</span>
                        <span>Last: {camera.lastEvent ? formatTime(camera.lastEvent.event_time) : 'Never'}</span>
                      </div>
                      {/* <button onClick={() => openCameraModal(camera)} className="view-btn">
                        View Stream
                      </button> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Events Columns */}
          <div className="events-columns">
            <section className="events-panel known" id="known-events">
              <div className="panel-header">
                <h2>Known Users</h2>
                <span className="badge success">{knownEvents.length}</span>
              </div>

              {knownByDay.length === 0 ? (
                <div className="empty-state">
                  <p>No known users found.</p>
                </div>
              ) : (
                knownByDay.slice(0, 3).map((group) => (
                  <div key={group.key} className="day-group">
                    <div className="day-label">{group.label}</div>
                    <div className="event-list">
                      {group.events.slice(0, 5).map((event) => (
                        <div key={event.id} className="event-item known">
                          <div className="event-item-header">
                            <strong>{event.employee_name || "Employee"}</strong>
                            <span className="badge success">Known</span>
                          </div>
                          <div className="event-item-meta">
                            <span>ID: {event.employee_code || "—"}</span>
                            <span>{formatTime(event.event_time)}</span>
                          </div>
                          <div className="event-item-meta">
                            <span>{event.camera_name || "—"}</span>
                            <span>{event.activity_status || "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="events-panel unknown" id="unknown">
              <div className="panel-header">
                <h2>Unknown Visitors</h2>
                <span className="badge danger">{unknownEvents.length}</span>
              </div>

              {unknownByDay.length === 0 ? (
                <div className="empty-state">
                  <p>No unknown visitors found.</p>
                </div>
              ) : (
                unknownByDay.slice(0, 3).map((group) => (
                  <div key={group.key} className="day-group">
                    <div className="day-label">{group.label}</div>
                    <div className="event-list">
                      {group.events.slice(0, 5).map((event) => {
                        const imageUrl = getEventImage(event);
                        return (
                          <div key={event.id} className="event-item unknown">
                            <div className="event-item-header">
                              <strong>{event.employee_name || "Unknown"}</strong>
                              <span className="badge danger">Unknown</span>
                            </div>
                            <div className="event-item-meta">
                              <span>{event.camera_name || "—"}</span>
                              <span>{formatTime(event.event_time)}</span>
                            </div>
                            <div className="event-item-meta">
                              <span>Confidence: {formatConfidence(event.confidence)}</span>
                              <span className={event.acknowledged ? 'acknowledged' : 'unacknowledged'}>
                                {event.acknowledged ? '✓ Acknowledged' : '⚠️ Pending'}
                              </span>
                            </div>
                            {imageUrl && (
                              <div 
                                className="event-image-thumbnail" 
                                onClick={() => openImageModal(imageUrl)}
                              >
                                <img 
                                  src={imageUrl} 
                                  alt="Unknown visitor" 
                                  className="thumbnail-img"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const parent = e.target.parentElement;
                                    if (parent) {
                                      const fallback = document.createElement('div');
                                      fallback.style.cssText = 'padding: 20px; text-align: center; color: var(--text-muted);';
                                      fallback.innerHTML = `
                                        <svg style="display: inline-block; width: 24px; height: 24px;" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17 10.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5zm-7 4.5l-2.5-3.5L7 13.5 9.5 16l3-4 2.5 3.5 1.5-2-1.5 2z"/></svg>
                                        <p style="margin: 4px 0 0; font-size: 12px;">Image unavailable</p>
                                      `;
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                                <div className="image-overlay">
                                  <span>Click to expand</span>
                                  <span>🔍</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        </>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Unknown Visitor - Full View</h3>
              <button onClick={closeImageModal} className="modal-close">
                <MdClose size={24} />
              </button>
            </div>
            <div className="modal-body">
              <img 
                src={selectedImage} 
                alt="Unknown visitor full view" 
                className="modal-image-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {selectedCamera && (
        <div className="camera-modal-overlay" onClick={closeCameraModal}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCamera.name}</h3>
              <button onClick={closeCameraModal} className="modal-close">
                <MdClose size={24} />
              </button>
            </div>
            <div className="modal-body">
              {selectedCamera.stream_url ? (
                <img src={selectedCamera.stream_url} alt="Camera feed" className="camera-feed-img" />
              ) : (
                <div className="no-stream">No stream available</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ============================================================
           CSS Variables & Reset
           ============================================================ */
        :root {
          --bg-deep: #0a0d16;
          --bg-panel: #12182a;
          --bg-panel-alt: #1a2338;
          --bg-raised: #202b45;
          --border: #26314a;
          --border-soft: #1c2438;
          --text-primary: #e8ecf6;
          --text-muted: #8b95b3;
          --text-dim: #5c6785;
          --font-display: 'Space Grotesk', sans-serif;
          --font-body: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', ui-monospace, monospace;
        }

        .dashboard-container {
          min-height: 100vh;
          background: var(--bg-deep);
          color: var(--text-primary);
          padding: 20px;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }

        /* ============================================================
           Camera Feed Section
           ============================================================ */
        .camera-feed-section {
          margin-bottom: 32px;
        }

        .camera-feed-container {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          padding: 4px;
        }

        .badge.live {
          background: #ef4462;
          color: #fff;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ============================================================
           Scrollbar Styling
           ============================================================ */
        .dashboard-container::-webkit-scrollbar,
        .event-list::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .dashboard-container::-webkit-scrollbar-thumb,
        .event-list::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }

        .dashboard-container::-webkit-scrollbar-track,
        .event-list::-webkit-scrollbar-track {
          background: transparent;
        }

        /* ============================================================
           Navigation
           ============================================================ */
        .dashboard-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--bg-panel);
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid var(--border);
          backdrop-filter: blur(8px);
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
        }

        .brand-icon {
          font-size: 28px;
        }

        .brand-text {
          background: linear-gradient(135deg, #e8a33d, #3ddbd9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          gap: 24px;
        }

        .nav-links a {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s, transform 0.2s;
          padding: 4px 0;
          border-bottom: 2px solid transparent;
        }

        .nav-links a:hover {
          color: var(--text-primary);
          border-bottom-color: #e8a33d;
          transform: translateY(-1px);
        }

        .nav-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: #e8a33d;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-dot.live {
          background: #e8a33d;
          box-shadow: 0 0 0 0 #e8a33d66;
          animation: statusPulse 1.8s ease-out infinite;
        }

        @keyframes statusPulse {
          0% { box-shadow: 0 0 0 0 #e8a33d55; }
          70% { box-shadow: 0 0 0 8px #e8a33d00; }
          100% { box-shadow: 0 0 0 0 #e8a33d00; }
        }

        /* ============================================================
           Header
           ============================================================ */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding: 0 4px;
        }

        .dashboard-header h1 {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .subtitle {
          color: var(--text-muted);
          font-size: 15px;
          margin: 4px 0 0;
        }

        .header-stats {
          display: flex;
          gap: 24px;
        }

        .header-stat {
          text-align: right;
        }

        .stat-label {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .stat-value {
          font-family: var(--font-mono);
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
        }

        /* ============================================================
           Summary Cards
           ============================================================ */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .summary-card {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }

        .summary-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          opacity: 0.6;
        }

        .summary-card.primary::before { background: #e8a33d; }
        .summary-card.success::before { background: #3ddbd9; }
        .summary-card.warning::before { background: #ef4462; }
        .summary-card.danger::before { background: #ef4462; }

        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .summary-card.emphasis {
          border-color: #ef446255;
          background: linear-gradient(160deg, #ef446214, var(--bg-panel) 60%);
        }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .summary-card.primary .card-icon {
          background: #e8a33d22;
          color: #e8a33d;
        }

        .summary-card.success .card-icon {
          background: #3ddbd922;
          color: #3ddbd9;
        }

        .summary-card.warning .card-icon {
          background: #ef446218;
          color: #ef4462;
        }

        .summary-card.danger .card-icon {
          background: #ef446230;
          color: #ef4462;
        }

        .card-content {
          flex: 1;
          min-width: 0;
        }

        .card-label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .card-value {
          font-family: var(--font-mono);
          font-size: 28px;
          font-weight: 500;
          display: block;
          margin-bottom: 4px;
        }

        .card-trend {
          font-size: 12px;
          font-weight: 500;
          font-family: var(--font-mono);
        }

        .card-trend.good {
          color: #3ddbd9;
        }

        .card-trend.bad {
          color: #ef4462;
        }

        .card-trend.flat {
          color: var(--text-muted);
        }

        .card-note {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .summary-card.emphasis .card-note {
          color: #ef4462;
        }

        /* ============================================================
           Section Headers
           ============================================================ */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-size: 19px;
          margin: 0;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-mono);
        }

        .badge.count {
          background: var(--bg-panel-alt);
          color: var(--text-muted);
        }

        .badge.success {
          background: #3ddbd91f;
          color: #3ddbd9;
        }

        .badge.danger {
          background: #ef44621f;
          color: #ef4462;
        }

        /* ============================================================
           Time Filter
           ============================================================ */
        .time-filter {
          display: flex;
          gap: 4px;
          background: var(--bg-panel-alt);
          padding: 4px;
          border-radius: 8px;
        }

        .filter-btn {
          padding: 6px 16px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          font-family: var(--font-body);
        }

        .filter-btn.active {
          background: var(--bg-raised);
          color: var(--text-primary);
        }

        .filter-btn:hover:not(.active) {
          background: rgba(255,255,255,0.05);
        }

        .filter-btn:focus-visible {
          outline: 2px solid #e8a33d;
          outline-offset: 2px;
        }

        /* ============================================================
           Analytics Grid
           ============================================================ */
        .analytics-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }

        .chart-card {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
        }

        .chart-card.large {
          grid-row: span 2;
        }

        .chart-card h3 {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--text-muted);
        }

        .donut-wrap {
          position: relative;
        }

        .donut-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
        }

        .donut-center strong {
          display: block;
          font-family: var(--font-mono);
          font-size: 26px;
          line-height: 1;
        }

        .donut-center span {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ============================================================
           Employees Grid
           ============================================================ */
        .employees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .employee-card {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: cardIn 0.35s ease backwards;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .employee-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .employee-avatar {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8a33d, #3ddbd9);
          color: #0a0d16;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .employee-avatar.live {
          box-shadow: 0 0 0 2px #3ddbd9;
        }

        .pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #3ddbd9;
          animation: ringPulse 1.6s ease-out infinite;
        }

        @keyframes ringPulse {
          0% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(1.25); opacity: 0; }
        }

        .employee-info {
          flex: 1;
        }

        .employee-info strong {
          display: block;
          font-size: 14px;
          font-weight: 600;
        }

        .employee-code {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-muted);
        }

        .employee-location {
          font-size: 12px;
          color: var(--text-dim);
        }

        .employee-time {
          margin-top: 12px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-family: var(--font-mono);
          font-weight: 500;
        }

        .status-badge.live {
          background: #3ddbd922;
          color: #3ddbd9;
        }

        .status-badge.idle {
          background: var(--bg-panel-alt);
          color: var(--text-muted);
        }

        /* ============================================================
           Cameras Grid
           ============================================================ */
        .cameras-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .camera-card {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .camera-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        .camera-card.active {
          border-color: #3ddbd944;
        }

        .camera-card.inactive {
          opacity: 0.65;
        }

        .camera-preview {
          height: 120px;
          background: var(--bg-deep);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .camera-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 16px;
        }

        .sparkline {
          width: 100%;
          height: 32px;
        }

        .camera-status {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
        }

        .camera-status.live {
          background: #3ddbd922;
          color: #3ddbd9;
        }

        .camera-status.idle {
          background: rgba(255,255,255,0.05);
          color: var(--text-muted);
        }

        .camera-details {
          padding: 16px;
        }

        .camera-details h4 {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 15px;
        }

        .camera-stats {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .view-btn {
          width: 100%;
          padding: 8px;
          border: none;
          border-radius: 8px;
          background: #e8a33d;
          color: #1a1204;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: filter 0.2s, transform 0.2s;
        }

        .view-btn:hover {
          filter: brightness(1.08);
          transform: scale(1.01);
        }

        .view-btn:active {
          transform: scale(0.98);
        }

        /* ============================================================
           Events Columns
           ============================================================ */
        .events-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .events-panel {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .panel-header h2 {
          font-family: var(--font-display);
          font-size: 17px;
          margin: 0;
        }

        .day-group {
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-soft);
        }

        .day-group:last-child {
          border-bottom: none;
        }

        .day-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }

        .event-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .event-item {
          padding: 12px;
          border-radius: 8px;
          background: var(--bg-deep);
          border-left: 3px solid transparent;
          transition: background 0.2s;
        }

        .event-item:hover {
          background: var(--bg-panel-alt);
        }

        .event-item.known {
          border-left-color: #3ddbd9;
        }

        .event-item.unknown {
          border-left-color: #ef4462;
        }

        .event-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .event-item-header strong {
          font-size: 14px;
        }

        .event-item-meta {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .acknowledged {
          color: #3ddbd9;
        }

        .unacknowledged {
          color: #e8a33d;
        }

        /* ============================================================
           Event Image Thumbnail
           ============================================================ */
        .event-image-thumbnail {
          position: relative;
          margin-top: 8px;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          background: rgba(0,0,0,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          max-width: 100%;
        }

        .event-image-thumbnail:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        .thumbnail-img {
          width: 100%;
          max-height: 180px;
          object-fit: cover;
          display: block;
        }

        .image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 6px 12px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          color: #fff;
          font-size: 11px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .event-image-thumbnail:hover .image-overlay {
          opacity: 1;
        }

        /* ============================================================
           Image Modal
           ============================================================ */
        .image-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .image-modal {
          background: var(--bg-panel);
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          animation: scaleIn 0.25s ease;
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-image-full {
          width: 100%;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 8px;
          display: block;
        }

        /* ============================================================
           Camera Modal
           ============================================================ */
        .camera-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1500;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }

        .camera-modal {
          background: var(--bg-panel);
          border-radius: 16px;
          max-width: 960px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          animation: scaleIn 0.25s ease;
        }

        .camera-feed-img {
          width: 100%;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 8px;
        }

        /* ============================================================
           Modal Shared Styles
           ============================================================ */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 18px;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: rgba(255,255,255,0.1);
        }

        .modal-body {
          padding: 20px;
        }

        .no-stream {
          padding: 60px;
          text-align: center;
          color: var(--text-muted);
        }

        /* ============================================================
           Empty State
           ============================================================ */
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-state p {
          margin: 0;
        }

        /* ============================================================
           Loading State
           ============================================================ */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          gap: 16px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top: 3px solid #e8a33d;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-state p {
          color: var(--text-muted);
          font-size: 14px;
        }

        /* ============================================================
           Error Banner
           ============================================================ */
        .error-banner {
          background: #ef446215;
          border: 1px solid #ef4462;
          color: #ef4462;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        /* ============================================================
           Responsive Design
           ============================================================ */
        @media (max-width: 1200px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
          .chart-card.large {
            grid-row: span 1;
          }
        }

        @media (max-width: 1024px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .events-columns {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-nav {
            flex-direction: column;
            gap: 12px;
            padding: 12px 16px;
          }

          .nav-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }

          .nav-links a {
            font-size: 13px;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .dashboard-header h1 {
            font-size: 24px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .employees-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .cameras-grid {
            grid-template-columns: 1fr;
          }

          .header-stats {
            width: 100%;
            justify-content: space-between;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .time-filter {
            width: 100%;
          }

          .filter-btn {
            flex: 1;
            text-align: center;
          }

          .image-modal {
            margin: 12px;
          }

          .camera-modal {
            margin: 12px;
          }

          .modal-body {
            padding: 12px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 12px;
          }

          .summary-card {
            padding: 16px;
          }

          .card-value {
            font-size: 22px;
          }

          .card-icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .employee-card {
            padding: 12px;
          }

          .employee-avatar {
            width: 48px;
            height: 48px;
            font-size: 16px;
          }

          .event-item {
            padding: 10px;
          }

          .event-item-header strong {
            font-size: 13px;
          }

          .event-item-meta {
            font-size: 11px;
            flex-wrap: wrap;
            gap: 4px;
          }

          .thumbnail-img {
            max-height: 120px;
          }
        }

        /* ============================================================
           Reduced Motion
           ============================================================ */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </div>
  );
}

function TrendTag({ trend, goodDirection }) {
  if (!trend || trend.dir === "flat") {
    return <span className="card-trend flat">No change vs. yesterday</span>;
  }
  const isGood = trend.dir === goodDirection;
  const arrow = trend.dir === "up" ? "↑" : "↓";
  return (
    <span className={`card-trend ${isGood ? "good" : "bad"}`}>
      {arrow} {trend.pct}% vs. yesterday
    </span>
  );
}