import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, DollarSign, 
  Palette, Users, FlaskConical, 
  BarChart2, Database,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    title: 'Executive View',
    items: [
      { name: 'Overview', href: '/', icon: LayoutDashboard },
      { name: 'Cost & Profit', href: '/cost-profit', icon: DollarSign },
    ],
  },
  {
    title: 'Optimization',
    items: [
      { name: 'Creative Analysis', href: '/creative', icon: Palette },
      { name: 'Smart Audience', href: '/audience', icon: Users },
      { name: 'Optimization Lab', href: '/optimization', icon: FlaskConical },
    ],
  },
  {
    title: 'Data Integrity',
    items: [
      { name: 'Leads Analysis', href: '/leads', icon: BarChart2 },
      { name: 'Product Master', href: '/products', icon: Database },
    ],
  },
];

export function AppSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 bg-primary flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-foreground">Thai Life Ads</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground flex justify-between">
        <span>v1.0.0</span>
        <span>Last sync: 14:32</span>
      </div>
    </aside>
  );
}
