import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Search, Filter, FileText, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '../../store';
import { useReports, exportReport } from '../../api/hooks';
import Badge from '../ui/Badge';
import { SkeletonCard } from '../ui/Skeleton';

export default function Reports() {
  const { selectedHall, dateRange } = useAppStore();
  const hallId = selectedHall?.id ?? '';

  const { data: reports, loading } = useReports(hallId, dateRange.from, dateRange.to);
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState('All');

  const filtered = (reports ?? []).filter((r) => {
    const matchSearch =
      r.hall.toLowerCase().includes(search.toLowerCase()) ||
      r.meal.toLowerCase().includes(search.toLowerCase()) ||
      r.branch.toLowerCase().includes(search.toLowerCase());
    const matchMeal = mealFilter === 'All' || r.meal === mealFilter;
    return matchSearch && matchMeal;
  });

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-brand-textPrimary">Reports</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => filtered[0] && exportReport(filtered[0].id, 'pdf')}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-primary bg-brand-light px-3 py-2 rounded-xl border border-brand-border hover:bg-blue-100 transition-colors"
          >
            <FileText size={13} /> PDF
          </button>
          <button
            onClick={() => filtered[0] && exportReport(filtered[0].id, 'excel')}
            className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-3 py-2 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
          >
            <FileSpreadsheet size={13} /> Excel
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-brand-border shadow-card overflow-hidden"
      >
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-brand-border">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-brand-light border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-brand-textSecondary" />
            {['All', 'Breakfast', 'Lunch', 'Dinner'].map((m) => (
              <button
                key={m} onClick={() => setMealFilter(m)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  mealFilter === m ? 'bg-brand-primary text-white' : 'bg-brand-light text-brand-textSecondary hover:bg-blue-100'
                }`}
              >{m}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-4"><SkeletonCard lines={5} /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-light border-b border-brand-border">
                    {['Date','Hall','Meal','Timing','Registered','Eaten','Not Eaten','Unregistered','Attendance %','Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-brand-textSecondary px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-brand-border/50 hover:bg-brand-light/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-brand-textSecondary whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-3 text-xs font-medium text-brand-textPrimary whitespace-nowrap">{r.hall}</td>
                      <td className="px-4 py-3">
                        <Badge label={r.meal} variant={r.meal === 'Breakfast' ? 'warning' : r.meal === 'Lunch' ? 'primary' : 'info'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-textSecondary whitespace-nowrap">{r.mealTiming}</td>
                      <td className="px-4 py-3 text-xs font-medium text-brand-textPrimary">{r.registered}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-green-700">{r.registeredEaten}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-amber-700">{r.registeredNotEaten}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-red-600">{r.unregistered}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-brand-light rounded-full w-16">
                            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${r.attendancePct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-brand-primary">{r.attendancePct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => exportReport(r.id, 'pdf')} className="flex items-center gap-1 text-xs text-brand-primary hover:text-blue-700 font-medium">
                            <Download size={12} /> PDF
                          </button>
                          <button onClick={() => exportReport(r.id, 'excel')} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium">
                            <Download size={12} /> XLS
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-brand-textSecondary text-sm">
                  No reports found for selected date range
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
              <span className="text-xs text-brand-textSecondary">Showing {filtered.length} of {reports?.length ?? 0} reports</span>
              <div className="flex items-center gap-1">
                {[1,2,3].map((p) => (
                  <button key={p} className={`w-7 h-7 text-xs rounded-lg font-medium ${p === 1 ? 'bg-brand-primary text-white' : 'text-brand-textSecondary hover:bg-brand-light'}`}>{p}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
