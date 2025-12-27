import { createContext, useContext, useState, ReactNode } from 'react';

export interface DateRange {
  from: Date;
  to: Date;
}

interface FilterContextType {
  account: string;
  setAccount: (account: string) => void;
  product: string;
  setProduct: (product: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Default date range: MTD (Month to Date)
const getDefaultDateRange = (): DateRange => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  };
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState('all');
  const [product, setProduct] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  return (
    <FilterContext.Provider value={{
      account,
      setAccount,
      product,
      setProduct,
      dateRange,
      setDateRange,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}

// รายชื่อ Product ทั้งหมด (export เพื่อใช้ที่อื่น)
export const products = [
  { value: 'all', label: 'All Products', category: undefined },
  { value: 'LIFE-SENIOR-MORRADOK', label: 'LIFE-SENIOR-MORRADOK', category: 'Life' as const },
  { value: 'SAVING-RETIRE-GOLD', label: 'SAVING-RETIRE-GOLD', category: 'Saving' as const },
  { value: 'HEALTH-PLUS-PREMIUM', label: 'HEALTH-PLUS-PREMIUM', category: 'Health' as const },
  { value: 'LIFE-PROTECT-FAMILY', label: 'LIFE-PROTECT-FAMILY', category: 'Life' as const },
  { value: 'SAVING-EDU-FUTURE', label: 'SAVING-EDU-FUTURE', category: 'Saving' as const },
  { value: 'HEALTH-CRITICAL-CARE', label: 'HEALTH-CRITICAL-CARE', category: 'Health' as const },
];

export const accounts = [
  { value: 'all', label: 'All Accounts' },
  { value: 'a', label: 'Account A' },
  { value: 'b', label: 'Account B' },
];
