import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/campaignParser';

export default function CostProfitPage() {
  return (
    <DashboardLayout title="Cost & Profit" subtitle="ROI & Revenue Analysis - TL Leads Focus">
      <Card className="border-2 border-foreground p-8 text-center">
        <p className="text-muted-foreground">Cost & Profit analysis with ROI, Revenue, and Confirmed Leads (TL)</p>
        <p className="text-sm text-muted-foreground mt-2">Coming soon...</p>
      </Card>
    </DashboardLayout>
  );
}
