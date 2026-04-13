import { Router } from "express";
import { CategoryRepository } from "@/repositories/category.repository";
import { AppDataSource } from "@/database/data-source";

const router = Router();

export function createCategoryRoutes() {
  const categoryRepository = new CategoryRepository(AppDataSource);

  router.get("/", async (_req, res) => {
    try {
      const categories = await categoryRepository.find();
      res.status(200).json({ categories });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return router;
}
