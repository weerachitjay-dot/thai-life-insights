import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar as CalendarIcon, Save, RefreshCcw, Package, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProductCycle {
  id: string;
  product_code: string;
  cycle_name: string;
  delivery_start: string;
  delivery_end: string;
  target_leads: number;
  is_active: boolean;
}

export function ProductCycleConfig() {
  const [cycles, setCycles] = useState<ProductCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedCycles, setEditedCycles] = useState<Record<string, Partial<ProductCycle>>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<ProductCycle | null>(null);
  const [newCycle, setNewCycle] = useState({
    product_code: '',
    cycle_name: '',
    delivery_start: new Date(),
    delivery_end: new Date(),
    target_leads: 0
  });

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_cycles')
        .select('*')
        .eq('is_active', true)
        .order('product_code');

      if (error) throw error;
      setCycles(data || []);
      setEditedCycles({});
    } catch (error) {
      console.error('Error fetching cycles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch product cycles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (id: string, field: keyof ProductCycle, value: string | number | Date) => {
    setEditedCycles(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value instanceof Date ? format(value, 'yyyy-MM-dd') : value
      }
    }));
  };

  const getEditedValue = (cycle: ProductCycle, field: keyof ProductCycle) => {
    return editedCycles[cycle.id]?.[field] ?? cycle[field];
  };

  const handleSave = async (cycleId: string) => {
    const edits = editedCycles[cycleId];
    if (!edits) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('product_cycles')
        .update({
          ...edits,
          updated_at: new Date().toISOString()
        })
        .eq('id', cycleId);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Product cycle updated successfully.",
      });

      setEditedCycles(prev => {
        const updated = { ...prev };
        delete updated[cycleId];
        return updated;
      });
      fetchCycles();
    } catch (error) {
      console.error('Error saving cycle:', error);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async () => {
    if (!newCycle.product_code || !newCycle.cycle_name) {
      toast({
        title: "Validation Error",
        description: "Product code and cycle name are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('product_cycles')
        .insert({
          product_code: newCycle.product_code,
          cycle_name: newCycle.cycle_name,
          delivery_start: format(newCycle.delivery_start, 'yyyy-MM-dd'),
          delivery_end: format(newCycle.delivery_end, 'yyyy-MM-dd'),
          target_leads: newCycle.target_leads,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New product cycle added successfully.",
      });

      setShowAddDialog(false);
      setNewCycle({
        product_code: '',
        cycle_name: '',
        delivery_start: new Date(),
        delivery_end: new Date(),
        target_leads: 0
      });
      fetchCycles();
    } catch (error) {
      console.error('Error adding cycle:', error);
      toast({
        title: "Error",
        description: "Failed to add new cycle.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (cycle: ProductCycle) => {
    setCycleToDelete(cycle);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cycleToDelete) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('product_cycles')
        .delete()
        .eq('id', cycleToDelete.id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: `Cycle "${cycleToDelete.cycle_name}" deleted successfully.`,
      });

      setDeleteDialogOpen(false);
      setCycleToDelete(null);
      fetchCycles();
    } catch (error) {
      console.error('Error deleting cycle:', error);
      toast({
        title: "Error",
        description: "Failed to delete cycle.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasEdits = Object.keys(editedCycles).length > 0;

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Product Delivery Cycles (Current Month)</h2>
              <p className="text-sm text-muted-foreground">Configure delivery windows for accurate forecasting</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Cycle
            </Button>
            <Button variant="outline" size="sm" onClick={fetchCycles} disabled={loading}>
              <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead className="font-bold">Product Name</TableHead>
                <TableHead className="font-bold">Cycle Name</TableHead>
                <TableHead className="font-bold">Delivery Start</TableHead>
                <TableHead className="font-bold">Delivery End</TableHead>
                <TableHead className="font-bold text-right">Target (Leads)</TableHead>
                <TableHead className="font-bold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading cycles...
                  </TableCell>
                </TableRow>
              ) : cycles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No active product cycles found
                  </TableCell>
                </TableRow>
              ) : (
                cycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">{cycle.product_code}</TableCell>
                    <TableCell>
                      <Input
                        value={getEditedValue(cycle, 'cycle_name') as string}
                        onChange={(e) => handleFieldChange(cycle.id, 'cycle_name', e.target.value)}
                        className="w-28 h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <DatePickerCell
                        value={getEditedValue(cycle, 'delivery_start') as string}
                        onChange={(date) => handleFieldChange(cycle.id, 'delivery_start', date)}
                      />
                    </TableCell>
                    <TableCell>
                      <DatePickerCell
                        value={getEditedValue(cycle, 'delivery_end') as string}
                        onChange={(date) => handleFieldChange(cycle.id, 'delivery_end', date)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={getEditedValue(cycle, 'target_leads') as number}
                        onChange={(e) => handleFieldChange(cycle.id, 'target_leads', parseInt(e.target.value) || 0)}
                        className="w-24 h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {editedCycles[cycle.id] && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSave(cycle.id)}
                            disabled={saving}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(cycle)}
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add New Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product Cycle</DialogTitle>
            <DialogDescription>
              Create a new delivery cycle for a product
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product-code">Product Code *</Label>
              <Input
                id="product-code"
                value={newCycle.product_code}
                onChange={(e) => setNewCycle({ ...newCycle, product_code: e.target.value })}
                placeholder="e.g., LIFE-SENIOR-MORRADOK"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cycle-name">Cycle Name *</Label>
              <Input
                id="cycle-name"
                value={newCycle.cycle_name}
                onChange={(e) => setNewCycle({ ...newCycle, cycle_name: e.target.value })}
                placeholder="e.g., December 2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Delivery Start</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newCycle.delivery_start, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newCycle.delivery_start}
                      onSelect={(d) => d && setNewCycle({ ...newCycle, delivery_start: d })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Delivery End</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newCycle.delivery_end, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newCycle.delivery_end}
                      onSelect={(d) => d && setNewCycle({ ...newCycle, delivery_end: d })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target-leads">Target Leads</Label>
              <Input
                id="target-leads"
                type="number"
                value={newCycle.target_leads}
                onChange={(e) => setNewCycle({ ...newCycle, target_leads: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNew} disabled={saving}>
              {saving ? 'Adding...' : 'Add Cycle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the cycle "{cycleToDelete?.cycle_name}" for {cycleToDelete?.product_code}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface DatePickerCellProps {
  value: string;
  onChange: (date: Date) => void;
}

function DatePickerCell({ value, onChange }: DatePickerCellProps) {
  const date = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-32 h-8 justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {date ? format(date, "MMM dd, yyyy") : "Pick date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onChange(d)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
