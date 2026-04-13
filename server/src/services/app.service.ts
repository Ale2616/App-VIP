import { AppRepository } from "@/repositories/app.repository";
import { CategoryRepository } from "@/repositories/category.repository";
import type { CreateAppInput, UpdateAppInput } from "@/schemas/auth.schema";
import type { AppResponse } from "@/types";

export class AppService {
  constructor(
    private appRepository: AppRepository,
    private categoryRepository: CategoryRepository
  ) {}

  private mapToAppResponse(app: any): AppResponse {
    return {
      id: app.id,
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      imageUrl: app.imageUrl,
      downloadUrl: app.downloadUrl,
      categoryId: app.categoryId,
      categoryName: app.category?.name || "",
      downloadCount: app.downloadCount,
      createdAt: app.createdAt,
    };
  }

  async getAll(): Promise<AppResponse[]> {
    const apps = await this.appRepository.findWithCategory();
    return apps.map(this.mapToAppResponse);
  }

  async getById(id: string): Promise<AppResponse | null> {
    const app = await this.appRepository.findOneWithCategory(id);
    if (!app) return null;
    return this.mapToAppResponse(app);
  }

  async getByCategory(categorySlug: string): Promise<AppResponse[]> {
    const apps = await this.appRepository.findByCategory(categorySlug);
    return apps.map(this.mapToAppResponse);
  }

  async getMostDownloaded(limit: number = 10): Promise<AppResponse[]> {
    const apps = await this.appRepository.findMostDownloaded(limit);
    return apps.map(this.mapToAppResponse);
  }

  async create(input: CreateAppInput): Promise<AppResponse> {
    console.log("[APP SERVICE] create() called with input:", JSON.stringify(input, null, 2));

    console.log("[APP SERVICE] Looking for category with id/slug:", input.categoryId);
    const category = await this.categoryRepository.findOne({
      where: [{ id: input.categoryId }, { slug: input.categoryId }],
    });

    console.log("[APP SERVICE] Category found:", category ? JSON.stringify({ id: category.id, name: category.name, slug: category.slug }) : "NULL");

    if (!category) {
      const errorMsg = `Category not found. Received: "${input.categoryId}". Available slugs: "juegos", "aplicaciones"`;
      console.error("[APP SERVICE] ERROR:", errorMsg);
      throw new Error(errorMsg);
    }

    console.log("[APP SERVICE] Creating app entity with categoryId:", category.id);
    const app = this.appRepository.create({
      name: input.name,
      description: input.description,
      iconUrl: input.iconUrl,
      imageUrl: input.imageUrl,
      downloadUrl: input.downloadUrl,
      categoryId: category.id,
    });

    console.log("[APP SERVICE] Saving app to database...");
    await this.appRepository.save(app);

    console.log("[APP SERVICE] App saved. Fetching with category...");
    const saved = await this.appRepository.findOneWithCategory(app.id);

    if (!saved) {
      console.error("[APP SERVICE] ERROR: App was saved but could not be fetched");
      throw new Error("App was saved but could not be retrieved");
    }

    const result = this.mapToAppResponse(saved);
    console.log("[APP SERVICE] create() returning:", JSON.stringify(result, null, 2));
    return result;
  }

  async update(id: string, input: UpdateAppInput): Promise<AppResponse | null> {
    const app = await this.appRepository.findOne({ where: { id } });

    if (!app) {
      return null;
    }

    if (input.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: [{ id: input.categoryId }, { slug: input.categoryId }],
      });
      if (!category) {
        throw new Error("Category not found");
      }
      app.categoryId = category.id;
    }

    Object.assign(app, input);
    await this.appRepository.save(app);

    const updated = await this.appRepository.findOneWithCategory(id);
    return this.mapToAppResponse(updated!);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.appRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async incrementDownload(id: string): Promise<AppResponse | null> {
    const app = await this.appRepository.findOne({ where: { id } });

    if (!app) return null;

    app.downloadCount += 1;
    await this.appRepository.save(app);

    const updated = await this.appRepository.findOneWithCategory(id);
    return this.mapToAppResponse(updated!);
  }

  async seedCategories(): Promise<void> {
    const categories = [
      { name: "Juegos", slug: "juegos" },
      { name: "Aplicaciones", slug: "aplicaciones" },
    ];

    for (const cat of categories) {
      const existing = await this.categoryRepository.findOne({ where: { slug: cat.slug } });
      if (!existing) {
        const category = this.categoryRepository.create(cat);
        await this.categoryRepository.save(category);
      }
    }
  }
}
