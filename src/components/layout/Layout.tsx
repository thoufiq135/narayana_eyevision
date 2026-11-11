import { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store';

export default function Layout({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useAppStore();
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col overflow-x-hidden">
      <Navbar />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className={`flex-1 min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : ''}`}>
          {/* Clear sticky header on mobile; keep consistent spacing */}
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto pt-4 lg:pt-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
