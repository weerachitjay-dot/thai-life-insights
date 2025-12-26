import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Beaker, Zap, TrendingUp, AlertTriangle, Check, X, Lightbulb, Target } from 'lucide-react';

interface OptimizationSuggestion {
  id: string;
  type: 'scale' | 'pause' | 'adjust' | 'creative';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  campaign?: string;
}

const mockSuggestions: OptimizationSuggestion[] = [
  {
    id: '1',
    type: 'scale',
    title: 'Increase Budget on "LIFE-SENIOR-MORRADOK"',
    description: 'This campaign has stable CPL for 3 consecutive days and is below target. Recommend scaling budget by 20%.',
    impact: 'high',
    campaign: 'LIFE-SENIOR-MORRADOK'
  },
  {
    id: '2',
    type: 'pause',
    title: 'Pause "Life_Static_Banner_old" Creative',
    description: 'Creative fatigue detected. Frequency is 4.2 and CTR dropped below 1%. Consider refreshing or pausing.',
    impact: 'high',
    campaign: 'LIFE-PROTECT-FAMILY'
  },
  {
    id: '3',
    type: 'adjust',
    title: 'Narrow Audience on "HEALTH-PLUS-PREMIUM"',
    description: 'High CPL detected (฿291). Consider removing "Insurance" interest which is underperforming.',
    impact: 'medium',
    campaign: 'HEALTH-PLUS-PREMIUM'
  },
  {
    id: '4',
    type: 'creative',
    title: 'Test Video Format for Saving Products',
    description: 'Video creatives show 25% lower CPL compared to static images for saving products. Consider creating more video content.',
    impact: 'medium'
  },
  {
    id: '5',
    type: 'scale',
    title: 'Increase Budget on "Luxury Vehicle" Interest',
    description: 'This targeting has the lowest CPL (฿145) across all interests. Recommend reallocating budget from underperformers.',
    impact: 'high'
  }
];

export default function OptimizationPage() {
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

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
