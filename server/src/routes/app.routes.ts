import { Router, type Request, type Response, type NextFunction } from "express";
import { AppController } from "@/controllers/app.controller";
import { authenticate, requireAdmin } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/upload.middleware";

const router = Router();

export function createAppRoutes(appController: AppController) {
  // Public routes
  router.get("/", appController.getAll);
  router.get("/:id", appController.getById);
  router.post("/:id/download", appController.incrementDownload);

  // Admin routes
  router.post("/", authenticate, requireAdmin, appController.create);
  router.put("/:id", authenticate, requireAdmin, appController.update);
  router.delete("/:id", authenticate, requireAdmin, appController.delete);

  // Upload route with explicit error handling for multer errors
  router.post(
    "/upload",
    authenticate,
    requireAdmin,
    upload.single("image"),
    (err: any, _req: Request, _res: Response, next: NextFunction) => {
      if (err) {
        console.error("========================================");
        console.error("[ROUTES] MULTER ERROR on /apps/upload");
        console.error("========================================");
        console.error("[ROUTES] Error:", err.message);
        console.error("[ROUTES] Error code:", err.code);
        console.error("[ROUTES] Full error:", err);
        console.error("========================================");

        if (err.code === "LIMIT_FILE_SIZE") {
          _res.status(413).json({
            message: "El archivo es demasiado grande. Tamaño máximo: 10MB",
            error: "LIMIT_FILE_SIZE",
          });
          return;
        }

        _res.status(400).json({
          message: err.message || "Error al procesar el archivo",
          error: err.message,
        });
        return;
      }
      next();
    },
    appController.uploadImage
  );

  return router;
}
