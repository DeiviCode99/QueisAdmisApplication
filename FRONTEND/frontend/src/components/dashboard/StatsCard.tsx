import type { ComponentType } from 'react';

const colorClasses = {
  brand: {
    bg: 'bg-brand-50',
    icon: 'from-brand-400 to-brand-500',
    text: 'text-brand-600'
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'from-blue-400 to-blue-500',
    text: 'text-blue-600'
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'from-amber-400 to-amber-500',
    text: 'text-amber-600'
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'from-rose-400 to-rose-500',
    text: 'text-rose-600'
  },
  accent: {
    bg: 'bg-accent-50',
    icon: 'from-accent-400 to-accent-500',
    text: 'text-accent-600'
  }
} as const;

type ColorKey = keyof typeof colorClasses;

interface Trend {
  isPositive: boolean;
  value: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  color: ColorKey;
  trend?: Trend;
}

export default function StatsCard({ title, value, icon: Icon, color, trend }: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="clay-card p-4 sm:p-6 clay-card-hover cursor-default">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-brand-500 mb-1 truncate font-heading">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-brand-800 truncate">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs sm:text-sm font-medium ${
                trend.isPositive ? 'text-accent-600' : 'text-rose-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
              <span className="text-xs sm:text-sm text-brand-400 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`${colors.bg} p-2 sm:p-3 rounded-[12px] shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]`}>
          <div className={`bg-gradient-to-br ${colors.icon} p-1.5 sm:p-2 rounded-[10px] shadow-[0_2px_8px_rgba(14,165,233,0.15),inset_0_1px_0_rgba(255,255,255,0.3)]`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
