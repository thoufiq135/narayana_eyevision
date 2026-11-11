interface Props { lines?: number; className?: string; }

export function SkeletonCard({ lines = 3, className = '' }: Props) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-brand-border shadow-card ${className}`}>
      <div className="skeleton h-4 w-1/3 rounded mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card">
      <div className="flex justify-between mb-4">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-8 w-24 rounded mb-2" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  );
}
