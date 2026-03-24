import { Column, Entity, OneToMany } from "typeorm";

import { CoreEntity } from "./base/CoreEntity.js";
import { DatedEntity } from "./base/Dated.js";
import { UserRole } from "./enums/UserRole.js";
import { Penalty } from "./Penalty.js";
import { Property } from "./Property.js";

@Entity("users")
export class User extends CoreEntity {
  @Column({ length: 300, nullable: true, type: "varchar" })
  address?: string;

  @Column({ length: 100, type: "varchar" })
  apellido: string;

  @OneToMany(() => Penalty, (penalty: Penalty) => penalty.client)
  clientPenalties: Penalty[];

  @Column(() => DatedEntity, { prefix: false })
  dated: DatedEntity;

  @Column({ length: 64, type: "varchar", unique: true })
  dni: string;

  @Column({ length: 150, type: "varchar" })
  email: string;

  @OneToMany(() => Penalty, (penalty: Penalty) => penalty.host)
  hostPenalties: Penalty[];

  @Column({ default: 0, type: "int" })
  infractions: number;

  @Column({ default: true, type: "boolean" })
  isActive: boolean;

  @Column({ length: 100, type: "varchar" })
  nombre: string;

  /**
   * Solana on-chain PDA address (base58) that represents this user
   * on the blockchain. Unique identifier bridging DB <-> blockchain.
   */
  @Column({ length: 44, nullable: true, type: "varchar", unique: true })
  pdaKey?: string;

  @Column({ length: 20, nullable: true, type: "varchar" })
  phone?: string;

  @Column({ nullable: true, type: "text" })
  profileImage?: string;

  @OneToMany(() => Property, (property: Property) => property.owner)
  properties: Property[];

  /**
   * User roles stored as a PostgreSQL native enum array.
   * A user can hold multiple roles simultaneously (e.g. HOST + CLIENT).
   * Possible values defined in the UserRole enum.
   */
  @Column({
    array: true,
    default: `{${UserRole.CLIENT}}`,
    enum: UserRole,
    type: "enum",
  })
  roles: UserRole[];

  /**
   * Solana wallet public key (base58 encoded, 32–44 chars).
   * This is the primary auth identifier — no password needed.
   */
  @Column({ length: 44, type: "varchar", unique: true })
  wallet: string;
}
