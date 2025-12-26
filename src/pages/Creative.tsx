import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Image, LayoutGrid, List, Play } from 'lucide-react';
import { CreativeData } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/campaignParser';

// Mock data - Uses META Leads only (not Sent/TL)
const creativeData: CreativeData[] = [
  { id: '1', thumbnail: '', name: 'Senior_Video_Testimonial_v1', spend: 85000, metaLeads: 620, cplMeta: 137, ctr: 2.8, frequency: 1.8, status: 'SCALE', fatigueAlert: false },
  { id: '2', thumbnail: '', name: 'Family_Carousel_Benefits_v2', spend: 72000, metaLeads: 480, cplMeta: 150, ctr: 2.4, frequency: 2.1, status: 'SCALE', fatigueAlert: false },
  { id: '3', thumbnail: '', name: 'Health_Static_Promo_v1', spend: 65000, metaLeads: 290, cplMeta: 224, ctr: 1.2, frequency: 3.5, status: 'RISK', fatigueAlert: true },
  { id: '4', thumbnail: '', name: 'Saving_Video_Calculator_v1', spend: 45000, metaLeads: 210, cplMeta: 214, ctr: 1.8, frequency: 2.8, status: 'HOLD', fatigueAlert: false },
  { id: '5', thumbnail: '', name: 'Life_Static_Banner_old', spend: 38000, metaLeads: 95, cplMeta: 400, ctr: 0.6, frequency: 4.2, status: 'KILL', fatigueAlert: true },
];

const fatigueAlerts = creativeData.filter(c => c.fatigueAlert);

export default function CreativePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  return (
    <DashboardLayout title="Creative Analysis" subtitle="Win/Loss Analysis - Meta Leads Focus">
      {/* Fatigue Alert */}
      {fatigueAlerts.length > 0 && (
        <Card className="border-2 border-status-risk bg-status-risk/10 p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-status-risk" />
            <div>
              <p className="font-bold">Creative Fatigue Alert</p>
              <p className="text-sm text-muted-foreground">
                {fatigueAlerts.length} creatives have high frequency (&gt;3) and low CTR. Consider refreshing.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex border border-border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-none"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="rounded-none"
          >
            <List className="w-4 h-4 mr-2" />
            Table
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        /* Creative Gallery - Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creativeData.map((creative) => (
            <Card key={creative.id} className="border-2 border-foreground overflow-hidden">
              {/* Thumbnail */}
              <div className="h-32 bg-secondary flex items-center justify-center relative group cursor-pointer">
                <Image className="w-12 h-12 text-muted-foreground" />
                {/* Video Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/50">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-foreground ml-1" />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium text-sm truncate flex-1">{creative.name}</p>
                  <Badge className={`ml-2 ${
                    creative.status === 'SCALE' ? 'bg-status-scale text-status-scale-foreground' :
                    creative.status === 'HOLD' ? 'bg-status-hold text-status-hold-foreground' :
                    creative.status === 'RISK' ? 'bg-status-risk text-status-risk-foreground' :
                    'bg-status-kill text-status-kill-foreground'
                  }`}>
                    {creative.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Spend</p>
                    <p className="font-mono font-bold">{formatCurrency(creative.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meta Leads</p>
                    <p className="font-mono font-bold">{formatNumber(creative.metaLeads)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CPL (Meta)</p>
                    <p className="font-mono">{formatCurrency(creative.cplMeta)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Frequency</p>
                    <p className={`font-mono ${creative.frequency > 3 ? 'text-status-risk font-bold' : ''}`}>
                      {creative.frequency.toFixed(1)}
                    </p>
                  </div>
                </div>

                {creative.fatigueAlert && (
                  <div className="mt-3 p-2 bg-status-risk/10 border border-status-risk text-xs text-status-risk font-medium">
                    ⚠️ Fatigue detected - Consider pausing
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Creative Table View */
        <Card className="border-2 border-foreground">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="font-bold">Creative Name</TableHead>
                <TableHead className="font-bold text-right">Spend</TableHead>
                <TableHead className="font-bold text-right">CTR</TableHead>
                <TableHead className="font-bold text-right">CPL</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creativeData.map((creative) => (
                <TableRow key={creative.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center relative">
                        <Image className="w-5 h-5 text-muted-foreground" />
                        <Play className="w-3 h-3 text-muted-foreground absolute bottom-0 right-0" />
                      </div>
                      <span className="font-medium">{creative.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(creative.spend)}</TableCell>
                  <TableCell className="text-right font-mono">{formatPercent(creative.ctr)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(creative.cplMeta)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${
                      creative.status === 'SCALE' ? 'bg-status-scale text-status-scale-foreground' :
                      creative.status === 'HOLD' ? 'bg-status-hold text-status-hold-foreground' :
                      creative.status === 'RISK' ? 'bg-status-risk text-status-risk-foreground' :
                      'bg-status-kill text-status-kill-foreground'
                    }`}>
                      {creative.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
}
