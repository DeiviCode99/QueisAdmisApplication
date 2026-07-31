import type { ComponentType, ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="bg-brand-50 p-4 rounded-[14px] mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_12px_rgba(14,165,233,0.06)]">
          <div className="bg-white p-3 rounded-[10px] shadow-[inset_2px_2px_6px_rgba(14,165,233,0.04),inset_-2px_-2px_6px_rgba(255,255,255,0.8)]">
            <Icon className="h-8 w-8 text-brand-400" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-heading font-semibold text-brand-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-brand-500 mb-6 max-w-sm">{description}</p>}
      {action && action}
    </div>
  );
}
