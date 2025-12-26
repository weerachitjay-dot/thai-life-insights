import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  DollarSign,
  Palette,
  Target,
  FlaskConical,
  BarChart3,
  Database,
  Building2,
} from 'lucide-react';

const executiveItems = [
  { title: 'Overview', url: '/', icon: LayoutDashboard, description: 'Control Tower' },
  { title: 'Cost & Profit', url: '/cost-profit', icon: DollarSign, description: 'ROI & Revenue' },
];

const optimizationItems = [
  { title: 'Creative Analysis', url: '/creative', icon: Palette, description: 'Win/Loss Analysis' },
  { title: 'Smart Audience', url: '/audience', icon: Target, description: 'Audience Performance' },
  { title: 'Optimization Lab', url: '/optimization', icon: FlaskConical, description: 'AI Suggestions' },
];

const adminItems = [
  { title: 'Leads Analysis', url: '/leads', icon: BarChart3, description: 'Funnel of Truth' },
  { title: 'Product Master', url: '/products', icon: Database, description: 'Source of Truth' },
];

export function AppSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Thai Life</h1>
            <p className="text-xs text-muted-foreground">Ads Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Executive View */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Executive View
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {executiveItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                        isActive(item.url)
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className={`text-xs ${isActive(item.url) ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {item.description}
                        </span>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Optimization View */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Optimization View
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {optimizationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                        isActive(item.url)
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className={`text-xs ${isActive(item.url) ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {item.description}
                        </span>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Data Integrity */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Data Integrity
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                        isActive(item.url)
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className={`text-xs ${isActive(item.url) ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {item.description}
                        </span>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>v1.0.0</span>
          <span>Last sync: 14:32</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
