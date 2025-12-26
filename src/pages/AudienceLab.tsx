import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@tremor/react';
import { Search, Sparkles, CheckCircle, Copy, Database } from 'lucide-react';
import { searchFacebookInterests } from '@/lib/interestService';

interface InterestResult {
  id: string;
  name: string;
  audience_size_upper_bound?: number;
  path?: string[];
}

export default function AudienceLab() {
  const [token, setToken] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InterestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!token) return alert("Please enter Access Token");
    setLoading(true);
    const data = await searchFacebookInterests(query, token);
    setResults(data);
    setLoading(false);
  };

  return (
    <DashboardLayout title="Audience Lab">
      <div className="space-y-6">
        {/* 1. Control Panel */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Facebook Access Token</label>
              <Input
                type="password"
                placeholder="Paste your token here..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Product Context (For AI)</label>
              <Input placeholder="e.g., Luxury Condo for Investment" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Search Interest</label>
              <Input
                placeholder="e.g., Golf, Property, Retirement..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Searching...' : 'Search FB'}
            </Button>
            <Button variant="default" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Brainstorm with AI
            </Button>
          </div>
        </Card>

        {/* Results Table Placeholder (when no results) */}
        {results.length === 0 && (
          <Card className="p-8 border-2 border-dashed border-border">
            <div className="flex flex-col items-center justify-center text-center">
              <Database className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Results Table</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Search for interests to see results here
              </p>
              <div className="mt-4 flex gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-secondary rounded">Interest Name</span>
                <span className="px-2 py-1 bg-secondary rounded">Audience Size</span>
                <span className="px-2 py-1 bg-secondary rounded">Path</span>
                <span className="px-2 py-1 bg-secondary rounded">Select</span>
              </div>
            </div>
          </Card>
        )}

        {/* 2. Results Table (Tremor Style) */}
        {results.length > 0 && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Found {results.length} Interests</h3>
              <Button variant="ghost" size="sm">
                <Copy className="w-4 h-4 mr-2" /> Copy All
              </Button>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Interest Name</TableHeaderCell>
                  <TableHeaderCell>Audience Size</TableHeaderCell>
                  <TableHeaderCell>Category Path</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Checkbox id={`interest-${item.id}`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.audience_size_upper_bound 
                        ? (item.audience_size_upper_bound / 1000000).toFixed(1) + 'M' 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {item.path ? item.path.join(' > ') : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        <CheckCircle className="w-3 h-3 mr-1" /> Select
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
