import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="border border-border hover:bg-secondary" />
              <div>
                <h1 className="font-bold text-foreground">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Account Selector */}
              <Select defaultValue="all">
                <SelectTrigger className="w-40 border-border">
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="a">Account A</SelectItem>
                  <SelectItem value="b">Account B</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Button variant="outline" size="sm" className="gap-2 border-border">
                <Calendar className="w-4 h-4" />
                <span className="font-mono text-xs">MTD: Dec 1-26</span>
              </Button>

              {/* Refresh */}
              <Button variant="outline" size="icon" className="border-border">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="h-10 border-t border-border bg-secondary/50 flex items-center justify-between px-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Last Updated: Dec 26, 2025 14:32</span>
              <span>Data Source: Meta Ads API</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-status-scale"></span>
                Scale
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-status-hold"></span>
                Hold
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-status-risk"></span>
                Risk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-status-kill"></span>
                Kill
              </span>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
