import { apiRequest } from "./api";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assignee?: User;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string;
  due_date: string;
}

export interface CreateTaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string;
  due_date: Date | null;
}

export interface ListTasksParams {
  skip?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  search?: string;
}

export interface MyTasksParams {
  skip?: number;
  limit?: number;
  status?: TaskStatus;
}

export class TasksService {
  private static readonly TOKEN_KEY = "access_token";

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static getAuthHeaders(): HeadersInit | undefined {
    const token = this.getToken();
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined;
  }

  static async listUsers(): Promise<User[]> {
    const response = await apiRequest<User[]>("/api/v1/users/", {
      method: "GET",
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("No users data received from server");
    }

    return response.data;
  }

  static async listTasks(params?: ListTasksParams): Promise<Task[]> {
    const queryParams = new URLSearchParams();

    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.assignee_id) queryParams.append('assignee_id', params.assignee_id);
    if (params?.search) queryParams.append('search', params.search);

    const url = `/api/v1/tasks/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await apiRequest<Task[]>(url, {
      method: "GET",
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("No tasks data received from server");
    }

    return response.data;
  }

  static async getMyTasks(params?: MyTasksParams): Promise<Task[]> {
    const queryParams = new URLSearchParams();

    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const url = `/api/v1/tasks/my/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await apiRequest<Task[]>(url, {
      method: "GET",
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("No my tasks data received from server");
    }

    return response.data;
  }

  static async createTask(formData: CreateTaskFormData): Promise<Task> {
    const payload: CreateTaskPayload = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      assignee_id: formData.assignee_id,
      due_date: formData.due_date
        ? formData.due_date.toISOString()
        : new Date().toISOString(),
    };

    const response = await apiRequest<Task>("/api/v1/tasks/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("No data received from server");
    }

    return response.data;
  }
}
