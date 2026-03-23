import { BaseEntity, PrimaryGeneratedColumn } from "typeorm";

export abstract class CoreEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;
}
