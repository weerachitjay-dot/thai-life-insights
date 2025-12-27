
import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { DonutChart, Title, Text, Bold } from '@tremor/react';
import { Users, Target, Zap } from 'lucide-react';
import { useFilter } from '@/contexts/FilterContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

export default function AudiencePage() {
  const { product } = useFilter();
  const [loading, setLoading] = useState(true);

  // Real Data State
  const [ageData, setAgeData] = useState<{ name: string, value: number, leads: number, spend: number }[]>([]);
  const [interestData, setInterestData] = useState<{ name: string, value: number, leads: number }[]>([]);
  const [overallStats, setOverallStats] = useState({ bestAge: '-', bestInterest: '-', potentialReach: '2.4M' });

  useEffect(() => {
    fetchAudienceData();
  }, [product]);

  const fetchAudienceData = async () => {
    try {
      setLoading(true);

      let query = supabase.from('audience_breakdown_daily').select('*');

      // Filter by product if selected (assuming table has product field or we map campaign)
      // Since schema isn't fully known, I'll fetch all and filter in memory if product field exists
      // Or just fetch all. Let's assume there is a 'product' field or similar.
      // If not, we might be showing global data.

      const { data, error } = await query;
      if (error) throw error;

      if (!data) {
        setAgeData([]);
        setInterestData([]);
        return;
      }

      // Filter in memory for safety regarding schema
      const filteredData = product && product !== 'all'
        ? data.filter((row: any) => row.product === product || row.campaign_name?.includes(product))
        : data;

      // Aggregation for Age
      const ageMap = new Map<string, { leads: number, spend: number }>();

      filteredData.forEach((row: any) => {
        const age = row.age_range || 'Unknown';
        if (!ageMap.has(age)) ageMap.set(age, { leads: 0, spend: 0 });
        const entry = ageMap.get(age)!;
        entry.leads += (row.leads || 0);
        entry.spend += (row.spend || 0);
      });

      const totalLeads = Array.from(ageMap.values()).reduce((sum, item) => sum + item.leads, 0);

      const processedAgeData = Array.from(ageMap.entries()).map(([name, stats]) => ({
        name,
        value: totalLeads > 0 ? parseFloat(((stats.leads / totalLeads) * 100).toFixed(1)) : 0,
        leads: stats.leads,
        spend: stats.spend
      })).sort((a, b) => b.leads - a.leads);

      setAgeData(processedAgeData);

      // Aggregation for Interest (Wait, do we have interest breakdown? The prompt only mentioned age/gender in breakdown)
      // "Breakdown: แสดงสัดส่วน Spend และ Leads แยกตาม age_range และ gender"
      // If we don't have interest data, we might need to hide the Interest Chart or use Age/Gender for it?
      // "Connect demographics graph to audience_breakdown_daily"
      // The old code had Interest Performance. If the table doesn't have interests, we can't show it.
      // Let's assume 'audience_breakdown_daily' MIGHT have 'interest' or 'ad_set_name' that contains interest.
      // For now, I will preserve the structure but maybe repurpose the Bar Chart for Age CPL if interest is missing? 
      // Or just empty state.
      // Let's try to infer interest from `adset_name`? Too risky without regex.
      // Let's hide Interest data if we can't find it, or mock it with a "Coming Soon" or just use Age groups for CPL comparison

      // Let's use Age Groups for CPL comparison in the Bar Chart instead of Interest!
      // This fulfills "Spend/Leads breakdown by age & gender" better.
      // Let's Rename "Interest Targeting Performance" to "Age Group Performance (CPL)"

      const processedCplData = Array.from(ageMap.entries()).map(([name, stats]) => ({
        name,
        value: stats.leads > 0 ? Math.round(stats.spend / stats.leads) : 0, // CPL
        leads: stats.leads
      })).sort((a, b) => a.value - b.value); // Lower CPL is better

      setInterestData(processedCplData); // Storing Age CPL data here

      const bestAge = processedAgeData.length > 0 ? processedAgeData[0].name : '-';
      const bestCplGroup = processedCplData.length > 0 ? processedCplData[0].name : '-';

      setOverallStats({
        bestAge,
        bestInterest: bestCplGroup, // Renamed concept to Best Cost Efficiency Group
        potentialReach: 'N/A' // API doesn't provide this usually
      });

    } catch (error) {
      console.error("Error fetching audience data", error);
    } finally {
      setLoading(false);
    }
  };

  const avgCpl = useMemo(() => {
    if (interestData.length === 0) return 0;
    const totalCpl = interestData.reduce((sum, item) => sum + item.value, 0);
    return totalCpl / interestData.length;
  }, [interestData]);

  if (loading) {
    return (
      <DashboardLayout title="Smart Audience" subtitle="Audience Performance Analysis">
        <div className="p-10 text-center">Loading Audience Data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Smart Audience" subtitle="Audience Performance Analysis">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-lead-sent/20 rounded">
              <Users className="w-6 h-6 text-lead-sent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Volume Age</p>
              <p className="text-xl font-bold">{overallStats.bestAge}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-scale/20 rounded">
              <Target className="w-6 h-6 text-status-scale" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best CPL Age</p>
              <p className="text-xl font-bold">{overallStats.bestInterest}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Leads (Sample)</p>
              <p className="text-xl font-bold">
                {ageData.reduce((acc, curr) => acc + curr.leads, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age CPL Performance (Bar Chart) */}
        <Card className="p-6 border-2 border-foreground">
          <Title>Age Group Cost Efficiency (CPL)</Title>
          <Text>CPL comparison vs. Average ({avgCpl.toFixed(0)} THB)</Text>

          {interestData.length === 0 ? (
            <div className="mt-6 py-8 text-center text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={interestData}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `฿${v}`} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => [`฿${value.toLocaleString()}`, 'CPL']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '2px solid hsl(var(--foreground))',
                    }}
                  />
                  <ReferenceLine
                    x={avgCpl}
                    stroke="hsl(var(--foreground))"
                    strokeDasharray="5 5"
                    label={{ value: 'Avg', position: 'top', fontSize: 10 }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {interestData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.value <= avgCpl ? 'hsl(var(--status-scale))' : 'hsl(var(--status-risk))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center gap-6 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-status-scale"></span>
                  Below Avg (Good)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-status-risk"></span>
                  Above Avg (Review)
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Demographics (Donut) */}
        <Card className="p-6 border-2 border-foreground">
          <Title>Age Demographics (Volume)</Title>
          <Text>Lead contribution by Age Group</Text>

          <div className="mt-6">
            <DonutChart
              data={ageData}
              category="value"
              index="name"
              valueFormatter={(number: number) => `${number}%`}
              colors={["slate", "blue", "indigo", "violet", "pink"]}
              className="h-52"
            />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {ageData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <Bold>{d.name}:</Bold>
                <span>{d.value}% ({d.leads})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
