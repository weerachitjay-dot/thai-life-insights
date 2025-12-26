import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';

export default function OptimizationPage() {
  return (
    <DashboardLayout title="Optimization Lab" subtitle="AI Suggestions & Rule-Based Alerts">
      <Card className="border-2 border-foreground p-8 text-center">
        <p className="text-muted-foreground">AI-powered optimization suggestions</p>
        <p className="text-sm text-muted-foreground mt-2">Coming soon...</p>
      </Card>
    </DashboardLayout>
  );
}
