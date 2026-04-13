import { DataSource, Repository } from "typeorm";
import { UserEntity } from "@/entities/UserEntity";

export class UserRepository extends Repository<UserEntity> {
  constructor(dataSource: DataSource) {
    super(UserEntity, dataSource.manager);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({ where: { email } });
  }
}
