import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Trash2, Edit, UserPlus, UserMinus } from 'lucide-react';

interface UserList {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  createdById: number;
  memberCount?: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
}

interface UserListMember {
  id: number;
  listId: number;
  userId: number;
  addedById: number;
  createdAt: string;
  user: User;
}

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Blue', class: 'bg-blue-500' },
  { value: '#10b981', label: 'Green', class: 'bg-green-500' },
  { value: '#f59e0b', label: 'Yellow', class: 'bg-yellow-500' },
  { value: '#ef4444', label: 'Red', class: 'bg-red-500' },
  { value: '#8b5cf6', label: 'Purple', class: 'bg-purple-500' },
  { value: '#f97316', label: 'Orange', class: 'bg-orange-500' },
  { value: '#06b6d4', label: 'Cyan', class: 'bg-cyan-500' },
  { value: '#84cc16', label: 'Lime', class: 'bg-lime-500' },
];

export default function UserListManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedList, setSelectedList] = useState<UserList | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddUsersDialogOpen, setIsAddUsersDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  const [newListForm, setNewListForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  // Fetch user lists
  const { data: userLists, isLoading: listsLoading } = useQuery({
    queryKey: ['/api/admin/crm/user-lists'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/crm/user-lists');
      return response.json();
    }
  });

  // Fetch all users for adding to lists
  const { data: allUsers } = useQuery({
    queryKey: ['/api/admin/crm/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/crm/users');
      return response.json();
    }
  });

  // Fetch list members for selected list
  const { data: listMembers } = useQuery({
    queryKey: ['/api/admin/crm/user-lists', selectedList?.id, 'members'],
    queryFn: async () => {
      if (!selectedList?.id) return { members: [] };
      const response = await apiRequest('GET', `/api/admin/crm/user-lists/${selectedList.id}/members`);
      return response.json();
    },
    enabled: !!selectedList?.id
  });

  // Create user list mutation
  const createListMutation = useMutation({
    mutationFn: async (listData: any) => {
      const response = await apiRequest('POST', '/api/admin/crm/user-lists', listData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/user-lists'] });
      setIsCreateDialogOpen(false);
      setNewListForm({ name: '', description: '', color: '#3b82f6' });
      toast({ title: 'Success', description: 'User list created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create user list', variant: 'destructive' });
    }
  });

  // Update user list mutation
  const updateListMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/admin/crm/user-lists/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/user-lists'] });
      setIsEditDialogOpen(false);
      toast({ title: 'Success', description: 'User list updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update user list', variant: 'destructive' });
    }
  });

  // Delete user list mutation
  const deleteListMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/crm/user-lists/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/user-lists'] });
      setSelectedList(null);
      toast({ title: 'Success', description: 'User list deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete user list', variant: 'destructive' });
    }
  });

  // Add users to list mutation
  const addUsersMutation = useMutation({
    mutationFn: async ({ listId, userIds }: { listId: number; userIds: number[] }) => {
      const response = await apiRequest('POST', `/api/admin/crm/user-lists/${listId}/members`, { userIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/user-lists', selectedList?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/user-lists'] });
      setIsAddUsersDialogOpen(false);
      setSelectedUsers([]);
      toast({ title: 'Success', description: 'Users added to list successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add users to list', variant: 'destructive' });
    }
  });

  // Remove user from list mutation
  const removeUserMutation = useMutation({
    mutationFn: async ({ listId, userId }: { listId: number; userId: number }) => {
      const response = await apiRequest('DELETE', `/api/admin/crm/user-lists/${listId}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/user-lists', selectedList?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/user-lists'] });
      toast({ title: 'Success', description: 'User removed from list successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove user from list', variant: 'destructive' });
    }
  });

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListForm.name.trim()) {
      toast({ title: 'Error', description: 'List name is required', variant: 'destructive' });
      return;
    }
    createListMutation.mutate(newListForm);
  };

  const handleUpdateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList) return;
    updateListMutation.mutate({
      id: selectedList.id,
      data: newListForm
    });
  };

  const handleDeleteList = (list: UserList) => {
    if (confirm(`Are you sure you want to delete the list "${list.name}"?`)) {
      deleteListMutation.mutate(list.id);
    }
  };

  const handleEditList = (list: UserList) => {
    setNewListForm({
      name: list.name,
      description: list.description || '',
      color: list.color || '#3b82f6'
    });
    setSelectedList(list);
    setIsEditDialogOpen(true);
  };

  const handleAddUsers = () => {
    if (!selectedList || selectedUsers.length === 0) return;
    addUsersMutation.mutate({
      listId: selectedList.id,
      userIds: selectedUsers
    });
  };

  const handleRemoveUser = (userId: number) => {
    if (!selectedList) return;
    removeUserMutation.mutate({
      listId: selectedList.id,
      userId
    });
  };

  const availableUsers = allUsers?.users?.filter(
    (user: User) => !listMembers?.members?.some((member: UserListMember) => member.userId === user.id)
  ) || [];

  if (listsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="lg:col-span-2 h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Lists</h1>
          <p className="text-muted-foreground mt-1">Create and manage custom user lists for targeted campaigns</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User List</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <Label htmlFor="listName">List Name</Label>
                <Input
                  id="listName"
                  value={newListForm.name}
                  onChange={(e) => setNewListForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premium Users, New Signups..."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="listDescription">Description (Optional)</Label>
                <Textarea
                  id="listDescription"
                  value={newListForm.description}
                  onChange={(e) => setNewListForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this user list..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        newListForm.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      onClick={() => setNewListForm(prev => ({ ...prev, color: color.value }))}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createListMutation.isPending}>
                  {createListMutation.isPending ? 'Creating...' : 'Create List'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Lists Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Lists ({userLists?.userLists?.length || 0})</h2>
          
          {userLists?.userLists?.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No user lists yet</p>
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First List
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {userLists?.userLists?.map((list: UserList) => (
                <Card
                  key={list.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedList?.id === list.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedList(list)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: list.color || '#3b82f6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{list.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {list.description || 'No description'}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {list.memberCount || 0}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-1 mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditList(list);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* List Details */}
        <div className="lg:col-span-2">
          {!selectedList ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Select a User List</h3>
                <p className="text-muted-foreground">
                  Choose a list from the sidebar to view and manage its members
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: selectedList.color || '#3b82f6' }}
                      />
                      <div>
                        <CardTitle>{selectedList.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedList.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setIsAddUsersDialogOpen(true)}
                      disabled={!availableUsers.length}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Users
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Members ({listMembers?.members?.length || 0})
                      </h3>
                    </div>
                    
                    {!listMembers?.members?.length ? (
                      <div className="text-center py-8">
                        <UserMinus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No members in this list yet</p>
                        <Button 
                          size="sm" 
                          onClick={() => setIsAddUsersDialogOpen(true)}
                          disabled={!availableUsers.length}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add First Members
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {listMembers.members.map((member: UserListMember) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {member.user.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{member.user.username}</p>
                                <p className="text-sm text-muted-foreground">{member.user.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant={member.user.subscriptionTier === 'free' ? 'secondary' : 'default'}>
                                {member.user.subscriptionTier}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveUser(member.userId)}
                              >
                                <UserMinus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Edit List Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User List</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateList} className="space-y-4">
            <div>
              <Label htmlFor="editListName">List Name</Label>
              <Input
                id="editListName"
                value={newListForm.name}
                onChange={(e) => setNewListForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="editListDescription">Description (Optional)</Label>
              <Textarea
                id="editListDescription"
                value={newListForm.description}
                onChange={(e) => setNewListForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full ${color.class} ${
                      newListForm.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    onClick={() => setNewListForm(prev => ({ ...prev, color: color.value }))}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={updateListMutation.isPending}>
                {updateListMutation.isPending ? 'Updating...' : 'Update List'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Users Dialog */}
      <Dialog open={isAddUsersDialogOpen} onOpenChange={setIsAddUsersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Users to {selectedList?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availableUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                All users are already in this list
              </p>
            ) : (
              availableUsers.map((user: User) => (
                <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers(prev => [...prev, user.id]);
                      } else {
                        setSelectedUsers(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                  />
                  
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  
                  <Badge variant={user.subscriptionTier === 'free' ? 'secondary' : 'default'}>
                    {user.subscriptionTier}
                  </Badge>
                </div>
              ))
            )}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleAddUsers} 
              disabled={selectedUsers.length === 0 || addUsersMutation.isPending}
            >
              {addUsersMutation.isPending ? 'Adding...' : `Add ${selectedUsers.length} Users`}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddUsersDialogOpen(false);
                setSelectedUsers([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}