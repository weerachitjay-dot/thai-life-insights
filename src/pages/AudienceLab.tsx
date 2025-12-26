import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@tremor/react';
import { Search, Sparkles, CheckCircle, Copy, Database, AlertCircle, Settings } from 'lucide-react';
import { searchFacebookInterests } from '@/lib/interestService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InterestResult {
  id: string;
  name: string;
  audience_size_upper_bound?: number;
  path?: string[];
}

interface ApiCredentials {
  facebook?: string;
  groq?: string;
  gemini?: string;
}

export default function AudienceLab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InterestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<ApiCredentials>({});
  const [isConfigured, setIsConfigured] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('config_tokens')
        .select('provider, access_token')
        .in('provider', ['facebook', 'groq', 'gemini']);

      if (error) throw error;

      if (data && data.length > 0) {
        const creds: ApiCredentials = {};
        data.forEach((row) => {
          if (row.provider === 'facebook') creds.facebook = row.access_token;
          if (row.provider === 'groq') creds.groq = row.access_token;
          if (row.provider === 'gemini') creds.gemini = row.access_token;
        });
        setCredentials(creds);
        // Consider configured if at least Facebook + one AI service is available
        setIsConfigured(!!creds.facebook && (!!creds.groq || !!creds.gemini));
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleSearch = async () => {
    if (!credentials.facebook) {
      toast({
        title: "Facebook Token Missing",
        description: "Please configure Facebook access in Data Management.",
        variant: "destructive",
      });
      return;
    }
    
    if (!query.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search term.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await searchFacebookInterests(query, credentials.facebook);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search Facebook interests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBrainstorm = () => {
    if (!credentials.groq && !credentials.gemini) {
      toast({
        title: "AI Service Not Configured",
        description: "Please configure Groq or Gemini API keys in Data Management.",
        variant: "destructive",
      });
      return;
    }
    // AI brainstorm logic would go here
    toast({
      title: "AI Brainstorm",
      description: "AI brainstorming feature coming soon!",
    });
  };

  return (
    <DashboardLayout title="Audience Lab">
      <div className="space-y-6">
        {/* 1. Control Panel */}
        <Card className="p-6">
          {/* Status Indicator */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Audience Research</h2>
            {loadingCredentials ? (
              <Badge variant="outline" className="text-muted-foreground">
                Loading...
              </Badge>
            ) : isConfigured ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                System Connected (Meta + AI)
              </Badge>
            ) : (
              <Link to="/data-management">
                <Badge variant="outline" className="text-destructive border-destructive cursor-pointer hover:bg-destructive/10">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Configuration Missing
                  <Settings className="w-3 h-3 ml-1" />
                </Badge>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Product Context (For AI)</label>
              <Input placeholder="e.g., Luxury Condo for Investment" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Search Interest</label>
              <Input
                placeholder="e.g., Golf, Property, Retirement..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSearch} disabled={loading || !credentials.facebook}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Searching...' : 'Search FB'}
            </Button>
            <Button 
              variant="default" 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-2"
              onClick={handleBrainstorm}
              disabled={!credentials.groq && !credentials.gemini}
            >
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
