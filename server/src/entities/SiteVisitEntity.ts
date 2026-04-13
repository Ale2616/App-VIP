import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("site_visits")
export class SiteVisitEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 45 })
  ip: string;

  @CreateDateColumn({ type: "timestamp" })
  visitedAt: Date;
}
