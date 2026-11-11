interface BadgeProps {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'gray';
  dot?: boolean;
  size?: 'sm' | 'md';
}

const variants = {
  success: 'bg-green-50 text-green-700 border-green-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  primary: 'bg-brand-light text-brand-primary border-brand-border',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
};

const dotColors = {
  success: 'bg-green-500', danger: 'bg-red-500', warning: 'bg-amber-500',
  info: 'bg-blue-500', primary: 'bg-brand-primary', gray: 'bg-gray-400',
};

export default function Badge({ label, variant = 'primary', dot = false, size = 'sm' }: BadgeProps) {
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sz} ${variants[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {label}
    </span>
  );
}
