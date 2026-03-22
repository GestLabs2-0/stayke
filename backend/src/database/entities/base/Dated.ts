import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export class DatedEntity {
  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
