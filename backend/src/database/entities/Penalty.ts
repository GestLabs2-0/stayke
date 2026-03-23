import { Column, Entity, ManyToOne } from "typeorm";

import { CoreEntity } from "./base/CoreEntity.js";
import { DatedEntity } from "./base/Dated.js";
import { User } from "./User.js";

@Entity("penalties")
export class Penalty extends CoreEntity {
  /** The client (tenant) who received the penalty. */
  @ManyToOne(() => User, (user: User) => user.clientPenalties, { eager: false, nullable: false })
  client: User;

  @Column(() => DatedEntity, { prefix: false })
  dated: DatedEntity;

  /** The host involved in the penalty. */
  @ManyToOne(() => User, (user: User) => user.hostPenalties, { eager: false, nullable: false })
  host: User;

  /** Short description of infraction type (e.g. "PROPERTY_DAMAGE", "NO_SHOW"). */
  @Column({ length: 100, type: "varchar" })
  infractionType: string;

  /**
   * Solana pubkey of the admin/intermediary who issued this penalty.
   * Stored as a string to keep the blockchain reference without a DB join.
   */
  @Column({ length: 44, type: "varchar" })
  issuedBy: string;

  /** Optional longer review/comment describing the penalty in detail. */
  @Column({ nullable: true, type: "text" })
  review?: string;
}
