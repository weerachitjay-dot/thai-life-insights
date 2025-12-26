import { CampaignStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: CampaignStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  SCALE: { 
    label: 'SCALE', 
    className: 'bg-status-scale text-status-scale-foreground' 
  },
  HOLD: { 
    label: 'HOLD', 
    className: 'bg-status-hold text-status-hold-foreground' 
  },
  RISK: { 
    label: 'RISK', 
    className: 'bg-status-risk text-status-risk-foreground' 
  },
  KILL: { 
    label: 'KILL', 
    className: 'bg-status-kill text-status-kill-foreground' 
  },
  UNKNOWN: { 
    label: '—', 
    className: 'bg-muted text-muted-foreground' 
  }
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center font-mono font-bold uppercase border-2 border-foreground',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
