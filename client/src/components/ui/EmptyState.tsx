import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
}: EmptyStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-10 rounded-2xl bg-white/5 border border-white/10 text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-5 ring-1 ring-white/10">
        <Icon className="w-8 h-8 text-[#8C97A8]/50" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
        {title}
      </h3>
      
      <p className="text-sm text-[#8C97A8] max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#11AFFA] hover:bg-[#0090FF] text-white text-sm font-semibold transition-all shadow-[0_0_15px_rgba(17,175,250,0.3)] hover:shadow-[0_0_20px_rgba(17,175,250,0.5)] active:scale-95"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
