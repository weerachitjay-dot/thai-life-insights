import { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FilterBar from '@/components/dashboard/FilterBar';
import KpiCards from '@/components/dashboard/KpiCards';
import ProductMatrix from '@/components/dashboard/ProductMatrix';
import LeadQualityChart from '@/components/dashboard/LeadQualityChart';
import CreativeAnalysis from '@/components/dashboard/CreativeAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiData, ProductMatrixRow } from '@/types';

// Mock Data
const mockKpiData: KpiData = {
  totalSpend: 1250000,
  totalLeads: 8450,
  avgCpl: 148,
  riskCampaigns: 3
};

const mockMatrixData: ProductMatrixRow[] = [
  {
    product: 'LIFE-SENIOR-MORRADOK',
    category: 'Life',
    leadGen: { cpl: 150, status: 'SCALE' },
    conversion: { cpl: 450, status: 'HOLD' },
    messages: null,
    action: 'Boost Lead Gen'
  },
  {
    product: 'SAVING-RETIRE-GOLD',
    category: 'Saving',
    leadGen: { cpl: 180, status: 'HOLD' },
    conversion: { cpl: 320, status: 'SCALE' },
    messages: { cpl: 95, status: 'SCALE' },
    action: 'Boost Conversion'
  },
  {
    product: 'HEALTH-PLUS-PREMIUM',
    category: 'Health',
    leadGen: { cpl: 220, status: 'RISK' },
    conversion: { cpl: 580, status: 'KILL' },
    messages: { cpl: 110, status: 'HOLD' },
    action: 'Stop Conversion'
  },
  {
    product: 'LIFE-PROTECT-FAMILY',
    category: 'Life',
    leadGen: { cpl: 135, status: 'SCALE' },
    conversion: null,
    messages: { cpl: 85, status: 'SCALE' },
    action: 'Boost All Channels'
  },
  {
    product: 'SAVING-EDU-FUTURE',
    category: 'Saving',
    leadGen: { cpl: 195, status: 'HOLD' },
    conversion: { cpl: 410, status: 'RISK' },
    messages: null,
    action: 'Review Conversion'
  },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState('matrix');

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6">
        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar />
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <KpiCards data={mockKpiData} />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-2 border-foreground bg-card p-0 h-auto">
            <TabsTrigger 
              value="matrix" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 font-bold uppercase text-sm border-r-2 border-foreground rounded-none"
            >
              Product Matrix
            </TabsTrigger>
            <TabsTrigger 
              value="leads" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 font-bold uppercase text-sm border-r-2 border-foreground rounded-none"
            >
              Lead Quality
            </TabsTrigger>
            <TabsTrigger 
              value="creative" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 font-bold uppercase text-sm rounded-none"
            >
              Creative Analysis
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="matrix" className="m-0">
              <ProductMatrix data={mockMatrixData} />
            </TabsContent>

            <TabsContent value="leads" className="m-0">
              <LeadQualityChart />
            </TabsContent>

            <TabsContent value="creative" className="m-0">
              <CreativeAnalysis />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Stats */}
        <div className="mt-8 p-4 bg-secondary border-2 border-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <span className="font-mono">
                <span className="text-muted-foreground">Last Updated:</span>{' '}
                <span className="font-bold">Dec 26, 2025 14:32</span>
              </span>
              <span className="font-mono">
                <span className="text-muted-foreground">Data Source:</span>{' '}
                <span className="font-bold">Meta Ads API</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-status-scale border border-foreground"></span>
                <span className="text-xs font-bold uppercase">Scale</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-status-hold border border-foreground"></span>
                <span className="text-xs font-bold uppercase">Hold</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-status-risk border border-foreground"></span>
                <span className="text-xs font-bold uppercase">Risk</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-status-kill border border-foreground"></span>
                <span className="text-xs font-bold uppercase">Kill</span>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
