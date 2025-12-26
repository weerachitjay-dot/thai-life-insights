import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';

export default function AudiencePage() {
  return (
    <DashboardLayout title="Smart Audience" subtitle="Audience Performance Breakdown">
      <Card className="border-2 border-foreground p-8 text-center">
        <p className="text-muted-foreground">Audience performance analysis and segmentation</p>
        <p className="text-sm text-muted-foreground mt-2">Coming soon...</p>
      </Card>
    </DashboardLayout>
  );
}
