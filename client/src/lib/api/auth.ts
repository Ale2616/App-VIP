import { api } from "@/lib/api-client";
import type { AuthResponse, User } from "@/types";

export const authApi = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    console.log("[AUTH API] POST /auth/register for:", email);
    const { data } = await api.post<AuthResponse>("/auth/register", {
      name,
      email,
      password,
    });
    console.log("[AUTH API] Register response:", { user: data.user?.email, hasToken: !!data.token });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    console.log("[AUTH API] POST /auth/login for:", email);
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    console.log("[AUTH API] Login response received:", {
      user: data.user?.email,
      userRole: data.user?.role,
      hasToken: !!data.token,
      tokenLength: data.token?.length,
    });
    return data;
  },

  getMe: async (): Promise<{ user: User }> => {
    console.log("[AUTH API] GET /auth/me");
    const { data } = await api.get<{ user: User }>("/auth/me");
    console.log("[AUTH API] getMe response:", { user: data.user?.email, role: data.user?.role });
    return data;
  },
};
