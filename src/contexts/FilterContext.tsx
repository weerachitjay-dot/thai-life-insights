
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface FilterOption {
  value: string;
  label: string;
  category?: ProductCategory;
}

interface FilterContextType {
  account: string;
  setAccount: (account: string) => void;
  product: string;
  setProduct: (product: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  products: FilterOption[]; // Now dynamic
  accounts: FilterOption[]; // Now dynamic (or at least passed via context)
  isLoadingConfig: boolean;
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

  const [productsList, setProductsList] = useState<FilterOption[]>([
    { value: 'all', label: 'All Products' }
  ]);
  const [accountsList, setAccountsList] = useState<FilterOption[]>([
    { value: 'all', label: 'All Accounts' },
    { value: 'Account A', label: 'Account A' }, // Placeholder default
    { value: 'Account B', label: 'Account B' }, // Placeholder default
  ]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Fetch Products and Accounts (if available) on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoadingConfig(true);

      // 1. Fetch Products from product_settings (or cycles)
      // product_settings is usually the source of truth for config
      const { data: productData, error: productError } = await supabase
        .from('product_settings')
        .select('product_code, product_name_th'); // product_name_th is the correct column

      if (productError) throw productError;

      if (productData) {
        const dynamicProducts: FilterOption[] = [
          { value: 'all', label: 'All Products' },
          ...productData.map(p => {
            // Infer category from code
            let category: ProductCategory = 'Other';
            if (p.product_code.startsWith('LIFE-')) category = 'Life';
            else if (p.product_code.startsWith('SAVING-')) category = 'Saving';
            else if (p.product_code.startsWith('HEALTH-')) category = 'Health';

            return {
              value: p.product_code,
              label: p.product_name_th || p.product_code,
              category
            };
          })
        ];
        setProductsList(dynamicProducts);
      }

      // 2. Fetch Accounts from facebook_tokens table
      const { data: accountsData, error: accError } = await (supabase as any)
        .from('facebook_tokens')
        .select('ad_account_id, account_name');

      if (accError) {
        console.error("Error fetching accounts:", accError);
      } else if (accountsData && accountsData.length > 0) {
        const dynamicAccounts: FilterOption[] = [
          { value: 'all', label: 'All Accounts' },
          ...accountsData.map((acc: any) => ({
            value: acc.ad_account_id,
            label: acc.account_name || acc.ad_account_id
          }))
        ];
        setAccountsList(dynamicAccounts);
      }

    } catch (error) {
      console.error("Error fetching filter config:", error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  return (
    <FilterContext.Provider value={{
      account,
      setAccount,
      product,
      setProduct,
      dateRange,
      setDateRange,
      products: productsList,
      accounts: accountsList,
      isLoadingConfig
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

// Previously exported 'products' and 'accounts' constants are removed/deprecated
// Components should use useFilter() to access them.
// But we need to keep the exports for DashboardLayout if it imports them directly?
// DashboardLayout imports them. We need to refactor DashboardLayout to use the context values.
// To avoid breaking changes immediately, we can export empty arrays but that might break UI.
// Better to NOT export them and fix DashboardLayout.
