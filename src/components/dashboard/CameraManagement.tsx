import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Video, Activity, X } from 'lucide-react';
import { useAppStore } from '../../store';
import { resolveCameraPath } from '../../utils/cameraPaths';
import { CameraFeed } from './LiveMonitoring';
import { useDetectionSocket } from '../../hooks/useDetectionSocket';
import Badge from '../ui/Badge';
import type { Camera } from '../../types';

// One card in the grid. If this camera has a real mediamtx path configured
// (see src/utils/cameraPaths.ts), it renders the actual live WebRTC feed.
// Otherwise it falls back to the styled placeholder, since there's no real
// stream to show yet for that camera.
function CameraCard({ cam, index, onOpen }: { cam: Camera; index: number; onOpen: () => void }) {
  const cameraPath = resolveCameraPath(cam);
  const { boxes, personCount } = useDetectionSocket(cameraPath ? cam.id : undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -2 }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`bg-white rounded-2xl border shadow-card p-4 card-hover cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
        cam.status === 'online' ? 'border-brand-border' : 'border-red-200'
      }`}
    >
      <div className="mb-3">
        {cam.status === 'online' && cameraPath ? (
          // Real live feed — this camera has an actual RTSP source wired
          // up in mediamtx.yml.
          <CameraFeed
            cameraId={cam.id}
            cameraPath={cameraPath}
            boxes={boxes}
            personCount={personCount}
            onFpsChange={() => {}}
          />
        ) : cam.status === 'online' ? (
          // Online per the hall roster, but no real RTSP feed wired up yet
          // for this camera — styled placeholder, not a broken video tag.
          <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Video size={24} className="text-white/30" />
            </div>
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 live-dot" />
              <span className="text-white text-[9px] font-bold">LIVE</span>
            </div>
            <div className="absolute bottom-2 right-2 text-white text-[9px] bg-black/50 px-1.5 py-0.5 rounded">
              {cam.fps} FPS
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-200">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <WifiOff size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Offline</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-brand-textPrimary">{cam.name}</p>
          <p className="text-xs text-brand-textSecondary">{cam.id}</p>
        </div>
        <Badge label={cam.status === 'online' ? 'Online' : 'Offline'} variant={cam.status === 'online' ? 'success' : 'danger'} dot />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-brand-light rounded-lg p-2 border border-brand-border">
          <p className="text-[10px] text-brand-textSecondary">Resolution</p>
          <p className="text-xs font-bold text-brand-textPrimary">{cam.resolution}</p>
        </div>
        <div className="bg-brand-light rounded-lg p-2 border border-brand-border">
          <p className="text-[10px] text-brand-textSecondary">Recording</p>
          <p className={`text-xs font-bold ${cam.recording ? 'text-green-600' : 'text-gray-400'}`}>
            {cam.recording ? '● Active' : '○ Stopped'}
          </p>
        </div>
      </div>

      {cam.status === 'online' && (
        <div className="mt-2 flex items-center gap-1.5">
          <Activity size={11} className="text-green-600" />
          <div className="flex-1 h-1 bg-brand-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-400 rounded-full"
              animate={{ width: ['60%', '85%', '70%', '90%', '65%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <span className="text-[10px] text-green-600 font-medium">Healthy</span>
        </div>
      )}
    </motion.div>
  );
}

// Fullscreen "live TV" style viewer. Opens over a dark backdrop, closes on
// backdrop click, the X button, or Escape.
function CameraModal({
  cam,
  cameraPath,
  boxes,
  personCount,
  onClose,
}: {
  cam: Camera;
  cameraPath: string | undefined;
  boxes: ReturnType<typeof useDetectionSocket>['boxes'];
  personCount: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-4xl bg-gray-950 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-sm font-semibold text-white">{cam.name}</p>
            <p className="text-xs text-white/50">{cam.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {cameraPath ? (
            <CameraFeed
              cameraId={cam.id}
              cameraPath={cameraPath}
              boxes={boxes}
              personCount={personCount}
              onFpsChange={() => {}}
            />
          ) : (
            <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-900 flex flex-col items-center justify-center gap-2">
              <Video size={32} className="text-white/20" />
              <span className="text-xs text-white/40">No real RTSP feed configured for this camera</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CameraManagement() {
  const { selectedHall } = useAppStore();
  // Cameras come straight from the hall record in the store — the same
  // source LiveMonitoring already uses. Previously this called useCameras()
  // from api/hooks.ts, which fetched a relative /api/cameras endpoint that
  // has no backend behind it and always failed silently.
  const list = selectedHall?.cameras ?? [];
  const [expandedCam, setExpandedCam] = useState<Camera | null>(null);

  const expandedPath = expandedCam ? resolveCameraPath(expandedCam) : undefined;
  const { boxes, personCount } = useDetectionSocket(expandedPath ? expandedCam!.id : undefined);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-brand-textPrimary">Camera Management</h2>
        <Badge label={`${list.filter((c) => c.status === 'online').length}/${list.length} Online`} variant="success" dot />
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border shadow-card p-6 text-center text-sm text-brand-textSecondary">
          No cameras configured for this hall.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {list.map((cam, i) => (
            <CameraCard key={cam.id} cam={cam} index={i} onOpen={() => setExpandedCam(cam)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {expandedCam && (
          <CameraModal
            cam={expandedCam}
            cameraPath={expandedPath}
            boxes={boxes}
            personCount={personCount}
            onClose={() => setExpandedCam(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}