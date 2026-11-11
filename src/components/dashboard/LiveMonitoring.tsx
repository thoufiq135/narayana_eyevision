import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Cpu, Eye, Users, AlertTriangle, CheckCircle, Clock, Camera } from 'lucide-react';
import { useAppStore } from '../../store';
import { useDetection } from '../../api/hooks';
import { useWebRTCStream } from '../../hooks/useWebRTCStream';
import { useDetectionSocket, type DetectionBox } from '../../hooks/useDetectionSocket';
import { resolveCameraPath } from '../../utils/cameraPaths';
import Badge from '../ui/Badge';
import { SkeletonCard } from '../ui/Skeleton';
import { fetchKnownData, fetchUnknownData } from '../../api/dashboardApi';

interface CameraFeedProps {
  cameraId: string;
  cameraPath: string;
  boxes: DetectionBox[];
  personCount: number;
  onFpsChange: (fps: number) => void;
}

export function CameraFeed({ cameraId, cameraPath, boxes, personCount, onFpsChange }: CameraFeedProps) {
  const { videoRef, status } = useWebRTCStream(cameraPath);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || status !== 'live' || !('requestVideoFrameCallback' in video)) return;

    let count = 0;
    let lastSecond = performance.now();
    let rafId: number;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      count++;
      const now = performance.now();
      if (now - lastSecond >= 1000) {
        onFpsChange(count);
        count = 0;
        lastSecond = now;
      }
      rafId = video.requestVideoFrameCallback(tick);
    };

    rafId = video.requestVideoFrameCallback(tick);

    return () => {
      cancelled = true;
      if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(rafId);
      onFpsChange(0);
    };
  }, [status, videoRef, onFpsChange]);

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {status !== 'live' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/85 text-white text-xs">
          {status === 'connecting' && (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Connecting to camera…</span>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertTriangle size={16} className="text-red-400" />
              <span>Camera offline — retrying…</span>
            </>
          )}
          {status === 'idle' && <span>No camera selected</span>}
        </div>
      )}

      {status === 'live' &&
        boxes.map((b) => (
          <div
            key={b.id}
            className={`absolute rounded border-2 ${b.known ? 'border-green-400' : 'border-red-500'}`}
            style={{ top: `${b.y}%`, left: `${b.x}%`, width: `${b.w}%`, height: `${b.h}%` }}
          >
            <div
              className={`absolute -top-5 left-0 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap ${
                b.known ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {b.known ? `${b.label} ${b.confidence}%` : '⚠ Unknown'}
            </div>
          </div>
        ))}

      <div className="camera-overlay absolute inset-0" />

      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${status === 'live' ? 'bg-red-500 live-dot' : 'bg-gray-500'}`}
        />
        <span className="text-white text-[10px] font-bold">
          {status === 'live' ? 'LIVE' : status.toUpperCase()}
        </span>
        <span className="text-white/70 text-[10px]">{cameraId}</span>
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded">1080p</span>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
          <Users size={10} /> {personCount} detected
        </span>
        <span className="bg-blue-500/80 text-white text-[10px] px-2 py-0.5 rounded">AI Active</span>
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  });
}

// Helper function to derive meal type
function deriveMealType(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const hour = d.getUTCHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return '';
}

export default function LiveMonitoring() {
  const { selectedHall, selectedDate } = useAppStore();
  const [detectedPersons, setDetectedPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fps, setFps] = useState(0);

  const onlineCam = selectedHall?.cameras.find((c) => c.status === 'online');
  const cameraPath = resolveCameraPath(onlineCam);

  // Single detection socket per camera
  const { boxes, personCount } = useDetectionSocket(onlineCam?.id);
  const queueLen = boxes.length;
  const avgConf =
    boxes.length > 0
      ? (boxes.reduce((sum, b) => sum + b.confidence, 0) / boxes.length).toFixed(1)
      : '—';

  // Fetch real data from API
  useEffect(() => {
    if (!selectedHall?.id || !selectedDate) {
      setDetectedPersons([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const [knownRaw, unknownRaw] = await Promise.all([
          fetchKnownData(selectedDate, selectedHall.id),
          fetchUnknownData(selectedDate, selectedHall.id),
        ]);

        if (cancelled) return;

        // Normalize known data
        const known = (Array.isArray(knownRaw) ? knownRaw : knownRaw?.data || []).map((item: any) => {
          const capturedAt = item.captured_at ?? item.capturedAt ?? item.time;
          const mealType = item.meal_type || item.mealType || deriveMealType(capturedAt);
          
          return {
            id: String(item.id || item._id || `known-${Math.random()}`),
            name: item.full_name || item.name || 'Unknown',
            studentId: item.employee_id || item.studentId || '',
            department: item.department_name || item.department || '',
            year: item.year || '',
            time: formatTime(capturedAt),
            confidence: Math.round((item.confidence || item.match_confidence || 0) * 100) / 100,
            cameraId: item.camera_id || item.cameraId || '',
            cameraName: item.camera_name || item.cameraName || '',
            mealStatus: item.meal_status || item.mealStatus || 'pending',
            type: 'registered',
            mealType: mealType,
            captured_at: capturedAt,
          };
        });

        // Normalize unknown data
        const unknown = (Array.isArray(unknownRaw) ? unknownRaw : unknownRaw?.data || []).map((item: any) => {
          const capturedAt = item.captured_at ?? item.capturedAt ?? item.time;
          const mealType = item.meal_type || item.mealType || deriveMealType(capturedAt);
          
          return {
            id: String(item.id || item._id || `unknown-${Math.random()}`),
            name: 'Unknown Person',
            studentId: '',
            department: '',
            year: '',
            time: formatTime(capturedAt),
            confidence: Math.round((item.confidence || 0) * 100) / 100,
            cameraId: item.camera_id || item.cameraId || '',
            cameraName: item.camera_name || item.cameraName || '',
            alertStatus: item.alert_status || item.alertStatus || 'pending',
            type: 'unknown',
            mealType: mealType,
            captured_at: capturedAt,
          };
        });

        // Combine and sort by time (newest first)
        const combined = [...known, ...unknown].sort((a, b) => {
          const timeA = new Date(a.captured_at || 0).getTime();
          const timeB = new Date(b.captured_at || 0).getTime();
          return timeB - timeA;
        });

        setDetectedPersons(combined);
      } catch (error) {
        console.error('Error loading detection data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [selectedHall?.id, selectedDate]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-brand-textPrimary">Live AI Monitoring</h2>
        <Badge label="Real-time" variant="success" dot />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Camera feed */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-brand-border shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera size={15} className="text-brand-primary" />
              <span className="text-sm font-semibold text-brand-textPrimary">
                {onlineCam?.name ?? 'Entry Gate Cam'} – Live Feed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-brand-textSecondary bg-brand-light px-2.5 py-1 rounded-lg">
                <Cpu size={12} className="text-brand-primary" />
                <span>
                  AI Conf: <strong className="text-brand-primary">{avgConf}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-textSecondary bg-brand-light px-2.5 py-1 rounded-lg">
                <Users size={12} className="text-brand-primary" />
                <span>
                  Queue: <strong className="text-brand-primary">{queueLen}</strong>
                </span>
              </div>
            </div>
          </div>

          {cameraPath ? (
            <CameraFeed
              cameraId={onlineCam?.id ?? 'cam-01'}
              cameraPath={cameraPath}
              boxes={boxes}
              personCount={personCount}
              onFpsChange={setFps}
            />
          ) : (
            <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center text-white/60 text-xs">
              No online camera for this hall
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              {
                label: 'FPS',
                value: fps > 0 ? String(fps) : '—',
                icon: <Activity size={13} className="text-green-600" />,
              },
              { label: 'Camera', value: onlineCam ? 'Healthy' : 'Offline', icon: <Eye size={13} className="text-blue-600" /> },
              { label: 'AI Model', value: 'v2.4.1', icon: <Cpu size={13} className="text-purple-600" /> },
              { label: 'Uptime', value: '99.8%', icon: <CheckCircle size={13} className="text-green-600" /> },
            ].map((s) => (
              <div key={s.label} className="bg-brand-light rounded-xl p-2.5 text-center border border-brand-border">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-xs font-bold text-brand-textPrimary">{s.value}</p>
                <p className="text-[10px] text-brand-textSecondary">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detection feed */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-brand-textPrimary">Detection Feed</span>
            <span className="text-xs text-brand-textSecondary">{detectedPersons.length} detected</span>
          </div>
          
          {loading ? (
            <SkeletonCard lines={5} />
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[380px] pr-1">
              <AnimatePresence>
                {detectedPersons.length === 0 ? (
                  <div className="text-center py-8 text-brand-textSecondary text-sm">
                    No detections yet
                  </div>
                ) : (
                  detectedPersons.map((p, i) => (
                    <motion.div
                      key={p.id || i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.5) }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                        p.type === 'unknown' ? 'bg-red-50 border-red-200' : 'bg-brand-light border-brand-border'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                          p.type === 'unknown' ? 'bg-red-200 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {p.type === 'unknown' ? '?' : p.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {p.type === 'registered' ? (
                          <>
                            <p className="text-xs font-semibold text-brand-textPrimary truncate">{p.name}</p>
                            <div className="flex items-center gap-1 flex-wrap">
                              <p className="text-[10px] text-brand-textSecondary">
                                {p.studentId || 'No ID'}
                              </p>
                              {p.confidence > 0 && (
                                <span className={`text-[10px] font-semibold ${
                                  p.confidence >= 95 ? 'text-green-600' : 
                                  p.confidence >= 85 ? 'text-blue-600' : 
                                  'text-amber-600'
                                }`}>
                                  · {p.confidence}%
                                </span>
                              )}
                            </div>
                            {p.mealType && (
                              <p className="text-[9px] text-brand-textSecondary capitalize">
                                {p.mealType}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                              <AlertTriangle size={11} /> Unknown Person
                            </p>
                            <p className="text-[10px] text-red-500">
                              {p.cameraId ? `Camera: ${p.cameraId}` : 'Alert sent'}
                            </p>
                          </>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        {p.time && (
                          <p className="text-[10px] text-brand-textSecondary flex items-center gap-0.5">
                            <Clock size={9} />
                            {p.time}
                          </p>
                        )}
                        {p.type === 'registered' && (
                          <span
                            className={`text-[9px] font-semibold ${
                              p.mealStatus === 'eaten' ? 'text-green-600' : 'text-amber-600'
                            }`}
                          >
                            {p.mealStatus === 'eaten' ? '✓ Eaten' : '⏳ Pending'}
                          </span>
                        )}
                        {p.type === 'unknown' && p.alertStatus && (
                          <span
                            className={`text-[9px] font-semibold ${
                              p.alertStatus === 'accepted' ? 'text-green-600' :
                              p.alertStatus === 'rejected' ? 'text-gray-400' :
                              'text-red-600'
                            }`}
                          >
                            {p.alertStatus === 'accepted' ? '✓ Accepted' :
                             p.alertStatus === 'rejected' ? '✕ Rejected' :
                             '⏳ Pending'}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}