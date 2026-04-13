import { DataSource, Repository } from "typeorm";
import { AppEntity } from "@/entities/AppEntity";

export class AppRepository extends Repository<AppEntity> {
  constructor(dataSource: DataSource) {
    super(AppEntity, dataSource.manager);
  }

  async findWithCategory() {
    return this.createQueryBuilder("app")
      .leftJoinAndSelect("app.category", "category")
      .orderBy("app.createdAt", "DESC")
      .getMany();
  }

  async findMostDownloaded(limit: number = 10) {
    return this.createQueryBuilder("app")
      .leftJoinAndSelect("app.category", "category")
      .orderBy("app.downloadCount", "DESC")
      .take(limit)
      .getMany();
  }

  async findByCategory(categorySlug: string) {
    return this.createQueryBuilder("app")
      .leftJoinAndSelect("app.category", "category")
      .where("category.slug = :slug", { slug: categorySlug })
      .orderBy("app.createdAt", "DESC")
      .getMany();
  }

  async findOneWithCategory(id: string) {
    return this.createQueryBuilder("app")
      .leftJoinAndSelect("app.category", "category")
      .where("app.id = :id", { id })
      .getOne();
  }
}
