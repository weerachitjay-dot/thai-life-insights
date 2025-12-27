import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProductSetting } from '@/types';
import { Pencil, Save, X, DollarSign, User, Target } from 'lucide-react';

export function ProductSettingsTable() {
    const [products, setProducts] = useState<ProductSetting[]>([]);
    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ProductSetting>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('product_settings')
                .select('*')
                .order('product_code');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching product settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load product settings.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: ProductSetting) => {
        setEditingCode(product.product_code);
        setEditForm(product);
    };

    const handleCancel = () => {
        setEditingCode(null);
        setEditForm({});
    };

    const handleSave = async (code: string) => {
        try {
            const { error } = await supabase
                .from('product_settings')
                .update({
                    sell_price: editForm.sell_price,
                    owner_name: editForm.owner_name,
                    target_cpl: editForm.target_cpl
                })
                .eq('product_code', code);

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Product settings updated successfully.',
            });

            // Update local state
            setProducts(products.map(p => p.product_code === code ? { ...p, ...editForm } as ProductSetting : p));
            setEditingCode(null);
        } catch (error) {
            console.error('Error updating product settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to update product settings.',
                variant: 'destructive',
            });
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <Card className="p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Product Financials & Config</h2>
                    <p className="text-sm text-muted-foreground">Manage sell prices, owners, and CPL targets</p>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product Code</TableHead>
                        <TableHead>Sell Price (THB)</TableHead>
                        <TableHead>Target CPL (THB)</TableHead>
                        <TableHead>Owner Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.product_code}>
                            <TableCell className="font-medium">{product.product_code}</TableCell>

                            <TableCell>
                                {editingCode === product.product_code ? (
                                    <Input
                                        type="number"
                                        value={editForm.sell_price || 0}
                                        onChange={(e) => setEditForm({ ...editForm, sell_price: parseFloat(e.target.value) })}
                                        className="w-32"
                                    />
                                ) : (
                                    `฿${product.sell_price.toLocaleString()}`
                                )}
                            </TableCell>

                            <TableCell>
                                {editingCode === product.product_code ? (
                                    <Input
                                        type="number"
                                        value={editForm.target_cpl || 0}
                                        onChange={(e) => setEditForm({ ...editForm, target_cpl: parseFloat(e.target.value) })}
                                        className="w-32"
                                    />
                                ) : (
                                    `฿${product.target_cpl?.toLocaleString() || '-'}`
                                )}
                            </TableCell>

                            <TableCell>
                                {editingCode === product.product_code ? (
                                    <Input
                                        value={editForm.owner_name || ''}
                                        onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                                        className="w-40"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        {product.owner_name || 'Unassigned'}
                                    </div>
                                )}
                            </TableCell>

                            <TableCell className="text-right">
                                {editingCode === product.product_code ? (
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleSave(product.product_code)}>
                                            <Save className="w-4 h-4 text-green-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={handleCancel}>
                                            <X className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                        <Pencil className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
