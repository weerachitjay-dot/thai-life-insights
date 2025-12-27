import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProductSetting } from '@/types';
import { Pencil, Save, X, DollarSign, User, Target, Plus, Trash2 } from 'lucide-react';

export function ProductSettingsTable() {
    const [products, setProducts] = useState<ProductSetting[]>([]);
    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ProductSetting>>({});
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<ProductSetting | null>(null);
    const [newProduct, setNewProduct] = useState({
        product_code: '',
        sell_price: 0,
        target_cpl: 0,
        owner_name: ''
    });

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

    const handleAddNew = async () => {
        if (!newProduct.product_code) {
            toast({
                title: "Validation Error",
                description: "Product code is required.",
                variant: "destructive",
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('product_settings')
                .insert({
                    product_code: newProduct.product_code,
                    sell_price: newProduct.sell_price || 0,
                    target_cpl: newProduct.target_cpl || null,
                    owner_name: newProduct.owner_name || null
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: "New product added successfully.",
            });

            setShowAddDialog(false);
            setNewProduct({
                product_code: '',
                sell_price: 0,
                target_cpl: 0,
                owner_name: ''
            });
            fetchProducts();
        } catch (error: any) {
            console.error('Error adding product:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to add new product.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteClick = (product: ProductSetting) => {
        setProductToDelete(product);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;

        try {
            const { error } = await supabase
                .from('product_settings')
                .delete()
                .eq('product_code', productToDelete.product_code);

            if (error) throw error;

            toast({
                title: "Deleted",
                description: `Product "${productToDelete.product_code}" deleted successfully.`,
            });

            setDeleteDialogOpen(false);
            setProductToDelete(null);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast({
                title: "Error",
                description: "Failed to delete product.",
                variant: "destructive",
            });
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <>
            <Card className="p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Product Financials & Config</h2>
                            <p className="text-sm text-muted-foreground">Manage sell prices, owners, and CPL targets</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                    </Button>
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
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                                <Pencil className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Add New Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                            Create a new product configuration
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="new-product-code">Product Code *</Label>
                            <Input
                                id="new-product-code"
                                value={newProduct.product_code}
                                onChange={(e) => setNewProduct({ ...newProduct, product_code: e.target.value })}
                                placeholder="e.g., LIFE-SENIOR-MORRADOK"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-sell-price">Sell Price (THB)</Label>
                            <Input
                                id="new-sell-price"
                                type="number"
                                value={newProduct.sell_price}
                                onChange={(e) => setNewProduct({ ...newProduct, sell_price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-target-cpl">Target CPL (THB)</Label>
                            <Input
                                id="new-target-cpl"
                                type="number"
                                value={newProduct.target_cpl}
                                onChange={(e) => setNewProduct({ ...newProduct, target_cpl: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-owner">Owner Name</Label>
                            <Input
                                id="new-owner"
                                value={newProduct.owner_name}
                                onChange={(e) => setNewProduct({ ...newProduct, owner_name: e.target.value })}
                                placeholder="e.g., John Doe"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddNew}>
                            Add Product
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
                            This will permanently delete the product "{productToDelete?.product_code}".
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
