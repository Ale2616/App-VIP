import { api } from "@/lib/api-client";
import type { VisitCountResponse } from "@/types";

export const visitsApi = {
  trackVisit: async (): Promise<void> => {
    await api.post("/visits/track");
  },

  getTotalVisits: async (): Promise<VisitCountResponse> => {
    const { data } = await api.get<VisitCountResponse>("/visits/count");
    return data;
  },
};
