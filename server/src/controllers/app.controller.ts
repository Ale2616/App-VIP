import type { Request, Response } from "express";
import { AppService } from "@/services/app.service";
import { CloudinaryService } from "@/services/cloudinary.service";
import type { AuthRequest } from "@/types";

export class AppController {
  constructor(
    private appService: AppService,
    private cloudinaryService: CloudinaryService
  ) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const { category, popular, mostDownloaded } = req.query;

      if (mostDownloaded === "true") {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const apps = await this.appService.getMostDownloaded(limit);
        res.status(200).json({ apps });
        return;
      }

      if (category) {
        const apps = await this.appService.getByCategory(category as string);
        res.status(200).json({ apps });
        return;
      }

      const apps = await this.appService.getAll();
      res.status(200).json({ apps });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const app = await this.appService.getById(id);
      if (!app) {
        res.status(404).json({ message: "App not found" });
        return;
      }
      res.status(200).json({ app });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      console.log("========================================");
      console.log("[APP CONTROLLER] POST /apps - CREATE");
      console.log("========================================");
      console.log("[APP CONTROLLER] req.user:", JSON.stringify(req.user));
      console.log("[APP CONTROLLER] req.body:", JSON.stringify(req.body, null, 2));
      console.log("========================================");

      const app = await this.appService.create(req.body);

      console.log("[APP CONTROLLER] App created successfully:", JSON.stringify(app));
      res.status(201).json({ app });
    } catch (error: any) {
      console.error("[APP CONTROLLER] ERROR creating app:", error.message);
      console.error("[APP CONTROLLER] Stack:", error.stack);
      res.status(400).json({ message: error.message, error: error.message });
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const app = await this.appService.update(id, req.body);
      if (!app) {
        res.status(404).json({ message: "App not found" });
        return;
      }
      res.status(200).json({ app });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const deleted = await this.appService.delete(id);
      if (!deleted) {
        res.status(404).json({ message: "App not found" });
        return;
      }
      res.status(200).json({ message: "App deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  incrementDownload = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const app = await this.appService.incrementDownload(id);
      if (!app) {
        res.status(404).json({ message: "App not found" });
        return;
      }
      res.status(200).json({ downloadUrl: app.downloadUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  uploadImage = async (req: Request, res: Response) => {
    try {
      console.log("========================================");
      console.log("[APP CONTROLLER] POST /apps/upload - UPLOAD IMAGE");
      console.log("========================================");
      console.log("[APP CONTROLLER] req.file:", req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length,
      } : "NO FILE RECEIVED");
      console.log("[APP CONTROLLER] req.body:", JSON.stringify(req.body));
      console.log("[APP CONTROLLER] Cloudinary configured:", this.cloudinaryService.isConfigured());
      console.log("========================================");

      if (!req.file) {
        console.error("[APP CONTROLLER] ERROR: No file provided in request");
        res.status(400).json({ message: "No file provided", error: "No file provided" });
        return;
      }

      const url = await this.cloudinaryService.uploadImage(req.file);
      const mode = this.cloudinaryService.isConfigured() ? "cloudinary" : "local";

      console.log("[APP CONTROLLER] Image uploaded successfully. URL:", url, "Mode:", mode);
      res.status(200).json({ url, mode });
    } catch (error: any) {
      console.error("[APP CONTROLLER] ERROR uploading image:", error.message);
      console.error("[APP CONTROLLER] Stack:", error.stack);
      res.status(500).json({ message: error.message, error: error.message });
    }
  };
}
