import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Utensils, Video, BarChart3, FileText, 
  Camera, Bell, Home, ArrowLeft, Menu, X, ChevronRight,
  Activity, Users, Calendar, Settings, LogOut, RefreshCw
} from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KPICards from '../components/dashboard/KPICards';
import MealCards from '../components/dashboard/MealCards';
import LiveMonitoring from '../components/dashboard/LiveMonitoring';
import Analytics from '../components/dashboard/Analytics';
import Reports from '../components/dashboard/Reports';
import CameraManagement from '../components/dashboard/CameraManagement';
import Alerts from '../components/dashboard/Alerts';
import DateRangePicker from '../components/ui/DateRangePicker';
import { useAppStore } from '../store';
import { today } from '../api/hooks';
import { Calendar as CalendarIcon } from 'lucide-react';

const SINGLE_DATE_SECTIONS = ['overview', 'live', 'meals'];
const NO_DATE_SECTIONS = ['cameras', 'alerts'];

const GLASS_PANEL =
  'relative z-50 overflow-visible rounded-[28px] border border-white/60 bg-white/50 backdrop-blur-2xl ' +
  'shadow-[0_8px_32px_rgba(33,150,243,0.10)] before:pointer-events-none ' +
  'before:absolute before:inset-0 before:rounded-[28px] before:bg-gradient-to-b before:from-white/40 before:to-transparent';

// ── Sidebar Navigation Items ──────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live', label: 'Live Monitoring', icon: Video },
  { id: 'meals', label: 'Meals', icon: Utensils },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

// Create a refresh context to trigger component refreshes
interface RefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
  setIsRefreshing: (value: boolean) => void;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshKey: 0,
  triggerRefresh: () => {},
  isRefreshing: false,
  setIsRefreshing: () => {},
});

export const useRefresh = () => useContext(RefreshContext);

// Custom hook for components to listen to refresh
export const useRefreshEffect = (callback: () => void | Promise<void>) => {
  const { refreshKey } = useRefresh();
  
  useEffect(() => {
    callback();
  }, [refreshKey]);
};

function DateToolbar() {
  const { activeSection, selectedDate, setSelectedDate, dateRange, setDateRange } = useAppStore();
  const { triggerRefresh, isRefreshing, setIsRefreshing } = useRefresh();

  // Don't show date toolbar for sections that don't need dates
  if (NO_DATE_SECTIONS.includes(activeSection)) return null;

  const isSingle = SINGLE_DATE_SECTIONS.includes(activeSection);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger refresh for all components
    triggerRefresh();
    // Stop the spinning animation after data is fetched
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className={`${GLASS_PANEL} flex items-center justify-between px-3 sm:px-5 py-3.5 mb-4`}>
      <div className="relative z-10 flex items-center gap-2 text-sm text-brand-textSecondary min-w-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/10 flex-shrink-0">
          <CalendarIcon size={14} className="text-brand-primary" />
        </span>
        <span className="font-medium text-brand-textPrimary whitespace-nowrap">
          {isSingle ? 'Viewing data for:' : 'Date range:'}
        </span>
      </div>

      <div className="relative z-[60] flex items-center gap-3 overflow-visible">
        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-brand-textSecondary hover:bg-gray-50 hover:text-brand-primary transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh data"
        >
          <RefreshCw 
            size={16} 
            className={isRefreshing ? 'animate-spin' : ''} 
          />
        </motion.button>

        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          singleDate={isSingle}
          singleValue={selectedDate}
          onSingleChange={setSelectedDate}
          maxDate={today()}
        />
      </div>
    </div>
  );
}

// Wrapper component for sections that need refresh capability
function RefreshableSection({ children, sectionId }: { children: ReactNode; sectionId: string }) {
  const { refreshKey, isRefreshing } = useRefresh();

  return (
    <motion.div
      key={`${sectionId}-${refreshKey}`}
      initial={{ opacity: 0.9 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Loading overlay while refreshing */}
      {isRefreshing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-10 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="animate-spin text-brand-primary" />
            <span className="text-sm font-medium text-brand-textSecondary">Refreshing data...</span>
          </div>
        </div>
      )}
      {children}
    </motion.div>
  );
}

// Define section components with their associated content
const sectionMap: Record<string, ReactNode> = {
  overview: (
    <>
      <KPICards />
      <MealCards />
      <LiveMonitoring />
    </>
  ),
  live: <LiveMonitoring />,
  meals: <MealCards />,
  analytics: <Analytics />,
  reports: <Reports />,
  cameras: <CameraManagement />,
  alerts: <Alerts />,
};

export default function Dashboard() {
  const { 
    activeSection, 
    selectedState, 
    selectedBranch, 
    selectedHall,
    setActiveSection,
    clearLocation
  } = useAppStore();
  
  const navigate = useNavigate();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user has selected a hall, if not redirect to selection flow
  useEffect(() => {
    if (!selectedState || !selectedBranch || !selectedHall) {
      navigate('/select-state', { replace: true });
    }
  }, [selectedState, selectedBranch, selectedHall, navigate]);

  // Handle navigation from URL params
  useEffect(() => {
    const { stateId, branchId, hallId } = params;

    if (stateId) {
      console.log(`📍 Navigating to: State=${stateId}, Branch=${branchId}, Hall=${hallId}`);
    }
  }, [params]);

  // Navigation function
  const navigateToLocation = (type: 'state' | 'branch' | 'hall', id: string) => {
    const basePath = '/dashboard';
    let path = basePath;

    if (type === 'state') {
      path = `${basePath}/state/${id}`;
    } else if (type === 'branch') {
      const stateId = selectedState?.id || selectedState?.name || 'unknown';
      path = `${basePath}/state/${stateId}/branch/${id}`;
    } else if (type === 'hall') {
      const stateId = selectedState?.id || selectedState?.name || 'unknown';
      const branchId = selectedBranch?.id || selectedBranch?.location || 'unknown';
      path = `${basePath}/state/${stateId}/branch/${branchId}/hall/${id}`;
    }

    navigate(path);
  };

  // Go back to selection flow
  const goBackToSelection = () => {
    clearLocation();
    navigate('/select-state');
  };

  // Trigger refresh for all components
  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Get the current section content
  const currentSection = useMemo(() => {
    return sectionMap[activeSection] ?? sectionMap.overview;
  }, [activeSection]);

  // Handle section change
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(false);
    }
  };

  // If no selection, show nothing (will redirect)
  if (!selectedState || !selectedBranch || !selectedHall) {
    return null;
  }

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh, isRefreshing, setIsRefreshing }}>
      <div className="relative z-0 min-h-screen overflow-visible bg-brand-bg">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden fixed top-4 left-4 z-[100]">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 bg-white rounded-xl shadow-lg border border-gray-100"
          >
            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar */}
        <div className="flex">
          {/* Desktop Sidebar */}
          <motion.aside
            initial={{ width: 280 }}
            animate={{ width: sidebarOpen ? 280 : 72 }}
            className={`hidden md:flex md:flex-col fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
              sidebarOpen ? 'w-72' : 'w-[72px]'
            }`}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
              {sidebarOpen ? (
                <div className="flex items-center gap-2">
                  <img 
                    src="https://www.justmbbs.com/img/college/andhra-pradesh/narayana-medical-college-nellore-logo.jpg" 
                    alt="Logo" 
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="text-sm font-bold text-brand-textPrimary">NMCH Eye Vision</span>
                </div>
              ) : (
                <img 
                  src="https://www.justmbbs.com/img/college/andhra-pradesh/narayana-medical-college-nellore-logo.jpg" 
                  alt="Logo" 
                  className="w-8 h-8 rounded-lg object-cover mx-auto"
                />
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <ChevronRight size={18} className="rotate-180" /> : <ChevronRight size={18} />}
              </button>
            </div>

            {/* Location Info */}
            <div className={`p-4 border-b border-gray-100 ${!sidebarOpen && 'text-center'}`}>
              {sidebarOpen ? (
                <div className="space-y-1">
                  <p className="text-xs text-brand-textSecondary">Current Location</p>
                  <p className="text-sm font-semibold text-brand-textPrimary truncate">{selectedState?.name}</p>
                  <p className="text-xs text-brand-textSecondary truncate">{selectedBranch?.name}</p>
                  <p className="text-xs text-brand-primary font-medium truncate">{selectedHall?.name}</p>
                </div>
              ) : (
                <div className="w-8 h-8 mx-auto rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Home size={16} className="text-brand-primary" />
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary shadow-sm'
                        : 'text-brand-textSecondary hover:bg-gray-50 hover:text-brand-textPrimary'
                    } ${!sidebarOpen && 'justify-center'}`}
                  >
                    <Icon size={20} className={isActive ? 'text-brand-primary' : ''} />
                    {sidebarOpen && (
                      <span className={`text-sm font-medium ${isActive ? 'text-brand-primary' : ''}`}>
                        {item.label}
                      </span>
                    )}
                    {sidebarOpen && isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="ml-auto w-1.5 h-6 rounded-full bg-brand-primary"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className={`p-4 border-t border-gray-100 ${!sidebarOpen && 'text-center'}`}>
              <button
                onClick={goBackToSelection}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-textSecondary hover:text-brand-primary hover:bg-gray-50 rounded-xl transition-all ${
                  !sidebarOpen && 'justify-center'
                }`}
              >
                <ArrowLeft size={18} />
                {sidebarOpen && <span>Change Location</span>}
              </button>
            </div>
          </motion.aside>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                />
                <motion.aside
                  initial={{ x: -320 }}
                  animate={{ x: 0 }}
                  exit={{ x: -320 }}
                  className="fixed left-0 top-0 w-72 h-screen bg-white border-r border-gray-200 z-50 md:hidden"
                >
                  {/* Mobile Sidebar Content - Same as desktop but without toggle */}
                  <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://www.justmbbs.com/img/college/andhra-pradesh/narayana-medical-college-nellore-logo.jpg" 
                        alt="Logo" 
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <span className="text-sm font-bold text-brand-textPrimary">NMCH Eye Vision</span>
                    </div>
                    <button
                      onClick={() => setMobileSidebarOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-4 border-b border-gray-100">
                    <div className="space-y-1">
                      <p className="text-xs text-brand-textSecondary">Current Location</p>
                      <p className="text-sm font-semibold text-brand-textPrimary truncate">{selectedState?.name}</p>
                      <p className="text-xs text-brand-textSecondary truncate">{selectedBranch?.name}</p>
                      <p className="text-xs text-brand-primary font-medium truncate">{selectedHall?.name}</p>
                    </div>
                  </div>

                  <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSectionChange(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                            isActive
                              ? 'bg-brand-primary/10 text-brand-primary shadow-sm'
                              : 'text-brand-textSecondary hover:bg-gray-50 hover:text-brand-textPrimary'
                          }`}
                        >
                          <Icon size={20} className={isActive ? 'text-brand-primary' : ''} />
                          <span className={`text-sm font-medium ${isActive ? 'text-brand-primary' : ''}`}>
                            {item.label}
                          </span>
                          {isActive && (
                            <motion.div
                              layoutId="mobile-active-indicator"
                              className="ml-auto w-1.5 h-6 rounded-full bg-brand-primary"
                            />
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="p-4 border-t border-gray-100">
                    <button
                      onClick={goBackToSelection}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-textSecondary hover:text-brand-primary hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <ArrowLeft size={18} />
                      <span>Change Location</span>
                    </button>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'md:ml-[72px]'}`}>
            <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
              {/* Location Badge for Mobile */}
              <div className="md:hidden mb-4 flex items-center gap-2 text-xs text-brand-textSecondary bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-100">
                <span className="font-medium text-brand-textPrimary">{selectedState?.name}</span>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-brand-textPrimary">{selectedBranch?.name}</span>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-brand-primary">{selectedHall?.name}</span>
              </div>

              <DashboardHeader />
              
              {/* Date Toolbar - Only show for sections that need it */}
              <DateToolbar />

              <div className="relative z-0 overflow-visible">
                {/* Wrap the current section with refresh capability */}
                <RefreshableSection sectionId={activeSection}>
                  {currentSection}
                </RefreshableSection>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RefreshContext.Provider>
  );
}