import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { CategoryEntity } from "./CategoryEntity";

@Entity("apps")
export class AppEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "varchar", length: 500 })
  iconUrl: string;

  @Column({ type: "varchar", length: 500 })
  imageUrl: string;

  @Column({ type: "varchar", length: 1000 })
  downloadUrl: string;

  @Column({ type: "uuid" })
  categoryId: string;

  @ManyToOne(() => CategoryEntity, (category) => category.apps)
  @JoinColumn({ name: "categoryId" })
  category: CategoryEntity;

  @Column({ type: "int", default: 0 })
  downloadCount: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
