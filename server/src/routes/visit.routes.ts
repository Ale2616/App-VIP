import { Router } from "express";
import { VisitController } from "@/controllers/visit.controller";

const router = Router();

export function createVisitRoutes(visitController: VisitController) {
  router.post("/track", visitController.trackVisit);
  router.get("/count", visitController.getTotalVisits);

  return router;
}
