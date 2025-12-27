import { ReactNode } from 'react';
import { format } from 'date-fns';
import { AppSidebar } from './AppSidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, RefreshCw, Package } from 'lucide-react';
import { useFilter, products, accounts } from '@/contexts/FilterContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { account, setAccount, product, setProduct, dateRange, setDateRange } = useFilter();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-auto min-h-14 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div>
            <h1 className="font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Account Selector */}
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger className="w-36 border-border bg-card">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {accounts.map((acc) => (
                  <SelectItem key={acc.value} value={acc.value}>
                    {acc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Product Selector */}
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger className="w-52 border-border bg-card">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Product" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {products.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <span>{p.label}</span>
                      {p.category && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          p.category === 'Life' && 'bg-category-life/20 text-category-life',
                          p.category === 'Saving' && 'bg-category-saving/20 text-category-saving',
                          p.category === 'Health' && 'bg-category-health/20 text-category-health'
                        )}>
                          {p.category}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-border">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="font-mono text-xs">
                    {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Refresh */}
            <Button variant="outline" size="icon" className="border-border">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Active Filters Display */}
        {(product !== 'all' || account !== 'all') && (
          <div className="px-4 py-2 bg-secondary/50 border-b border-border flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Active Filters:</span>
            {account !== 'all' && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                {accounts.find(a => a.value === account)?.label}
              </span>
            )}
            {product !== 'all' && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                {product}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setAccount('all');
                setProduct('all');
              }}
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="h-10 border-t border-border bg-secondary/50 flex items-center justify-between px-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Last Updated: {format(new Date(), 'MMM d, yyyy HH:mm')}</span>
            <span>Data Source: Meta Ads API</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-scale"></span>
              Scale
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-hold"></span>
              Hold
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-risk"></span>
              Risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-kill"></span>
              Kill
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
