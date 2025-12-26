import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Facebook, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Declare Facebook SDK types
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

interface TokenRecord {
  id: number;
  provider: string;
  access_token: string;
  token_type: string | null;
  updated_at: string;
}

export function FacebookConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const { toast } = useToast();

  // Load Facebook SDK
  useEffect(() => {
    if (window.FB) {
      setIsSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: 'YOUR_PLACEHOLDER_APP_ID', // Replace with your Facebook App ID
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
      setIsSdkLoaded(true);
    };

    // Load the SDK asynchronously
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('config_tokens')
        .select('*')
        .eq('provider', 'facebook')
        .maybeSingle();

      if (error) {
        console.error('Error checking connection status:', error);
        return;
      }

      if (data) {
        setIsConnected(true);
        setLastSynced(formatDate(data.updated_at));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const handleConnect = () => {
    if (!isSdkLoaded || !window.FB) {
      toast({
        title: 'SDK not loaded',
        description: 'Please wait for Facebook SDK to load and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    window.FB.login(
      async (response: any) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          
          try {
            const { error } = await supabase
              .from('config_tokens')
              .upsert(
                {
                  provider: 'facebook',
                  access_token: accessToken,
                  token_type: 'short_lived',
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'provider' }
              );

            if (error) {
              throw error;
            }

            setIsConnected(true);
            setLastSynced('Just now');
            toast({
              title: 'Connected successfully',
              description: 'Your Meta Ads account has been connected.',
            });
          } catch (err: any) {
            console.error('Error saving token:', err);
            toast({
              title: 'Connection failed',
              description: err.message || 'Failed to save access token.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Login cancelled',
            description: 'Facebook login was cancelled or failed.',
            variant: 'destructive',
          });
        }
        setIsLoading(false);
      },
      { scope: 'public_profile,email,ads_read,read_insights' }
    );
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('config_tokens')
        .delete()
        .eq('provider', 'facebook');

      if (error) {
        throw error;
      }

      setIsConnected(false);
      setLastSynced(null);
      toast({
        title: 'Disconnected',
        description: 'Meta Ads account has been disconnected.',
      });
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to disconnect.',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Facebook className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Meta Ads Platform</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected 
                ? `Last synced: ${lastSynced}` 
                : 'Connect to sync ad performance data.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
              <CheckCircle className="w-3 h-3" />
              Connected
            </Badge>
          )}
          
          {isConnected ? (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isLoading || !isSdkLoaded}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Connect with Facebook
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
