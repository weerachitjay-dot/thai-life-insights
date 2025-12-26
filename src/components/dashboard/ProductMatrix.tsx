import { ProductMatrixRow } from '@/types';
import { formatCurrency } from '@/lib/campaignParser';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductMatrixProps {
  data: ProductMatrixRow[];
}

export default function ProductMatrix({ data }: ProductMatrixProps) {
  return (
    <div className="bg-card border-2 border-foreground shadow-md">
      <div className="flex justify-between items-center p-4 border-b-2 border-foreground">
        <h3 className="text-lg font-bold uppercase tracking-wide">Product × Objective Matrix</h3>
        <span className="px-3 py-1 text-xs font-bold uppercase bg-secondary border-2 border-foreground">
          Decision Support System
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-foreground bg-secondary">
              <TableHead className="font-bold uppercase">Product</TableHead>
              <TableHead className="font-bold uppercase">Category</TableHead>
              <TableHead className="font-bold uppercase text-center">Lead Gen (CPL)</TableHead>
              <TableHead className="font-bold uppercase text-center">Conversion (CPL)</TableHead>
              <TableHead className="font-bold uppercase text-center">Messages (CPL)</TableHead>
              <TableHead className="font-bold uppercase">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="border-b border-foreground/20 hover:bg-secondary/50 transition-colors">
                <TableCell className="font-mono font-medium">{row.product}</TableCell>
                <TableCell><CategoryBadge category={row.category} /></TableCell>
                
                <TableCell className="text-center">
                  {row.leadGen ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono font-bold">{formatCurrency(row.leadGen.cpl)}</span>
                      <StatusBadge status={row.leadGen.status} size="sm" />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-center">
                  {row.conversion ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono font-bold">{formatCurrency(row.conversion.cpl)}</span>
                      <StatusBadge status={row.conversion.status} size="sm" />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-center">
                  {row.messages ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono font-bold">{formatCurrency(row.messages.cpl)}</span>
                      <StatusBadge status={row.messages.status} size="sm" />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  <span className={`font-bold ${
                    row.action.includes('Boost') ? 'text-status-scale' : 
                    row.action.includes('Review') ? 'text-status-hold' : 
                    row.action.includes('Stop') ? 'text-status-kill' : 'text-foreground'
                  }`}>
                    {row.action}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
