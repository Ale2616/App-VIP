import type { Request, Response } from "express";
import { VisitService } from "@/services/visit.service";

export class VisitController {
  constructor(private visitService: VisitService) {}

  trackVisit = async (req: Request, res: Response) => {
    try {
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      await this.visitService.trackVisit(ip);
      res.status(200).json({ message: "Visit tracked" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getTotalVisits = async (_req: Request, res: Response) => {
    try {
      const total = await this.visitService.getTotalVisits();
      res.status(200).json({ visits: total });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
