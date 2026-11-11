import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, WifiOff, Cpu, FileText, CheckCircle, Bell, Check } from 'lucide-react';
import { useAppStore } from '../../store';
import { useNotifications, markNotificationReadApi } from '../../api/hooks';
import { Notification } from '../../types';
import { SkeletonCard } from '../ui/Skeleton';

const typeConfig = {
  unknown_person:      { icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   label: 'Unknown Person' },
  camera_offline:      { icon: WifiOff,       color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Camera Offline' },
  ai_offline:          { icon: Cpu,           color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   label: 'AI Offline' },
  report_generated:    { icon: FileText,      color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  label: 'Report Ready' },
  attendance_complete: { icon: CheckCircle,   color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Attendance Done' },
};

function NotifCard({ n, onRead }: { n: Notification; onRead: () => void }) {
  const cfg = typeConfig[n.type];
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.border} ${!n.read ? cfg.bg : 'bg-white'} transition-colors`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
        <Icon size={16} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary flex-shrink-0" />}
        </div>
        <p className="text-sm text-brand-textPrimary leading-snug">{n.message}</p>
        <p className="text-xs text-brand-textSecondary mt-1">{n.time}</p>
      </div>
      {!n.read && (
        <button onClick={onRead} className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-brand-textSecondary hover:text-brand-primary">
          <Check size={14} />
        </button>
      )}
    </motion.div>
  );
}

export default function Alerts() {
  const { selectedHall, markNotificationRead } = useAppStore();
  const { data: notifications, loading } = useNotifications(selectedHall?.id ?? '');
  const list = notifications ?? [];

  const unread = list.filter((n) => !n.read);
  const read   = list.filter((n) => n.read);

  function handleRead(id: string) {
    markNotificationRead(id);
    markNotificationReadApi(id);
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-brand-textPrimary">Alerts & Notifications</h2>
          {unread.length > 0 && (
            <span className="text-xs bg-brand-danger text-white px-2 py-0.5 rounded-full font-bold">{unread.length}</span>
          )}
        </div>
        <button
          onClick={() => unread.forEach((n) => handleRead(n.id))}
          className="text-xs text-brand-primary font-medium hover:underline"
        >
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard lines={4} /><SkeletonCard lines={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={14} className="text-brand-danger" />
              <span className="text-sm font-semibold text-brand-textPrimary">Active Alerts</span>
              <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">{unread.length}</span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {unread.length > 0 ? unread.map((n) => (
                  <NotifCard key={n.id} n={n} onRead={() => handleRead(n.id)} />
                )) : (
                  <div className="text-center py-8 text-brand-textSecondary text-sm">
                    <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                    No active alerts
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-sm font-semibold text-brand-textPrimary">Resolved</span>
              <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">{read.length}</span>
            </div>
            <div className="space-y-2">
              {read.map((n) => <NotifCard key={n.id} n={n} onRead={() => {}} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
