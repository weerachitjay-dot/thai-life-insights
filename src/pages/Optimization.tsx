import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Beaker, Zap, TrendingUp, AlertTriangle, Check, X, Lightbulb, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFilter } from '@/contexts/FilterContext';
import { ProductSetting } from '@/types';
import { subDays, format } from 'date-fns';

interface OptimizationSuggestion {
  id: string;
  type: 'scale' | 'pause' | 'adjust' | 'creative';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  campaign?: string;
}

export default function OptimizationPage() {
  const { dateRange } = useFilter();
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSuggestions();
  }, [dateRange]);

  const generateSuggestions = async () => {
    try {
      setLoading(true);
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];

      // Fetch necessary data
      const [settingsRes, adsRes, leadsRes] = await Promise.all([
        supabase.from('product_settings').select('*'),
        supabase.from('ad_performance_daily')
          .select('product_code, ad_id, ad_name, spend, meta_leads, impressions, clicks, date')
          .gte('date', fromDate)
          .lte('date', toDate),
        supabase.from('leads_sent_daily')
          .select('product_code, sent_all_amount')
          .gte('report_date', fromDate)
          .lte('report_date', toDate)
      ]);

      const settings = settingsRes.data || [];
      const ads = adsRes.data || [];
      const leads = leadsRes.data || [];

      const newSuggestions: OptimizationSuggestion[] = [];

      // 1. Analyze CPL Performance by Product
      const productMap = new Map<string, {
        spend: number;
        metaLeads: number;
        sentLeads: number;
        targetCpl: number;
      }>();

      settings.forEach((s: ProductSetting) => {
        productMap.set(s.product_code, {
          spend: 0,
          metaLeads: 0,
          sentLeads: 0,
          targetCpl: s.target_cpl || 200
        });
      });

      ads.forEach((row: any) => {
        const item = productMap.get(row.product_code);
        if (item) {
          item.spend += (row.spend || 0);
          item.metaLeads += (row.meta_leads || 0);
        }
      });

      leads.forEach((row: any) => {
        const item = productMap.get(row.product_code);
        if (item) {
          item.sentLeads += (row.sent_all_amount || 0);
        }
      });

      // Generate product-level suggestions
      productMap.forEach((data, productCode) => {
        const cpl = data.metaLeads > 0 ? data.spend / data.metaLeads : 0;
        const ratio = cpl / data.targetCpl;

        // Scale suggestion
        if (ratio <= 0.8 && data.metaLeads > 10) {
          newSuggestions.push({
            id: `scale-${productCode}`,
            type: 'scale',
            title: `Increase Budget on "${productCode}"`,
            description: `CPL is ${Math.round(cpl)}฿ (${Math.round((1 - ratio) * 100)}% below target). Campaign is performing well with ${data.metaLeads} leads. Recommend scaling budget by 20%.`,
            impact: 'high',
            campaign: productCode
          });
        }

        // Pause/Review suggestion
        if (ratio > 1.5 && data.spend > 1000) {
          newSuggestions.push({
            id: `pause-${productCode}`,
            type: 'pause',
            title: `Review "${productCode}" Performance`,
            description: `CPL is ${Math.round(cpl)}฿ (${Math.round((ratio - 1) * 100)}% above target). Spent ${Math.round(data.spend)}฿ with high cost. Consider pausing or adjusting targeting.`,
            impact: 'high',
            campaign: productCode
          });
        }

        // Conversion optimization
        const convRate = data.metaLeads > 0 ? (data.sentLeads / data.metaLeads) * 100 : 0;
        if (convRate < 50 && data.metaLeads > 20) {
          newSuggestions.push({
            id: `adjust-${productCode}`,
            type: 'adjust',
            title: `Improve Lead Quality for "${productCode}"`,
            description: `Only ${Math.round(convRate)}% of Meta leads are being sent. Screening rate is low. Consider adjusting targeting to improve lead quality.`,
            impact: 'medium',
            campaign: productCode
          });
        }
      });

      // 2. Analyze Creative Performance
      const adMap = new Map<string, {
        name: string;
        spend: number;
        impressions: number;
        clicks: number;
        leads: number;
        productCode: string;
      }>();

      ads.forEach((row: any) => {
        const key = row.ad_id || row.ad_name;
        if (!adMap.has(key)) {
          adMap.set(key, {
            name: row.ad_name || 'Unknown',
            spend: 0,
            impressions: 0,
            clicks: 0,
            leads: 0,
            productCode: row.product_code
          });
        }
        const ad = adMap.get(key)!;
        ad.spend += (row.spend || 0);
        ad.impressions += (row.impressions || 0);
        ad.clicks += (row.clicks || 0);
        ad.leads += (row.meta_leads || 0);
      });

      // Detect creative fatigue
      adMap.forEach((ad, adId) => {
        const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
        const frequency = ad.impressions > 0 && ad.clicks > 0 ? ad.impressions / ad.clicks : 0;

        if (ctr < 1 && frequency > 4 && ad.spend > 500) {
          newSuggestions.push({
            id: `creative-${adId}`,
            type: 'creative',
            title: `Creative Fatigue Detected: "${ad.name}"`,
            description: `CTR dropped to ${ctr.toFixed(2)}% with frequency of ${frequency.toFixed(1)}. Consider refreshing creative or pausing.`,
            impact: 'high',
            campaign: ad.productCode
          });
        }
      });

      // 3. General Creative Suggestions (if we have data)
      if (ads.length > 0) {
        const totalImpressions = ads.reduce((sum: number, a: any) => sum + (a.impressions || 0), 0);
        if (totalImpressions > 10000) {
          newSuggestions.push({
            id: 'creative-general',
            type: 'creative',
            title: 'Test New Creative Formats',
            description: 'Based on current performance, consider testing video formats or carousel ads to improve engagement and reduce creative fatigue.',
            impact: 'medium'
          });
        }
      }

      setSuggestions(newSuggestions);

    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scale':
        return <TrendingUp className="w-5 h-5 text-status-scale" />;
      case 'pause':
        return <AlertTriangle className="w-5 h-5 text-status-risk" />;
      case 'adjust':
        return <Target className="w-5 h-5 text-status-hold" />;
      case 'creative':
        return <Lightbulb className="w-5 h-5 text-primary" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-status-scale/20 text-status-scale border-status-scale">High Impact</Badge>;
      case 'medium':
        return <Badge className="bg-status-hold/20 text-status-hold border-status-hold">Medium Impact</Badge>;
      default:
        return <Badge variant="outline">Low Impact</Badge>;
    }
  };

  const handleApply = (id: string) => {
    setAppliedIds([...appliedIds, id]);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds([...dismissedIds, id]);
  };

  const visibleSuggestions = suggestions.filter(
    s => !appliedIds.includes(s.id) && !dismissedIds.includes(s.id)
  );

  if (loading) {
    return (
      <DashboardLayout title="Optimization Lab" subtitle="AI-Powered Suggestions & Rule-Based Alerts">
        <div className="p-10 text-center text-muted-foreground">
          Analyzing campaign performance...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Optimization Lab" subtitle="AI-Powered Suggestions & Rule-Based Alerts">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded">
              <Beaker className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Actions</p>
              <p className="text-2xl font-bold">{visibleSuggestions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-scale/20 rounded">
              <Check className="w-6 h-6 text-status-scale" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Applied Today</p>
              <p className="text-2xl font-bold">{appliedIds.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-risk/20 rounded">
              <TrendingUp className="w-6 h-6 text-status-risk" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Impact Pending</p>
              <p className="text-2xl font-bold">
                {visibleSuggestions.filter(s => s.impact === 'high').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Suggestions List */}
      {visibleSuggestions.length === 0 ? (
        <Card className="border-2 border-foreground p-8 text-center">
          <Check className="w-12 h-12 text-status-scale mx-auto mb-4" />
          <p className="text-lg font-bold">All caught up!</p>
          <p className="text-muted-foreground">No pending optimization suggestions.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border-2 border-foreground p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-3 bg-secondary rounded-lg shrink-0">
                  {getTypeIcon(suggestion.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-bold text-foreground">{suggestion.title}</h3>
                      {suggestion.campaign && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Campaign: {suggestion.campaign}
                        </p>
                      )}
                    </div>
                    {getImpactBadge(suggestion.impact)}
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApply(suggestion.id)}
                    className="gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(suggestion.id)}
                    className="gap-1"
                  >
                    <X className="w-4 h-4" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Applied Actions Log */}
      {appliedIds.length > 0 && (
        <Card className="border-2 border-foreground mt-6 p-4">
          <h3 className="font-bold mb-3">Recently Applied</h3>
          <div className="space-y-2">
            {suggestions.filter(s => appliedIds.includes(s.id)).map(s => (
              <div key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-status-scale" />
                <span>{s.title}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
