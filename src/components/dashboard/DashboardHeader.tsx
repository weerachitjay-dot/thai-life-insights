import { BarChart3, Settings, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardHeader() {
  return (
    <header className="bg-card border-b-2 border-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary text-primary-foreground border-2 border-foreground shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">Thai Life Performance</h1>
              <p className="text-sm text-muted-foreground">AI-Driven Ad Analysis & Decision Support</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="border-2 border-foreground">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="border-2 border-foreground">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="ml-4 flex items-center gap-3 pl-4 border-l-2 border-foreground">
              <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center font-bold border-2 border-foreground">
                TL
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold">Admin User</p>
                <p className="text-xs text-muted-foreground">Marketing Team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
