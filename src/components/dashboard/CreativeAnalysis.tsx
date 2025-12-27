import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const performanceData = [
  { name: 'Top Performers', value: 12, color: 'hsl(var(--status-scale))' },
  { name: 'Average', value: 25, color: 'hsl(var(--status-hold))' },
  { name: 'Under Review', value: 8, color: 'hsl(var(--status-risk))' },
  { name: 'Paused', value: 3, color: 'hsl(var(--muted))' },
];

const creativeTypes = [
  { type: 'Static Image', count: 24, avgCpl: 145 },
  { type: 'Carousel', count: 12, avgCpl: 168 },
  { type: 'Video 15s', count: 8, avgCpl: 132 },
  { type: 'Video 30s', count: 4, avgCpl: 189 },
];

export default function CreativeAnalysis() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Creative Performance Pie */}
      <div className="bg-card border-2 border-foreground shadow-md">
        <div className="p-4 border-b-2 border-foreground">
          <h3 className="text-lg font-bold uppercase tracking-wide">Creative Performance</h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '2px solid hsl(var(--foreground))',
                  borderRadius: 0,
                  fontFamily: 'Space Mono, monospace'
                }}
              />
              <Legend 
                wrapperStyle={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Creative Types Table */}
      <div className="bg-card border-2 border-foreground shadow-md">
        <div className="p-4 border-b-2 border-foreground">
          <h3 className="text-lg font-bold uppercase tracking-wide">Creative Type Analysis</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {creativeTypes.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 border-2 border-foreground bg-secondary/30 hover:bg-secondary/60 transition-colors"
              >
                <div>
                  <p className="font-bold">{item.type}</p>
                  <p className="text-sm text-muted-foreground">{item.count} active creatives</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-lg">฿{item.avgCpl}</p>
                  <p className="text-xs text-muted-foreground uppercase">Avg CPL</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
