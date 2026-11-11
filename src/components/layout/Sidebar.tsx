import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Video, BarChart3, FileText, Bell, Camera,
  ChevronRight, Building2, MapPin, Utensils
} from 'lucide-react';
import { useAppStore } from '../../store';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live', label: 'Live Monitoring', icon: Video },
  { id: 'meals', label: 'Meal Sessions', icon: Utensils },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

export default function Sidebar() {
  const { sidebarOpen, activeSection, setActiveSection, selectedState, selectedBranch, selectedHall, notifications } = useAppStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Mobile overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => useAppStore.getState().setSidebarOpen(false)}
          />
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-brand-border z-40 flex flex-col overflow-hidden lg:sticky lg:top-16 lg:h-[calc(100vh-64px)]"
          >
            {/* Context info */}
            {selectedHall && (
              <div className="mx-3 mt-3 p-3 bg-brand-light rounded-xl border border-brand-border">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 size={13} className="text-brand-primary flex-shrink-0" />
                  <span className="text-xs font-semibold text-brand-primary truncate">{selectedHall.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-brand-textSecondary">
                  <MapPin size={10} />
                  <span className="truncate">{selectedBranch?.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-brand-textSecondary mt-0.5">
                  <span className="font-medium">{selectedState?.name}</span>
                  <span>·</span>
                  <span>{selectedHall.number}</span>
                </div>
              </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
              <p className="text-[10px] font-semibold text-brand-textSecondary uppercase tracking-wider px-3 mb-2">Navigation</p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all group ${
                      active
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-brand-textSecondary hover:bg-brand-light hover:text-brand-textPrimary'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-white' : 'text-brand-textSecondary group-hover:text-brand-primary'} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === 'alerts' && unread > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-brand-danger text-white'}`}>
                        {unread}
                      </span>
                    )}
                    {active && <ChevronRight size={14} className="text-white/70" />}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-brand-border">
              <div className="flex items-center gap-2 p-2.5 bg-brand-light rounded-xl">
                <div className="w-2 h-2 rounded-full bg-brand-success live-dot flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-textPrimary">AI System Online</p>
                  <p className="text-[10px] text-brand-textSecondary truncate">Stackenzo Eye Vision v1.0</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
