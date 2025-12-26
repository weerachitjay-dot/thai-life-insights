import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'LIFE-SENIOR', form: 450, web: 120, messenger: 80 },
  { name: 'SAVING-RETIRE', form: 380, web: 200, messenger: 45 },
  { name: 'HEALTH-PLUS', form: 290, web: 150, messenger: 110 },
  { name: 'LIFE-PROTECT', form: 520, web: 180, messenger: 60 },
  { name: 'SAVING-EDU', form: 340, web: 90, messenger: 70 },
];

export default function LeadQualityChart() {
  return (
    <div className="bg-card border-2 border-foreground shadow-md">
      <div className="flex justify-between items-center p-4 border-b-2 border-foreground">
        <h3 className="text-lg font-bold uppercase tracking-wide">Lead Source Analysis</h3>
        <span className="px-3 py-1 text-xs font-bold uppercase bg-secondary border-2 border-foreground">
          Form vs Web vs Messenger
        </span>
      </div>
      
      <div className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
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
            <Bar dataKey="form" stackId="a" fill="hsl(var(--chart-1))" name="Form" />
            <Bar dataKey="web" stackId="a" fill="hsl(var(--chart-2))" name="Web" />
            <Bar dataKey="messenger" stackId="a" fill="hsl(var(--chart-3))" name="Messenger" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
