import { Column, Entity, ManyToOne } from "typeorm";

import { CoreEntity } from "./base/CoreEntity.js";
import { DatedEntity } from "./base/Dated.js";
import { PropertyStatus } from "./enums/PropertyStatus.js";
import { User } from "./User.js";

@Entity("properties")
export class Property extends CoreEntity {
  @Column({ nullable: true, type: "text" })
  comentarios?: string;

  @Column(() => DatedEntity, { prefix: false })
  dated: DatedEntity;

  /** Array of image URLs stored in external storage (e.g. IPFS, S3). */
  @Column({ array: true, default: "{}", type: "text" })
  images: string[];

  @Column({ default: true, type: "boolean" })
  isActive: boolean;

  @Column({ nullable: true, precision: 10, scale: 7, type: "decimal" })
  latitud?: number;

  @Column({ nullable: true, precision: 10, scale: 7, type: "decimal" })
  longitud?: number;

  @Column({ length: 200, type: "varchar" })
  nombre: string;

  /** User entity that owns (hosts) this property. Linked by DB user id. */
  @ManyToOne(() => User, (user: User) => user.properties, { eager: false, nullable: false })
  owner: User;

  /**
   * Solana on-chain PDA address (base58) that represents this property
   * on the blockchain. Unique identifier bridging DB <-> blockchain.
   */
  @Column({ length: 44, type: "varchar", unique: true })
  pdaKey: string;

  @Column({ precision: 10, scale: 2, type: "decimal" })
  pricePerNight: number;

  /**
   * Current status of the property.
   * Only AVAILABLE properties can be edited or deleted by the owner.
   */
  @Column({
    default: PropertyStatus.AVAILABLE,
    enum: PropertyStatus,
    type: "enum",
  })
  status: PropertyStatus;

  @Column({ length: 300, nullable: true, type: "varchar" })
  ubicacion?: string;
}
