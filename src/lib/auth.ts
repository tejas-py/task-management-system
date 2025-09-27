import { apiRequest } from "./api";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  is_admin?: boolean;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
}

export interface CreateUserPayload {
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  password: string;
}

export interface CreateUserResponse {
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
}

export interface ListUsersParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export interface ListUsersResponse {
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
}

export interface GetCurrentUserResponse {
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
}

export interface UpdateUserPayload {
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
}

export interface UpdateUserResponse {
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
}

export class AuthService {
  private static readonly TOKEN_KEY = "access_token";
  private static readonly USER_KEY = "user_data";

  static async login(credentials: LoginCredentials) {
    const formData = new FormData();
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);

    const response = await apiRequest<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: formData,
    });

    if (response.data) {
      this.setToken(response.data.access_token);

      // First save basic user data from login response
      this.setUser({
        id: response.data.user_id,
        username: response.data.username,
        is_admin: response.data.is_admin,
      });

      // Then try to fetch complete user data
      try {
        await this.getCurrentUser();
      } catch (error) {
        console.error("Failed to fetch complete user data:", error);
        // Keep the basic user data if getCurrentUser fails
      }
    }

    return response;
  }

  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static setUser(user: User) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static isAdmin(): boolean {
    const user = this.getUser();
    return user?.is_admin === true;
  }

  static getAuthHeaders(): HeadersInit | undefined {
    const token = this.getToken();
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined;
  }

  static async createUser(userData: CreateUserPayload) {
    const response = await apiRequest<CreateUserResponse>("/api/v1/users/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    });

    return response;
  }

  static async listUsers(params: ListUsersParams = {}) {
    const queryParams = new URLSearchParams();

    if (params.skip !== undefined) {
      queryParams.append("skip", params.skip.toString());
    }
    if (params.limit !== undefined) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params.search) {
      queryParams.append("search", params.search);
    }

    const endpoint = `/api/v1/users/${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await apiRequest<ListUsersResponse[]>(endpoint, {
      method: "GET",
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    return response;
  }

  static async getCurrentUser() {
    const response = await apiRequest<GetCurrentUserResponse>(
      "/api/v1/users/me",
      {
        method: "GET",
        headers: {
          ...this.getAuthHeaders(),
        },
      },
    );

    // Update local user data if successful
    if (response.data) {
      console.log("getCurrentUser response:", response.data); // Debug log
      this.setUser({
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        full_name: response.data.full_name,
        is_active: response.data.is_active,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        is_admin: response.data.is_admin,
      });
    } else if (response.error) {
      console.error("getCurrentUser error:", response.error); // Debug log
    }

    return response;
  }

  static async updateUser(userId: string, userData: UpdateUserPayload) {
    const response = await apiRequest<UpdateUserResponse>(`/api/v1/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    });

    return response;
  }
}
