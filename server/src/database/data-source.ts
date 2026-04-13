import "reflect-metadata";
import { DataSource } from "typeorm";
import { DATABASE_URL, NODE_ENV } from "@/config/env";
import { UserEntity } from "@/entities/UserEntity";
import { CategoryEntity } from "@/entities/CategoryEntity";
import { AppEntity } from "@/entities/AppEntity";
import { SiteVisitEntity } from "@/entities/SiteVisitEntity";

const isDevelopment = NODE_ENV === "development";
const isProduction = NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: DATABASE_URL,
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
  synchronize: isDevelopment,
  logging: isDevelopment ? ["query", "error"] : false,
  entities: [UserEntity, CategoryEntity, AppEntity, SiteVisitEntity],
  migrations: isDevelopment
    ? [__dirname + "/migrations/*.ts"]
    : [__dirname + "/migrations/*.js"],
  migrationsRun: isDevelopment,
  extra: {
    max: isProduction ? 10 : 20,
  },
});
