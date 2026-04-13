import multer from "multer";
import type { Request } from "express";

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log("[UPLOAD MIDDLEWARE] fileFilter - File received:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
  });

  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const isValid = allowedTypes.test(file.mimetype);

  if (isValid) {
    console.log("[UPLOAD MIDDLEWARE] File type valid, accepting");
    cb(null, true);
  } else {
    const errorMsg = `File type not allowed: ${file.mimetype}. Allowed: jpeg, jpg, png, webp, gif`;
    console.error("[UPLOAD MIDDLEWARE] ERROR:", errorMsg);
    cb(new Error(errorMsg));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (sufficient for screenshots)
});
