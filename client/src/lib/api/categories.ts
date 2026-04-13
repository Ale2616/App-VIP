import { api } from "@/lib/api-client";
import type { Category } from "@/types";

export const categoriesApi = {
  getAll: async (): Promise<{ categories: Category[] }> => {
    const { data } = await api.get<{ categories: Category[] }>("/categories");
    return data;
  },
};
