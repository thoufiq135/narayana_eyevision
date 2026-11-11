import { create } from 'zustand';
import { AppState, State, Branch, Hall, KPIData, DateRange } from '../types';
import { mockKPI, getMockMeals, mockDetectedPersons, mockNotifications, mockReports } from '../data/mock';
import { today, daysAgo } from '../api/hooks';

export const useAppStore = create<AppState>((set) => ({
  selectedState: null,
  selectedBranch: null,
  selectedHall: null,
  sidebarOpen: true,
  activeSection: 'overview',
  notifications: mockNotifications,
  kpi: mockKPI,
  meals: getMockMeals(),
  detectedPersons: mockDetectedPersons,
  reports: mockReports,

   // Refresh tracking
  refreshKey: 0,

  // Date defaults: today for single date, last 7 days for range
  selectedDate: today(),
  dateRange: {
    from: daysAgo(6),
    to: today(),
    preset: '7days',
  },

  setSelectedState: (s: State | null) => set({ selectedState: s, selectedBranch: null, selectedHall: null }),
  setSelectedBranch: (b: Branch | null) => set({ selectedBranch: b, selectedHall: null }),
  setSelectedHall: (h: Hall | null) => set({ selectedHall: h }),
  clearLocation: () => set({ selectedState: null, selectedBranch: null, selectedHall: null }),
  setSidebarOpen: (v: boolean) => set({ sidebarOpen: v }),
  setActiveSection: (s: string) => set({ activeSection: s }),
  markNotificationRead: (id: string) =>
    set((state) => ({ notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
  updateKPI: (data: Partial<KPIData>) => set((state) => ({ kpi: { ...state.kpi, ...data } })),
  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setDateRange: (range: DateRange) => set({ dateRange: range }),
}));
