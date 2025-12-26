import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Database, RefreshCcw, Settings, 
  CheckCircle, XCircle, Clock, LogOut, Upload, Cpu, Save
} from 'lucide-react';
import { FacebookConnect } from '@/components/admin/FacebookConnect';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const dataConnections = [
  { 
    name: 'Google Sheets (Leads)', 
    status: 'connected', 
    lastSync: '30 min ago',
    records: '3,245'
  },
  { 
    name: 'CRM Database', 
    status: 'pending', 
    lastSync: 'Never',
    records: '-'
  },
];

export default function DataManagement() {
  const navigate = useNavigate();
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasStoredKeys, setHasStoredKeys] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('isAdminAuthenticated');
    if (!isAuth) {
      navigate('/admin-login');
    }
    fetchExistingKeys();
  }, [navigate]);

  const fetchExistingKeys = async () => {
    const { data } = await supabase
      .from('config_tokens')
      .select('provider, access_token')
      .in('provider', ['groq', 'gemini']);

    if (data && data.length > 0) {
      setHasStoredKeys(true);
      data.forEach((row) => {
        if (row.provider === 'groq') setGroqKey(row.access_token);
        if (row.provider === 'gemini') setGeminiKey(row.access_token);
      });
    }
  };

  const handleSaveKeys = async () => {
    setIsSaving(true);
    try {
      const updates = [];
      
      if (groqKey) {
        updates.push({
          provider: 'groq',
          access_token: groqKey,
          token_type: 'api_key',
          updated_at: new Date().toISOString()
        });
      }
      
      if (geminiKey) {
        updates.push({
          provider: 'gemini',
          access_token: geminiKey,
          token_type: 'api_key',
          updated_at: new Date().toISOString()
        });
      }

      if (updates.length > 0) {
        const { error } = await supabase
          .from('config_tokens')
          .upsert(updates, { onConflict: 'provider' });

        if (error) throw error;
        
        setHasStoredKeys(true);
        toast({
          title: "AI Keys Updated",
          description: "Your API keys have been saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving keys:', error);
      toast({
        title: "Error",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    navigate('/admin-login');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="outline" className="text-green-600 border-green-600">Connected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-destructive border-destructive">Disconnected</Badge>;
    }
  };

  return (
    <DashboardLayout title="Data Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Data Management</h1>
            <p className="text-muted-foreground">Manage your data sources and API connections</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout Admin
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Connections</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Setup</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-foreground">15,695</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Facebook Connect */}
        <FacebookConnect />

        {/* AI Service Configuration */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">AI Service Configuration</h2>
              <p className="text-sm text-muted-foreground">Configure API keys for AI-powered features</p>
            </div>
            {hasStoredKeys && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configured
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="groq-key">Groq API Key</Label>
              <Input
                id="groq-key"
                type="password"
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Gemini API Key</Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSaveKeys} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Keys'}
          </Button>
        </Card>

        {/* Other Connections Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Other Data Connections</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCcw className="w-4 h-4" />
                Sync All
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {dataConnections.map((conn, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(conn.status)}
                  <div>
                    <p className="font-medium text-foreground">{conn.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last sync: {conn.lastSync} • Records: {conn.records}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(conn.status)}
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

