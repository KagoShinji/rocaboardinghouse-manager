import { useState } from 'react';
import { useTenants } from '@/hooks/useTenants';
import { useRooms } from '@/hooks/useRooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Users, Edit } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import type { UserProfile } from '@/types';

export default function TenantsPage() {
  const { tenants, loading, addTenant, updateTenant } = useTenants();
  const { rooms, updateRoom } = useRooms();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    phone: '',
    roomId: '',
  });

  const resetForm = () => {
    setFormData({ displayName: '', email: '', password: '', phone: '', roomId: '' });
    setEditingTenant(null);
  };

  const openEditDialog = (tenant: UserProfile) => {
    setEditingTenant(tenant);
    setFormData({
      displayName: tenant.displayName,
      email: tenant.email,
      password: '',
      phone: tenant.phone || '',
      roomId: tenant.roomId || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTenant) {
        // Update tenant profile
        const updates: Partial<UserProfile> = {
          displayName: formData.displayName,
          phone: formData.phone,
          roomId: formData.roomId || null,
        };
        await updateTenant(editingTenant.id, updates);

        // Update room assignment if changed
        if (formData.roomId !== editingTenant.roomId) {
          // Remove from old room
          if (editingTenant.roomId) {
            const oldRoom = rooms.find((r) => r.id === editingTenant.roomId);
            if (oldRoom) {
              const updatedTenantIds = (oldRoom.currentTenantIds || []).filter(
                (id) => id !== editingTenant.id
              );
              await updateRoom(oldRoom.id, {
                currentTenantIds: updatedTenantIds,
                status: updatedTenantIds.length === 0 ? 'vacant' : 'occupied',
              });
            }
          }
          // Add to new room
          if (formData.roomId) {
            const newRoom = rooms.find((r) => r.id === formData.roomId);
            if (newRoom) {
              const updatedTenantIds = [...(newRoom.currentTenantIds || []), editingTenant.id];
              await updateRoom(newRoom.id, {
                currentTenantIds: updatedTenantIds,
                status: 'occupied',
              });
            }
          }
        }

        toast.success('Tenant updated successfully');
      } else {
        // Add new tenant
        const tenantId = await addTenant(formData.email, formData.password, {
          displayName: formData.displayName,
          phone: formData.phone,
          roomId: formData.roomId || null,
          moveInDate: Timestamp.now(),
          isActive: true,
        });

        // Assign to room
        if (formData.roomId && tenantId) {
          const room = rooms.find((r) => r.id === formData.roomId);
          if (room) {
            await updateRoom(room.id, {
              currentTenantIds: [...(room.currentTenantIds || []), tenantId],
              status: 'occupied',
            });
          }
        }

        toast.success('Tenant added successfully');
      }
      setDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save tenant';
      toast.error(message);
    }
  };

  const toggleTenantStatus = async (tenant: UserProfile) => {
    await updateTenant(tenant.id, { isActive: !tenant.isActive });
    toast.success(`Tenant ${tenant.isActive ? 'deactivated' : 'activated'}`);
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableRooms = rooms.filter(
    (r) => r.status === 'vacant' || (r.currentTenantIds || []).length < (r.maxOccupants || 2)
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-1">
            Manage tenant accounts and room assignments
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
                <DialogDescription>
                  {editingTenant
                    ? 'Update tenant information'
                    : 'Create a new tenant account with login credentials'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Juan Dela Cruz"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>
                {!editingTenant && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tenant@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="09XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomId">Assign Room</Label>
                  <Select
                    value={formData.roomId}
                    onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.roomNumber} — ₱{room.monthlyRent.toLocaleString()}
                        </SelectItem>
                      ))}
                      {editingTenant?.roomId && (
                        <SelectItem value={editingTenant.roomId}>
                          {rooms.find((r) => r.id === editingTenant.roomId)?.roomNumber || 'Current Room'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTenant ? 'Update' : 'Add Tenant'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tenants Table */}
      {filteredTenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {searchQuery ? 'No tenants found' : 'No tenants yet'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'Try a different search term' : 'Add your first tenant to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => {
                  const room = rooms.find((r) => r.id === tenant.roomId);
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.displayName}</TableCell>
                      <TableCell className="text-muted-foreground">{tenant.email}</TableCell>
                      <TableCell>{tenant.phone || '—'}</TableCell>
                      <TableCell>
                        {room ? (
                          <Badge variant="outline">{room.roomNumber}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tenant.isActive ? 'default' : 'secondary'}
                          className={
                            tenant.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : ''
                          }
                        >
                          {tenant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(tenant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTenantStatus(tenant)}
                          >
                            {tenant.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
