import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Calendar as CalendarIcon, Save, RefreshCcw, Package, Plus, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProductCycle {
  id: string;
  product_name: string;
  cycle_name: string;
  delivery_start: string;
  delivery_end: string;
  target_partner: number;
  is_active: boolean;
}

interface NewCycleForm {
  product_name: string;
  cycle_name: string;
  delivery_start: Date | undefined;
  delivery_end: Date | undefined;
  target_partner: number;
}

const getDefaultCycleName = () => {
  const now = new Date();
  return format(now, 'MMM yyyy');
};

export function ProductCycleConfig() {
  const [cycles, setCycles] = useState<ProductCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedCycles, setEditedCycles] = useState<Record<string, Partial<ProductCycle>>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCycle, setNewCycle] = useState<NewCycleForm>({
    product_name: '',
    cycle_name: getDefaultCycleName(),
    delivery_start: undefined,
    delivery_end: undefined,
    target_partner: 0
  });
  const [isCreating, setIsCreating] = useState(false);

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
        .order('product_name');

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

  const handleSaveAll = async () => {
    const editedIds = Object.keys(editedCycles);
    if (editedIds.length === 0) return;

    setSaving(true);
    try {
      for (const id of editedIds) {
        const { error } = await supabase
          .from('product_cycles')
          .update({
            ...editedCycles[id],
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
      }

      toast({
        title: "All Changes Saved",
        description: `Updated ${editedIds.length} product cycle(s).`,
      });

      setEditedCycles({});
      fetchCycles();
    } catch (error) {
      console.error('Error saving cycles:', error);
      toast({
        title: "Error",
        description: "Failed to save some changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCycle = async () => {
    // Validation
    if (!newCycle.product_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!newCycle.delivery_start || !newCycle.delivery_end) {
      toast({
        title: "Validation Error",
        description: "Both delivery start and end dates are required.",
        variant: "destructive",
      });
      return;
    }

    if (newCycle.delivery_end < newCycle.delivery_start) {
      toast({
        title: "Validation Error",
        description: "Delivery end date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('product_cycles')
        .insert({
          product_name: newCycle.product_name.trim(),
          cycle_name: newCycle.cycle_name || getDefaultCycleName(),
          delivery_start: format(newCycle.delivery_start, 'yyyy-MM-dd'),
          delivery_end: format(newCycle.delivery_end, 'yyyy-MM-dd'),
          target_partner: newCycle.target_partner,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Product Cycle Created",
        description: `${newCycle.product_name} has been added successfully.`,
      });

      // Reset form
      setNewCycle({
        product_name: '',
        cycle_name: getDefaultCycleName(),
        delivery_start: undefined,
        delivery_end: undefined,
        target_partner: 0
      });
      setShowAddForm(false);
      fetchCycles();
    } catch (error: any) {
      console.error('Error creating cycle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create product cycle.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeactivate = async (cycleId: string, productName: string) => {
    try {
      const { error } = await supabase
        .from('product_cycles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', cycleId);

      if (error) throw error;

      toast({
        title: "Deactivated",
        description: `${productName} has been deactivated.`,
      });
      fetchCycles();
    } catch (error) {
      console.error('Error deactivating cycle:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate product cycle.",
        variant: "destructive",
      });
    }
  };

  const hasEdits = Object.keys(editedCycles).length > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Monthly Delivery Cycles</h2>
            <p className="text-sm text-muted-foreground">Configure delivery windows for accurate forecasting</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add Product'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCycles} disabled={loading}>
            <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          {hasEdits && (
            <Button size="sm" onClick={handleSaveAll} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save All'}
            </Button>
          )}
        </div>
      </div>

      {/* Add New Product Form */}
      <Collapsible open={showAddForm} onOpenChange={setShowAddForm}>
        <CollapsibleContent>
          <div className="mb-6 p-4 border border-border rounded-lg bg-secondary/30">
            <h3 className="font-semibold text-foreground mb-4">Add New Product Cycle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  placeholder="e.g., LIFE-SENIOR-GOLD"
                  value={newCycle.product_name}
                  onChange={(e) => setNewCycle(prev => ({ ...prev, product_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle-name">Cycle Name</Label>
                <Input
                  id="cycle-name"
                  placeholder="e.g., Jan 2026"
                  value={newCycle.cycle_name}
                  onChange={(e) => setNewCycle(prev => ({ ...prev, cycle_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Start *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newCycle.delivery_start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newCycle.delivery_start ? format(newCycle.delivery_start, "MMM dd, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newCycle.delivery_start}
                      onSelect={(date) => setNewCycle(prev => ({ ...prev, delivery_start: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Delivery End *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newCycle.delivery_end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newCycle.delivery_end ? format(newCycle.delivery_end, "MMM dd, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newCycle.delivery_end}
                      onSelect={(date) => setNewCycle(prev => ({ ...prev, delivery_end: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-partner">Target (Partner)</Label>
                <Input
                  id="target-partner"
                  type="number"
                  placeholder="0"
                  value={newCycle.target_partner}
                  onChange={(e) => setNewCycle(prev => ({ ...prev, target_partner: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCycle} disabled={isCreating} className="gap-2">
                <Plus className="w-4 h-4" />
                {isCreating ? 'Creating...' : 'Create Product Cycle'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              <TableHead className="font-bold">Product Name</TableHead>
              <TableHead className="font-bold">Cycle Name</TableHead>
              <TableHead className="font-bold">Delivery Start</TableHead>
              <TableHead className="font-bold">Delivery End</TableHead>
              <TableHead className="font-bold text-right">Target (Partner)</TableHead>
              <TableHead className="font-bold text-center">Action</TableHead>
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
                  No active product cycles found. Click "Add Product" to create one.
                </TableCell>
              </TableRow>
            ) : (
              cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium">{cycle.product_name}</TableCell>
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
                      value={getEditedValue(cycle, 'target_partner') as number}
                      onChange={(e) => handleFieldChange(cycle.id, 'target_partner', parseInt(e.target.value) || 0)}
                      className="w-24 h-8 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
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
                        onClick={() => handleDeactivate(cycle.id, cycle.product_name)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Deactivate"
                      >
                        <X className="w-3 h-3" />
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
