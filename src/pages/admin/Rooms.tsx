import { useState } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { useTenants } from '@/hooks/useTenants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Users, DoorOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { Room } from '@/types';

export default function RoomsPage() {
  const { rooms, loading, addRoom, updateRoom } = useRooms();
  const { tenants } = useTenants();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    monthlyRent: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({ roomNumber: '', monthlyRent: '', description: '' });
    setEditingRoom(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      monthlyRent: room.monthlyRent.toString(),
      description: room.description || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, {
          roomNumber: formData.roomNumber,
          monthlyRent: parseFloat(formData.monthlyRent),
          description: formData.description,
        });
        toast.success('Room updated successfully');
      } else {
        await addRoom({
          roomNumber: formData.roomNumber,
          monthlyRent: parseFloat(formData.monthlyRent),
          status: 'vacant',
          maxOccupants: 2,
          currentTenantIds: [],
          description: formData.description,
        });
        toast.success('Room added successfully');
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save room');
    }
  };

  const getRoomTenants = (room: Room) => {
    return tenants.filter((t) => room.currentTenantIds?.includes(t.id));
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Manage your rental rooms
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
                <DialogDescription>
                  {editingRoom ? 'Update room details' : 'Create a new room for tenants'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">Room Name</Label>
                  <Input
                    id="roomNumber"
                    placeholder="e.g., Room 1"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent (₱)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 3500"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Room details, amenities, etc."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRoom ? 'Update' : 'Add Room'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Room Grid */}
      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DoorOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No rooms yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add your first room to get started
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const roomTenants = getRoomTenants(room);
            return (
              <Card
                key={room.id}
                className="relative overflow-hidden transition-all duration-200 hover:shadow-lg"
              >
                {/* Status indicator strip */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    room.status === 'occupied'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-amber-400 to-orange-400'
                  }`}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{room.roomNumber}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={room.status === 'occupied' ? 'default' : 'secondary'}
                        className={
                          room.status === 'occupied'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }
                      >
                        {room.status === 'occupied' ? 'Occupied' : 'Vacant'}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(room)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Rent</span>
                    <span className="font-semibold text-lg">
                      ₱{room.monthlyRent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Occupants</span>
                    <span>{room.maxOccupants || 2} persons</span>
                  </div>
                  {roomTenants.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Tenants
                      </div>
                      {roomTenants.map((t) => (
                        <div key={t.id} className="text-sm font-medium pl-5">
                          {t.displayName}
                        </div>
                      ))}
                    </div>
                  )}
                  {room.description && (
                    <p className="text-xs text-muted-foreground pt-1">{room.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
