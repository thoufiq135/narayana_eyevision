import { motion } from 'framer-motion';
import { Wifi, WifiOff, Brain, Hash, Building2, MapPin, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store';
import Badge from '../ui/Badge';
import { useState, useEffect } from 'react';

export default function DashboardHeader() {
  const { selectedHall, selectedBranch, selectedState } = useAppStore();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!selectedHall || !selectedBranch || !selectedState) return null;

  const onlineCams = selectedHall.cameras?.filter((c) => c.status === 'online').length ?? 0;
  const totalCams = selectedHall.cameras?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-40 mb-6 overflow-visible rounded-2xl border border-brand-border bg-white shadow-card"
    >
      <div className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center lg:p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-sm">
            <Building2 size={22} className="text-white" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-brand-textPrimary">{selectedHall.name}</h1>
              <Badge label={selectedHall.number} variant="primary" />
              <Badge label="Live" variant="success" dot />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-brand-textSecondary">
              <MapPin size={13} />
              <span>{selectedBranch.name}</span>
              <span>·</span>
              <span>{selectedBranch.location}</span>
              <span>·</span>
              <span>{selectedState.name}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatPill
            icon={<Hash size={13} />}
            label="Registered"
            value={selectedHall.registeredStudents?.toLocaleString() ?? '0'}
          />
          <StatPill
            icon={onlineCams === totalCams ? <Wifi size={13} className="text-green-600" /> : <WifiOff size={13} className="text-amber-600" />}
            label="Cameras"
            value={`${onlineCams}/${totalCams}`}
            valueColor={onlineCams === totalCams ? 'text-green-600' : 'text-amber-600'}
          />
          <StatPill
            icon={<Brain size={13} className={selectedHall.aiStatus === 'online' ? 'text-green-600' : 'text-red-600'} />}
            label="AI Status"
            value={selectedHall.aiStatus === 'online' ? 'Online' : 'Offline'}
            valueColor={selectedHall.aiStatus === 'online' ? 'text-green-600' : 'text-red-600'}
          />
          <div className="flex items-center gap-1.5 rounded-xl border border-brand-border bg-brand-light px-3 py-2 text-xs text-brand-textSecondary">
            <RefreshCw size={12} />
            <span>Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatPill({
  icon,
  label,
  value,
  valueColor = 'text-brand-textPrimary',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-light px-3 py-2">
      <span className="text-brand-textSecondary">{icon}</span>
      <div>
        <p className="text-[10px] leading-none text-brand-textSecondary">{label}</p>
        <p className={`mt-0.5 text-xs font-bold leading-none ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}
