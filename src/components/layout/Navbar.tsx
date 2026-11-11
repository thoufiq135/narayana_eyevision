import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Menu, X, ChevronDown, LogOut, Settings, User, 
  MapPin, Building2, Layers, ChevronRight, Home 
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    notifications,
    markNotificationRead,
    sidebarOpen,
    setSidebarOpen,
    selectedHall,
    selectedBranch,
    selectedState,
  } = useAppStore();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const unread = notifications.filter((n) => !n.read).length;

  // Refs for click-outside detection
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close notifications if clicking outside
      if (
        notifOpen &&
        notifRef.current &&
        !notifRef.current.contains(event.target as Node) &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }

      // Close profile if clicking outside
      if (
        profileOpen &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    // Close on escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [notifOpen, profileOpen]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const notifColors = { danger: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500' };

  // Toggle handlers with proper state management
  const toggleNotifications = () => {
    setNotifOpen(!notifOpen);
    if (profileOpen) setProfileOpen(false); // Close profile if open
  };

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
    if (notifOpen) setNotifOpen(false); // Close notifications if open
  };

  // ============================================================
  // Navigation Links with Location Context
  // ============================================================
  
  const getNavLinks = () => {
    if (selectedState && selectedBranch && selectedHall) {
      return [
        // { to: `/dashboard`, label: 'Dashboard' },
        // { to: `/analytics`, label: 'Analytics' },
        // { to: `/reports`, label: 'Reports' },
        // { to: `/settings`, label: 'Settings' },
      ];
    }
    return [
      { to: '/', label: 'Dashboard' },
      { to: '/analytics', label: 'Analytics' },
      { to: '/reports', label: 'Reports' },
      { to: '/settings', label: 'Settings' },
    ];
  };

  const navLinks = getNavLinks();

  // ============================================================
  // Breadcrumb Navigation Handlers
  // ============================================================
  
  const goToSelectState = () => {
    navigate('/select-state');
  };

  const goToState = () => {
    if (selectedState) {
      navigate(`/states/${selectedState.id}/select-branch`);
    } else {
      goToSelectState();
    }
  };

  const goToBranch = () => {
    if (selectedState && selectedBranch) {
      navigate(`/states/${selectedState.id}/branches/${selectedBranch.id}/select-hall`);
    } else if (selectedState) {
      navigate(`/states/${selectedState.id}/select-branch`);
    } else {
      goToSelectState();
    }
  };

  const goToHall = () => {
    if (selectedState && selectedBranch && selectedHall) {
      navigate(`/dashboard`);
    } else if (selectedState && selectedBranch) {
      navigate(`/states/${selectedState.id}/branches/${selectedBranch.id}/select-hall`);
    } else if (selectedState) {
      navigate(`/states/${selectedState.id}/select-branch`);
    } else {
      goToSelectState();
    }
  };

  // ============================================================
  // Breadcrumb Items
  // ============================================================
  
  const breadcrumbItems = [
    ...(selectedState
      ? [
          {
            label: selectedState.name,
            type: 'state' as const,
            icon: <MapPin size={12} />,
            onClick: goToState,
            isClickable: true,
          },
        ]
      : []),
    ...(selectedBranch
      ? [
          {
            label: selectedBranch.location || selectedBranch.name,
            type: 'branch' as const,
            icon: <Building2 size={12} />,
            onClick: goToBranch,
            isClickable: true,
          },
        ]
      : []),
    ...(selectedHall
      ? [
          {
            label: selectedHall.name,
            type: 'hall' as const,
            icon: <Layers size={12} />,
            onClick: goToHall,
            isClickable: true,
          },
        ]
      : []),
  ];

  // ============================================================
  // Check if current route is in selection flow
  // ============================================================
  
  const isSelectionRoute = location.pathname.includes('select-state') || 
                          location.pathname.includes('select-branch') || 
                          location.pathname.includes('select-hall');

  // ============================================================
  // Render
  // ============================================================
  
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-brand-light transition-colors text-brand-textSecondary"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <button
            type="button"
            onClick={goToSelectState}
            className="flex items-center gap-3 group"
          >
            <img 
              src="https://www.justmbbs.com/img/college/andhra-pradesh/narayana-medical-college-nellore-logo.jpg" 
              alt="Logo" 
              className="w-16 h-15 rounded-lg shadow-sm group-hover:shadow-md transition-shadow object-cover flex-shrink-0"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-brand-textPrimary leading-none">NMCH Eye Vision</p>
            </div>
          </button>

          {/* Breadcrumb Navigation */}
          {breadcrumbItems.length > 0 && !isSelectionRoute && (
            <div className="hidden md:flex items-center gap-1 ml-2 text-xs text-brand-textSecondary">
              <button
                onClick={goToSelectState}
                className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:text-brand-primary hover:bg-brand-light/50"
                title="Change location"
              >
                <Home size={12} />
                <span className="font-medium">Locations</span>
              </button>

              {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                
                return (
                  <div key={`${item.label}-${index}`} className="flex items-center gap-1">
                    <ChevronRight size={12} className="text-brand-textSecondary/50" />
                    <button
                      type="button"
                      onClick={item.onClick}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                        isLast 
                          ? 'text-brand-primary bg-brand-light/50 font-semibold' 
                          : 'text-brand-textSecondary hover:text-brand-primary hover:bg-brand-light/50'
                      }`}
                      title={`Go to ${item.type} selection`}
                    >
                      {item.icon}
                      <span className={isLast ? 'font-semibold' : 'font-medium'}>
                        {item.label}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selection mode indicator */}
          {isSelectionRoute && (
            <div className="hidden md:flex items-center gap-2 ml-2">
              <span className="text-xs px-2 py-1 bg-brand-light text-brand-primary rounded-full font-medium">
                {location.pathname.includes('select-state') && 'Selecting State'}
                {location.pathname.includes('select-branch') && 'Selecting Branch'}
                {location.pathname.includes('select-hall') && 'Selecting Hall'}
              </span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Page navigation */}
          <div className="hidden md:flex items-center gap-1 mr-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-light text-brand-primary'
                      : 'text-brand-textSecondary hover:bg-brand-light hover:text-brand-textPrimary'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Clock */}
          <div className="hidden lg:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-brand-textPrimary tabular-nums">{formatTime(time)}</span>
            <span className="text-xs text-brand-textSecondary">{formatDate(time)}</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              ref={notifButtonRef}
              onClick={toggleNotifications}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-brand-light transition-colors text-brand-textSecondary"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  ref={notifRef}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-card-hover border border-brand-border overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
                    <span className="font-semibold text-sm text-brand-textPrimary">Notifications</span>
                    {unread > 0 && (
                      <span className="text-xs bg-brand-danger text-white px-2 py-0.5 rounded-full">
                        {unread} new
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-brand-textSecondary text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            // Optionally close notification panel after clicking
                            // setNotifOpen(false);
                          }}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-brand-border/50 cursor-pointer hover:bg-brand-light/50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notifColors[n.severity]}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug ${!n.read ? 'font-semibold text-brand-textPrimary' : 'text-brand-textSecondary'}`}>
                              {n.message}
                            </p>
                            <p className="text-[10px] text-brand-textSecondary mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2.5 text-center border-t border-brand-border">
                    <button className="text-xs text-brand-primary font-medium hover:underline">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              ref={profileButtonRef}
              onClick={toggleProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-brand-light transition-colors"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-brand-textPrimary leading-none">Admin</p>
                <p className="text-[10px] text-brand-textSecondary leading-none mt-0.5">NMCH Nellore</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-brand-textSecondary transition-transform ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  ref={profileRef}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-card-hover border border-brand-border overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-brand-border">
                    <p className="text-sm font-semibold text-brand-textPrimary">Institution Admin</p>
                    <p className="text-xs text-brand-textSecondary">admin@nmch.edu.in</p>
                  </div>

                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-textSecondary hover:bg-brand-light transition-colors">
                    <Settings size={14} /> Settings
                  </button>

                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-danger hover:bg-red-50 transition-colors">
                    <LogOut size={14} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}