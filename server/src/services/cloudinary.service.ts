import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_URL, NODE_ENV } from "@/config/env";
import type { Express } from "express";
import fs from "fs";
import path from "path";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Parse CLOUDINARY_URL and configure cloudinary
const parseCloudinaryUrl = () => {
  if (!CLOUDINARY_URL) return null;

  try {
    const url = new URL(CLOUDINARY_URL);
    return {
      cloud_name: url.hostname,
      api_key: url.username,
      api_secret: url.password,
    };
  } catch {
    return null;
  }
};

const config = parseCloudinaryUrl();
const isCloudinaryConfigured = !!config;

if (config) {
  cloudinary.config(config);
}

export class CloudinaryService {
  /**
   * Uploads an image. If Cloudinary is not configured, saves locally in 'uploads/' folder.
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    console.log("[CLOUDINARY SERVICE] uploadImage() called. File:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferLength: file.buffer?.length,
    });
    console.log("[CLOUDINARY SERVICE] Cloudinary configured:", isCloudinaryConfigured);

    if (!isCloudinaryConfigured) {
      console.log("[CLOUDINARY SERVICE] Cloudinary NOT configured, saving locally...");
      return this.saveLocally(file);
    }

    console.log("[CLOUDINARY SERVICE] Uploading to Cloudinary...");
    return this.uploadToCloudinary(file);
  }

  /**
   * Save file locally in uploads folder and return URL.
   */
  private saveLocally(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname) || ".jpg";
      const filename = `upload-${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      console.log("[CLOUDINARY SERVICE] saveLocally() - Saving to:", filepath);

      fs.writeFile(filepath, file.buffer, (err) => {
        if (err) {
          console.error("[CLOUDINARY SERVICE] ERROR: Failed to save file locally:", err.message);
          reject(new Error("Failed to save file locally: " + err.message));
          return;
        }
        // Return relative URL path
        const baseUrl = NODE_ENV === "production" ? "/uploads" : "/uploads";
        const url = `${baseUrl}/${filename}`;
        console.log("[CLOUDINARY SERVICE] saveLocally() - Success! URL:", url);
        resolve(url);
      });
    });
  }

  /**
   * Upload file to Cloudinary.
   */
  private uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "app-catalog",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error("[CLOUDINARY SERVICE] ERROR: Cloudinary upload failed:", error.message);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            console.log("[CLOUDINARY SERVICE] uploadToCloudinary() - Success! URL:", result!.secure_url);
            resolve(result!.secure_url);
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Check if Cloudinary is properly configured.
   */
  isConfigured(): boolean {
    return isCloudinaryConfigured;
  }
}
