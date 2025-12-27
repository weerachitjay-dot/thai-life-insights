import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

// ประกาศ Type ให้ Window รู้จัก FB SDK
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const FacebookConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. ตรวจสอบสถานะเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data } = await supabase
          .from('config_tokens')
          .select('id')
          .eq('provider', 'facebook')
          .single();

        if (data) setIsConnected(true);
      } catch (error) {
        console.error("Error checking connection:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  // 2. โหลด Facebook SDK (แก้จุดที่ Error แล้ว ✅)
  useEffect(() => {
    // สร้างฟังก์ชันภายใน ไม่ใส่ async หน้า useEffect
    const loadSdk = () => {
      if (window.FB) return; // ถ้ามีแล้วไม่ต้องโหลดซ้ำ

      window.fbAsyncInit = function () {
        window.FB.init({
          appId: '605018742544860',
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
      };

      // Load Script
      (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode?.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadSdk();
  }, []);

  // ฟังก์ชัน Login
  const handleLogin = () => {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded yet. Please refresh.");
      return;
    }

    setIsLoading(true);
    window.FB.login(function (response: any) {
      const processLogin = async () => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;

          // บันทึกลง Supabase
          const { error } = await supabase
            .from('config_tokens')
            .upsert({
              provider: 'facebook',
              access_token: accessToken,
              token_type: 'short_lived',
              updated_at: new Date().toISOString()
            }, { onConflict: 'provider' });

          if (error) {
            console.error("Supabase Error:", error);
            toast.error("Failed to save token.");
          } else {
            setIsConnected(true);
            toast.success("Facebook Connected Successfully!");
          }
        } else {
          toast.error("User cancelled login.");
        }
        setIsLoading(false);
      };

      processLogin();
    }, { scope: 'public_profile,email,ads_read,read_insights' });
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from('config_tokens')
      .delete()
      .eq('provider', 'facebook');

    if (!error) {
      setIsConnected(false);
      toast.success("Disconnected from Facebook.");
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          Meta Ads Platform
        </CardTitle>
        <CardDescription>
          Connect to sync ad performance data automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Button disabled className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        ) : isConnected ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">System Connected</span>
            </div>
            <Button variant="outline" onClick={handleDisconnect} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={handleLogin} className="w-full bg-[#1877F2] hover:bg-[#166fe5]">
            Connect with Facebook
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
