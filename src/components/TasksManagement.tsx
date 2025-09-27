import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Filter,
  Clock,
  User,
  CheckCircle,
  Circle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AuthService } from "@/lib/auth";

// Task types and interfaces
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee_name?: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name?: string;
}

export interface CreateTaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string;
  due_date: Date | null;
}

// Dummy data for demonstration
const dummyTasks: Task[] = [
  {
    id: "1",
    title: "Complete User Authentication",
    description: "Implement login and registration functionality with JWT tokens",
    status: "in_progress",
    priority: "high",
    assignee_id: "user1",
    assignee_name: "John Doe",
    due_date: "2025-01-15T00:00:00Z",
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-05T14:30:00Z",
    created_by: "admin",
    created_by_name: "Administrator",
  },
  {
    id: "2",
    title: "Design Task Management UI",
    description: "Create wireframes and mockups for the task management interface",
    status: "completed",
    priority: "medium",
    assignee_id: "user2",
    assignee_name: "Jane Smith",
    due_date: "2025-01-10T00:00:00Z",
    created_at: "2024-12-28T09:00:00Z",
    updated_at: "2025-01-02T16:45:00Z",
    created_by: "admin",
    created_by_name: "Administrator",
  },
  {
    id: "3",
    title: "Setup Database Schema",
    description: "Design and implement the database schema for users and tasks",
    status: "pending",
    priority: "urgent",
    assignee_id: "user3",
    assignee_name: "Bob Wilson",
    due_date: "2025-01-20T00:00:00Z",
    created_at: "2025-01-03T11:15:00Z",
    updated_at: "2025-01-03T11:15:00Z",
    created_by: "user1",
    created_by_name: "John Doe",
  },
];

const dummyUsers = [
  { id: "user1", name: "John Doe" },
  { id: "user2", name: "Jane Smith" },
  { id: "user3", name: "Bob Wilson" },
  { id: "admin", name: "Administrator" },
];

export function TasksManagement() {
  const [tasks, setTasks] = useState<Task[]>(dummyTasks);
  const [users] = useState(dummyUsers);
  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskFormData>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assignee_id: "",
    due_date: null,
  });
  const [updateTaskForm, setUpdateTaskForm] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Loading states
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentUser = AuthService.getUser();

  // Get status badge variant
  const getStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case "low":
        return "outline";
      case "medium":
        return "secondary";
      case "high":
        return "default";
      case "urgent":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Get status icon
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return <Circle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Get my tasks (assigned to me or created by me)
  const myTasks = tasks.filter(
    (task) =>
      task.assignee_id === currentUser?.id ||
      task.created_by === currentUser?.id
  );

  // Handle create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsCreatingTask(true);

    try {
      // TODO: Replace with actual API call
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...createTaskForm,
        due_date: createTaskForm.due_date?.toISOString() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser?.id || "unknown",
        created_by_name: currentUser?.username || "Unknown",
        assignee_name: users.find(u => u.id === createTaskForm.assignee_id)?.name,
      };

      setTasks([newTask, ...tasks]);
      setSuccess("Task created successfully!");
      setCreateTaskForm({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        assignee_id: "",
        due_date: null,
      });
      setIsCreateDialogOpen(false);
    } catch {
      setError("Failed to create task. Please try again.");
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Handle update task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsUpdatingTask(true);

    if (!updateTaskForm) {
      setIsUpdatingTask(false);
      return;
    }

    try {
      // TODO: Replace with actual API call
      const updatedTasks = tasks.map((task) =>
        task.id === updateTaskForm.id
          ? {
              ...updateTaskForm,
              updated_at: new Date().toISOString(),
              assignee_name: users.find(u => u.id === updateTaskForm.assignee_id)?.name,
            }
          : task
      );

      setTasks(updatedTasks);
      setSuccess("Task updated successfully!");
      setIsUpdateDialogOpen(false);
      setUpdateTaskForm(null);
    } catch {
      setError("Failed to update task. Please try again.");
    } finally {
      setIsUpdatingTask(false);
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    setError("");
    setSuccess("");
    setIsDeletingTask(true);

    try {
      // TODO: Replace with actual API call
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      setTasks(updatedTasks);
      setSuccess("Task deleted successfully!");
    } catch {
      setError("Failed to delete task. Please try again.");
    } finally {
      setIsDeletingTask(false);
    }
  };

  // Open update dialog
  const openUpdateDialog = (task: Task) => {
    setUpdateTaskForm({ ...task });
    setIsUpdateDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (task: Task) => {
    setSelectedTask(task);
    setIsViewDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Tasks Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to the system with all the necessary details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={createTaskForm.title}
                  onChange={(e) => setCreateTaskForm({...createTaskForm, title: e.target.value})}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createTaskForm.description}
                  onChange={(e) => setCreateTaskForm({...createTaskForm, description: e.target.value})}
                  placeholder="Enter task description"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={createTaskForm.status}
                    onValueChange={(value: TaskStatus) =>
                      setCreateTaskForm({...createTaskForm, status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={createTaskForm.priority}
                    onValueChange={(value: TaskPriority) =>
                      setCreateTaskForm({...createTaskForm, priority: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Select
                  value={createTaskForm.assignee_id}
                  onValueChange={(value) =>
                    setCreateTaskForm({...createTaskForm, assignee_id: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !createTaskForm.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {createTaskForm.due_date ? (
                        format(createTaskForm.due_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={createTaskForm.due_date || undefined}
                      onSelect={(date) => setCreateTaskForm({...createTaskForm, due_date: date || null})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button type="submit" className="w-full" disabled={isCreatingTask}>
                {isCreatingTask ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Task...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all-tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="all-tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    All Tasks ({filteredTasks.length})
                  </CardTitle>
                  <CardDescription>
                    Complete list of all tasks in the system
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* TODO: Refresh tasks */}}
                  disabled={isLoadingTasks}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTasks ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={(value: TaskStatus | "all") => setStatusFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={(value: TaskPriority | "all") => setPriorityFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                            ? "No tasks found matching your filters."
                            : "No tasks found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium max-w-xs">
                            <div>
                              <div className="font-semibold">{task.title}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {task.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(task.status)} className="flex items-center gap-1 w-fit">
                              {getStatusIcon(task.status)}
                              {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityBadgeVariant(task.priority)}>
                              {task.priority.replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{task.assignee_name || "Unassigned"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(task.due_date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewDialog(task)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUpdateDialog(task)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTask(task.id)}
                                disabled={isDeletingTask}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Tasks ({myTasks.length})
              </CardTitle>
              <CardDescription>
                Tasks assigned to me or created by me
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No tasks assigned to you or created by you.
                        </TableCell>
                      </TableRow>
                    ) : (
                      myTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium max-w-xs">
                            <div>
                              <div className="font-semibold">{task.title}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {task.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(task.status)} className="flex items-center gap-1 w-fit">
                              {getStatusIcon(task.status)}
                              {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityBadgeVariant(task.priority)}>
                              {task.priority.replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {task.assignee_id === currentUser?.id ? "Assignee" : "Creator"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(task.due_date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewDialog(task)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUpdateDialog(task)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Task Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View complete task information
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm mt-1">{selectedTask.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1">{selectedTask.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedTask.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(selectedTask.status)}
                      {selectedTask.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>
                      {selectedTask.priority.replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Assignee</Label>
                <p className="text-sm mt-1">{selectedTask.assignee_name || "Unassigned"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Created By</Label>
                <p className="text-sm mt-1">{selectedTask.created_by_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Due Date</Label>
                <p className="text-sm mt-1">{formatDate(selectedTask.due_date)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm mt-1">{formatDate(selectedTask.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated</Label>
                  <p className="text-sm mt-1">{formatDate(selectedTask.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Task Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Task</DialogTitle>
            <DialogDescription>
              Modify task information and settings.
            </DialogDescription>
          </DialogHeader>
          {updateTaskForm && (
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="update-title">Title</Label>
                <Input
                  id="update-title"
                  value={updateTaskForm.title}
                  onChange={(e) => setUpdateTaskForm({...updateTaskForm, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-description">Description</Label>
                <Textarea
                  id="update-description"
                  value={updateTaskForm.description}
                  onChange={(e) => setUpdateTaskForm({...updateTaskForm, description: e.target.value})}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="update-status">Status</Label>
                  <Select
                    value={updateTaskForm.status}
                    onValueChange={(value: TaskStatus) =>
                      setUpdateTaskForm({...updateTaskForm, status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update-priority">Priority</Label>
                  <Select
                    value={updateTaskForm.priority}
                    onValueChange={(value: TaskPriority) =>
                      setUpdateTaskForm({...updateTaskForm, priority: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-assignee">Assignee</Label>
                <Select
                  value={updateTaskForm.assignee_id || ""}
                  onValueChange={(value) =>
                    setUpdateTaskForm({...updateTaskForm, assignee_id: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !updateTaskForm.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {updateTaskForm.due_date ? (
                        format(new Date(updateTaskForm.due_date), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={updateTaskForm.due_date ? new Date(updateTaskForm.due_date) : undefined}
                      onSelect={(date) => setUpdateTaskForm({
                        ...updateTaskForm,
                        due_date: date?.toISOString() || null
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button type="submit" className="w-full" disabled={isUpdatingTask}>
                {isUpdatingTask ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating Task...
                  </>
                ) : (
                  "Update Task"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}