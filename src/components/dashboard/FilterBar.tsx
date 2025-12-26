import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FilterBar() {
  const [account, setAccount] = useState('all');
  const [dateRange, setDateRange] = useState('this-month');

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card border-2 border-foreground shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold uppercase tracking-wide">Account:</span>
        <Select value={account} onValueChange={setAccount}>
          <SelectTrigger className="w-40 border-2 border-foreground bg-background font-medium">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent className="border-2 border-foreground">
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="account-a">Account A</SelectItem>
            <SelectItem value="account-b">Account B</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-bold uppercase tracking-wide">Period:</span>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40 border-2 border-foreground bg-background font-medium">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="border-2 border-foreground">
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last-7">Last 7 Days</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" className="ml-auto border-2 border-foreground font-bold uppercase text-sm">
        <Calendar className="w-4 h-4 mr-2" />
        Custom Range
      </Button>
    </div>
  );
}
