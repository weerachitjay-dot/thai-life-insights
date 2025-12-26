import { ProductCategory } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: ProductCategory;
}

const categoryConfig: Record<ProductCategory, { label: string; className: string }> = {
  Life: { 
    label: 'Life', 
    className: 'bg-category-life text-category-life-foreground' 
  },
  Saving: { 
    label: 'Saving', 
    className: 'bg-category-saving text-category-saving-foreground' 
  },
  Health: { 
    label: 'Health', 
    className: 'bg-category-health text-category-health-foreground' 
  },
  Other: { 
    label: 'Other', 
    className: 'bg-muted text-muted-foreground' 
  }
};

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  
  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center px-3 py-1 text-xs font-bold uppercase border-2 border-foreground',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
