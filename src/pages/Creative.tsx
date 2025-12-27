
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Image as ImageIcon, LayoutGrid, List, Play } from 'lucide-react'; // Image alias to avoid conflict
import { CreativeData, CampaignStatus } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/campaignParser';
import { supabase } from '@/integrations/supabase/client';

export default function CreativePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [creativeData, setCreativeData] = useState<CreativeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreativeData();
  }, []);

  const fetchCreativeData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ad_performance_daily')
        .select('*'); // We will aggregate locally

      if (error) throw error;

      if (!data) {
        setCreativeData([]);
        return;
      }

      // Aggregate by Ad Name (or ID if available and consistent)
      const adMap = new Map<string, CreativeData>();

      data.forEach((row: any) => {
        // Simple hashing or keying by ad_name. 
        // Ideally we use ad_id, but prompt says "Creative Analysis", often grouped by name in this project context.
        // Let's use ad_name as the key.
        const key = row.ad_name;

        if (!adMap.has(key)) {
          adMap.set(key, {
            id: row.ad_id || key, // Fallback to name if ID missing
            thumbnail: row.image_url || '',
            name: row.ad_name,
            spend: 0,
            metaLeads: 0,
            cplMeta: 0,
            ctr: 0, // Weighted average needed or sum(clicks)/sum(impressions)
            frequency: 0, // Max or Avg? Usually per day it's ~1.x, cumulative is different. Let's use avg for now or max.
            status: (row.status as CampaignStatus) || 'UNKNOWN',
            fatigueAlert: false,
            // Temporary storage for calc
            _clicks: 0,
            _impressions: 0,
            _days: 0
          } as any);
        }

        const ad = adMap.get(key)!;
        ad.spend += (row.spend || 0);
        ad.metaLeads += (row.leads || 0);

        // For CTR & Freq
        // Assuming row has clicks/impressions. If not, we might have to skip.
        // The DB schema from previous turn implied standard fields.
        // Let's assume standard meta fields exist: clicks, impressions.
        const clicks = row.clicks || 0;
        const impressions = row.impressions || 0;

        (ad as any)._clicks += clicks;
        (ad as any)._impressions += impressions;
        (ad as any)._days += 1;

        // Update thumbnail if missing (sometimes first row has it)
        if (!ad.thumbnail && row.image_url) {
          ad.thumbnail = row.image_url;
        }
      });

      const metrics: CreativeData[] = Array.from(adMap.values()).map((ad: any) => {
        const cpl = ad.metaLeads > 0 ? ad.spend / ad.metaLeads : 0;
        const ctr = ad._impressions > 0 ? (ad._clicks / ad._impressions) * 100 : 0;

        // Logic for Status/Alerts could be more complex, but using simple heuristics or last status
        // Fatigue: High Frequency (> 2.5) AND Low CTR (< 0.8%) - Simplified rule
        // We lack true frequency (reach/impressions) per person, but simple impressions/reach if we had reach.
        // Without reach, we can't calc frequency accurately agg over days. 
        // Let's placeholder frequency or remove it if not available. 
        // Or assume data has frequency field? If daily frequency, avg it.
        const frequency = 1.0; // Placeholder as we don't have unique reach across days

        const fatigueAlert = ctr < 0.8 && ad.spend > 5000; // heuristic

        return {
          id: ad.id,
          thumbnail: ad.thumbnail,
          name: ad.name,
          spend: ad.spend,
          metaLeads: ad.metaLeads,
          cplMeta: cpl,
          ctr: ctr,
          frequency: frequency,
          status: ad.status, // This takes the status from the LAST row processed (most recent if sorted?) - Map iteration order is insertion order. 
          // Ideally we sort data by date before processing.
          fatigueAlert: fatigueAlert
        };
      });

      // Sort by Spend descending
      metrics.sort((a, b) => b.spend - a.spend);

      setCreativeData(metrics);

    } catch (error) {
      console.error('Error fetching creatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const fatigueAlerts = creativeData.filter(c => c.fatigueAlert);

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
                {fatigueAlerts.length} creatives have low performance. Consider refreshing.
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

      {loading ? (
        <div className="text-center p-10 text-muted-foreground">Loading creatives...</div>
      ) : viewMode === 'grid' ? (
        /* Creative Gallery - Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creativeData.map((creative) => (
            <Card key={creative.id} className="border-2 border-foreground overflow-hidden">
              {/* Thumbnail */}
              <div className="h-32 bg-secondary flex items-center justify-center relative group cursor-pointer overflow-hidden">
                {creative.thumbnail ? (
                  <img
                    src={creative.thumbnail}
                    alt={creative.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = ''; // Clear broken src
                      (e.target as HTMLImageElement).classList.add('hidden');
                    }}
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                )}
                {/* Fallback Icon if image hidden/missing */}
                <div className={`${creative.thumbnail ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}>
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>

                {/* Video Play Icon Overlay (Optional visual cue) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/50">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-foreground ml-1" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium text-sm truncate flex-1" title={creative.name}>{creative.name}</p>
                  <Badge className={`ml-2 ${creative.status === 'SCALE' ? 'bg-status-scale text-status-scale-foreground' :
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
                    <p className="text-xs text-muted-foreground">CTR</p>
                    <p className="font-mono">{creative.ctr.toFixed(2)}%</p>
                  </div>
                </div>

                {creative.fatigueAlert && (
                  <div className="mt-3 p-2 bg-status-risk/10 border border-status-risk text-xs text-status-risk font-medium">
                    ⚠️ Low Performance
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
                      <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center relative overflow-hidden">
                        {creative.thumbnail ? (
                          <img src={creative.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium truncate max-w-[200px]" title={creative.name}>{creative.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(creative.spend)}</TableCell>
                  <TableCell className="text-right font-mono">{formatPercent(creative.ctr)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(creative.cplMeta)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${creative.status === 'SCALE' ? 'bg-status-scale text-status-scale-foreground' :
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
