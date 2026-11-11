import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  title: string;
  value: number;
  icon: ReactNode;
  gradient: string;
  iconBg: string;
  trend?: number;
  suffix?: string;
  subtitle?: string;
  delay?: number;
}

export default function KPICard({ title, value, icon, gradient, iconBg, trend, suffix = '', subtitle, delay = 0 }: Props) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px 0 rgba(33,150,243,0.15)' }}
      className={`relative overflow-hidden rounded-2xl p-5 border border-brand-border shadow-card bg-white cursor-default`}
    >
      {/* Gradient accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-8 translate-x-8 ${gradient}`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trendPositive ? 'bg-green-50 text-green-600' : trendNegative ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
          }`}>
            {trendPositive ? <TrendingUp size={12} /> : trendNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="mb-1">
        <AnimatedCounter value={value} suffix={suffix} className="text-3xl font-bold text-brand-textPrimary" />
      </div>
      <p className="text-sm font-semibold text-brand-textPrimary mb-0.5">{title}</p>
      {subtitle && <p className="text-xs text-brand-textSecondary">{subtitle}</p>}
    </motion.div>
  );
}
