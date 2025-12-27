import { KpiData } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/campaignParser';
import { TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react';

interface KpiCardsProps {
  data: KpiData;
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  decorationColor: 'primary' | 'scale' | 'hold' | 'risk';
}

function KpiCard({ title, value, icon, decorationColor }: KpiCardProps) {
  const decorationClasses = {
    primary: 'border-l-primary',
    scale: 'border-l-status-scale',
    hold: 'border-l-status-hold',
    risk: 'border-l-status-risk'
  };

  return (
    <div className={cn(
      'bg-card border-2 border-foreground p-6 shadow-md transition-all hover:shadow-lg hover:-translate-x-1 hover:-translate-y-1',
      'border-l-8',
      decorationClasses[decorationColor]
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-2 font-mono">{value}</p>
        </div>
        <div className="p-3 bg-secondary border-2 border-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

export default function KpiCards({ data }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <KpiCard
        title="Total Spend (This Month)"
        value={formatCurrency(data.totalSpend)}
        icon={<DollarSign className="w-6 h-6" />}
        decorationColor="primary"
      />
      <KpiCard
        title="Total Leads"
        value={formatNumber(data.totalLeads)}
        icon={<Users className="w-6 h-6" />}
        decorationColor="scale"
      />
      <KpiCard
        title="Avg. CPL"
        value={formatCurrency(data.avgCpl)}
        icon={<TrendingUp className="w-6 h-6" />}
        decorationColor="hold"
      />
      <KpiCard
        title="Risk Campaigns"
        value={String(data.riskCampaigns)}
        icon={<AlertTriangle className="w-6 h-6" />}
        decorationColor="risk"
      />
    </div>
  );
}
