import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { BarList, DonutChart, Title, Text, Bold, Flex } from '@tremor/react';
import { Users, Target, Zap } from 'lucide-react';
import { useFilter } from '@/contexts/FilterContext';

// Mock Data: จำลองสิ่งที่ Antigravity จะดึงมาได้จาก Phase 2
const allInterestPerformance = [
  { name: 'Luxury vehicle', value: 145, products: ['LIFE-SENIOR-MORRADOK', 'LIFE-PROTECT-FAMILY'] },
  { name: 'Investment', value: 168, products: ['SAVING-RETIRE-GOLD', 'SAVING-EDU-FUTURE'] },
  { name: 'Golf', value: 189, products: ['LIFE-SENIOR-MORRADOK'] },
  { name: 'Real Estate', value: 210, products: ['SAVING-RETIRE-GOLD', 'LIFE-PROTECT-FAMILY'] },
  { name: 'Insurance', value: 245, products: ['HEALTH-PLUS-PREMIUM', 'HEALTH-CRITICAL-CARE'] },
  { name: 'Retirement', value: 280, products: ['SAVING-RETIRE-GOLD', 'LIFE-SENIOR-MORRADOK'] },
];

const ageDemographics = [
  { name: '25-34', value: 15 },
  { name: '35-44', value: 45 },
  { name: '45-54', value: 30 },
  { name: '55+', value: 10 },
];

export default function AudiencePage() {
  const { product } = useFilter();

  // Filter interest data based on selected product
  const interestPerformance = useMemo(() => {
    if (product === 'all') return allInterestPerformance;
    return allInterestPerformance.filter(item => item.products.includes(product));
  }, [product]);

  // Find best interest
  const bestInterest = useMemo(() => {
    if (interestPerformance.length === 0) return 'N/A';
    return interestPerformance.reduce((best, current) => 
      current.value < best.value ? current : best
    ).name;
  }, [interestPerformance]);

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
              <p className="text-sm text-muted-foreground">Best Age Range</p>
              <p className="text-xl font-bold">35-44 Years</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-scale/20 rounded">
              <Target className="w-6 h-6 text-status-scale" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Winner Interest</p>
              <p className="text-xl font-bold">{bestInterest}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potential Reach</p>
              <p className="text-xl font-bold">2.4M</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interest Performance (Bar List) */}
        <Card className="p-6 border-2 border-foreground">
          <Title>Interest Targeting Performance</Title>
          <Text>Comparing cost efficiency across targeting groups</Text>
          
          {interestPerformance.length === 0 ? (
            <div className="mt-6 py-8 text-center text-muted-foreground">
              No interest data for selected product
            </div>
          ) : (
            <div className="mt-6">
              <Flex className="mb-2">
                <Text><Bold>Interest Name</Bold></Text>
                <Text><Bold>CPL (THB)</Bold></Text>
              </Flex>
              <BarList
                data={interestPerformance.map(item => ({ name: item.name, value: item.value }))}
                className="mt-2"
                color="blue"
                valueFormatter={(number: number) => `฿${Intl.NumberFormat('us').format(number).toString()}`}
              />
            </div>
          )}
        </Card>

        {/* Demographics (Donut) */}
        <Card className="p-6 border-2 border-foreground">
          <Title>Age Demographics</Title>
          <Text>Lead contribution by Age Group</Text>
          
          <div className="mt-6">
            <DonutChart
              data={ageDemographics}
              category="value"
              index="name"
              valueFormatter={(number: number) => `${number}%`}
              colors={["slate", "blue", "indigo", "violet"]}
              className="h-52"
            />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {ageDemographics.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <Bold>{d.name}:</Bold>
                <span>{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
