import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { AppEntity } from "./AppEntity";

@Entity("categories")
export class CategoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 100, unique: true })
  slug: string;

  @OneToMany(() => AppEntity, (app) => app.category)
  apps: AppEntity[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
