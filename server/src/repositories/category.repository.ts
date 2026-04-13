import { DataSource, Repository } from "typeorm";
import { CategoryEntity } from "@/entities/CategoryEntity";

export class CategoryRepository extends Repository<CategoryEntity> {
  constructor(dataSource: DataSource) {
    super(CategoryEntity, dataSource.manager);
  }
}
