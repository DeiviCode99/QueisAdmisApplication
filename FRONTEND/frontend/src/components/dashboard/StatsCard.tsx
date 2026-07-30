import type { ComponentType } from 'react';

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500',
    text: 'text-emerald-600'
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500',
    text: 'text-blue-600'
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500',
    text: 'text-amber-600'
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'bg-rose-500',
    text: 'text-rose-600'
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300 hover-lift">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs sm:text-sm font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`${colors.bg} p-2 sm:p-3 rounded-lg shrink-0`}>
          <div className={`${colors.icon} p-1.5 sm:p-2 rounded-lg`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
