import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserPlus,
  Users,
  Edit,
  Shield,
  User,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AuthService,
  type CreateUserPayload,
  type ListUsersParams,
  type UpdateUserPayload,
} from "@/lib/auth";

// Type definitions for component
interface UserWithRole {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  is_admin?: boolean;
  role: "admin" | "user";
}

interface CreateUserFormData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  is_active: boolean;
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [createUserForm, setCreateUserForm] = useState<CreateUserFormData>({
    username: "",
    email: "",
    password: "",
    full_name: "",
    is_active: true,
  });
  const [updateUserForm, setUpdateUserForm] = useState<UserWithRole | null>(
    null,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [usersPerPage] = useState(10);

  const [currentUser, setCurrentUser] = useState(() => {
    const user = AuthService.getUser();
    console.log("Initial current user from localStorage:", user); // Debug log
    return user;
  });
  const isAdmin = AuthService.isAdmin();

  // Refresh current user data
  const refreshCurrentUser = useCallback(async () => {
    try {
      console.log("Refreshing current user..."); // Debug log
      const response = await AuthService.getCurrentUser();
      console.log("getCurrentUser response:", response); // Debug log
      if (response.data) {
        const updatedUser = AuthService.getUser();
        console.log("Updated user from localStorage:", updatedUser); // Debug log
        setCurrentUser(updatedUser);
      } else {
        console.log("No data in response"); // Debug log
      }
    } catch (error) {
      console.error("Error refreshing current user:", error); // Debug log
    }
  }, []);

  // Load current user data on mount
  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  // Fetch users from API
  const fetchUsers = useCallback(
    async (params: ListUsersParams = {}) => {
      if (!isAdmin) return; // Only admin can fetch users

      setIsLoadingUsers(true);
      setError("");

      try {
        const response = await AuthService.listUsers(params);

        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          // Map API response to include role based on is_admin field
          const usersWithRole: UserWithRole[] = response.data.map((user) => ({
            ...user,
            role: user.is_admin ? ("admin" as const) : ("user" as const),
          }));
          setUsers(usersWithRole);
        }
      } catch {
        setError("Failed to fetch users");
      } finally {
        setIsLoadingUsers(false);
      }
    },
    [isAdmin],
  );

  // Load users on component mount
  useEffect(() => {
    fetchUsers({
      skip: currentPage * usersPerPage,
      limit: usersPerPage,
      search: searchQuery || undefined,
    });
  }, [fetchUsers, currentPage, usersPerPage, searchQuery, isAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsCreatingUser(true);

    if (!isAdmin) {
      setError("Only administrators can create users");
      setIsCreatingUser(false);
      return;
    }

    try {
      const userData: CreateUserPayload = {
        email: createUserForm.email,
        username: createUserForm.username,
        full_name: createUserForm.full_name,
        is_active: createUserForm.is_active,
        password: createUserForm.password,
      };

      const response = await AuthService.createUser(userData);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setSuccess("User created successfully!");
        setCreateUserForm({
          username: "",
          email: "",
          password: "",
          full_name: "",
          is_active: true,
        });
        setIsCreateDialogOpen(false);

        // Refresh the users list
        fetchUsers({
          skip: currentPage * usersPerPage,
          limit: usersPerPage,
          search: searchQuery || undefined,
        });
      }
    } catch {
      setError("Failed to create user. Please try again.");
    } finally {
      setIsCreatingUser(false);
    }
  };


  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsUpdatingUser(true);

    if (!updateUserForm) {
      setIsUpdatingUser(false);
      return;
    }

    try {
      const updatePayload: UpdateUserPayload = {
        email: updateUserForm.email,
        username: updateUserForm.username,
        full_name: updateUserForm.full_name,
        is_active: updateUserForm.is_active,
        is_admin: updateUserForm.is_admin || false,
      };

      const response = await AuthService.updateUser(updateUserForm.id, updatePayload);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setSuccess("User updated successfully!");
        setIsUpdateDialogOpen(false);
        setUpdateUserForm(null);

        // Refresh the users list to show updated data
        fetchUsers({
          skip: currentPage * usersPerPage,
          limit: usersPerPage,
          search: searchQuery || undefined,
        });
      }
    } catch {
      setError("Failed to update user. Please try again.");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const openUpdateDialog = (user: UserWithRole) => {
    setUpdateUserForm({ ...user });
    setIsUpdateDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Users Management</h2>
        {isAdmin && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. Only administrators can create
                  users.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={createUserForm.username}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        username: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createUserForm.email}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={createUserForm.full_name}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        full_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createUserForm.password}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <select
                    id="is_active"
                    value={createUserForm.is_active ? "active" : "inactive"}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        is_active: e.target.value === "active",
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating User...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="current-user" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current-user">Current User</TabsTrigger>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
        </TabsList>

        <TabsContent value="current-user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current User Information
              </CardTitle>
              <CardDescription>
                Your account details and profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentUser ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Loading user information...
                  </p>
                  <Button
                    onClick={refreshCurrentUser}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Username</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{currentUser.username || "N/A"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {currentUser.email || "Not available"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {currentUser.full_name || "Not available"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">User ID</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {currentUser.id || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Role</Label>
                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          User
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-users" className="space-y-4">
          {!isAdmin ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only administrators can view all users.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      All Users ({users.length})
                    </CardTitle>
                    <CardDescription>
                      Complete list of all users in the system
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fetchUsers({
                        skip: currentPage * usersPerPage,
                        limit: usersPerPage,
                        search: searchQuery || undefined,
                      })
                    }
                    disabled={isLoadingUsers}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isLoadingUsers ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </div>

                {/* Search bar */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by username or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0); // Reset to first page when searching
                    }}
                    className="max-w-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(0);
                    }}
                    disabled={!searchQuery}
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading users...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-8 text-muted-foreground"
                              >
                                {searchQuery
                                  ? "No users found matching your search."
                                  : "No users found."}
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                  {user.username}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      user.role === "admin"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {user.role === "admin" ? (
                                      <>
                                        <Shield className="h-3 w-3 mr-1" />
                                        Admin
                                      </>
                                    ) : (
                                      <>
                                        <User className="h-3 w-3 mr-1" />
                                        User
                                      </>
                                    )}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      user.is_active ? "outline" : "destructive"
                                    }
                                  >
                                    {user.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {formatDate(user.created_at)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openUpdateDialog(user)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {currentPage * usersPerPage + 1} to{" "}
                        {Math.min(
                          (currentPage + 1) * usersPerPage,
                          users.length,
                        )}{" "}
                        of {users.length} users
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(Math.max(0, currentPage - 1))
                          }
                          disabled={currentPage === 0 || isLoadingUsers}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm">Page {currentPage + 1}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={
                            users.length < usersPerPage || isLoadingUsers
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Update User Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription>
              Modify user information and settings.
            </DialogDescription>
          </DialogHeader>
          {updateUserForm && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="update-username">Username</Label>
                <Input
                  id="update-username"
                  value={updateUserForm.username}
                  onChange={(e) =>
                    setUpdateUserForm({
                      ...updateUserForm,
                      username: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-email">Email</Label>
                <Input
                  id="update-email"
                  type="email"
                  value={updateUserForm.email}
                  onChange={(e) =>
                    setUpdateUserForm({
                      ...updateUserForm,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-full-name">Full Name</Label>
                <Input
                  id="update-full-name"
                  value={updateUserForm.full_name}
                  onChange={(e) =>
                    setUpdateUserForm({
                      ...updateUserForm,
                      full_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-role">Role</Label>
                <select
                  id="update-role"
                  value={updateUserForm.is_admin ? "admin" : "user"}
                  onChange={(e) =>
                    setUpdateUserForm({
                      ...updateUserForm,
                      role: e.target.value as "admin" | "user",
                      is_admin: e.target.value === "admin",
                    })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-status">Status</Label>
                <select
                  id="update-status"
                  value={updateUserForm.is_active ? "active" : "inactive"}
                  onChange={(e) =>
                    setUpdateUserForm({
                      ...updateUserForm,
                      is_active: e.target.value === "active",
                    })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isUpdatingUser}>
                {isUpdatingUser ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating User...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
