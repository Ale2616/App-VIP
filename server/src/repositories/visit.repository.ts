import { DataSource, Repository } from "typeorm";
import { SiteVisitEntity } from "@/entities/SiteVisitEntity";

export class VisitRepository extends Repository<SiteVisitEntity> {
  constructor(dataSource: DataSource) {
    super(SiteVisitEntity, dataSource.manager);
  }

  async countTotalVisits(): Promise<number> {
    return this.count();
  }
}
