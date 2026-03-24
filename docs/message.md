## Contexto del proyecto

Stayke es una plataforma de alquileres de corto plazo basada en Solana (hackathon). 
El programa Anchor está desplegado en:
  GwRWqCBjW87B74SeHx3sH8w4WVGdbwc6tCKoSsUsLGqW

El repositorio es el que estás usando
El IDL completo está en anchor/target/idl/stayke.json.
El contrato está en anchor/programs/stayke

El frontend es Next.js. El objetivo es generar un archivo `staykeClient.ts` 
que use **Codama** para interactuar con el programa, eliminando la dependencia 
directa de `@coral-xyz/anchor` en el cliente.

---

## Instrucciones del programa

Las instrucciones del programa son exactamente las siguientes (en snake_case, 
tal como aparecen en el IDL):

| Instrucción           | Args                                    | Firmante principal |
|-----------------------|-----------------------------------------|--------------------|
| initialize_contract   | initial_data: InitialConfig             | signer (deployer)  |
| register_user         | dni_hash: [u8; 32]                      | signer             |
| set_host_status       | status: bool                            | signer             |
| deposit_funds         | amount: u64                             | signer             |
| publish_property      | price_per_night: u64                    | signer             |
| update_property_price | price_per_night: u64                    | signer             |
| add_admin             | new_admin: PublicKey                    | signer             |
| remove_admin          | admin_to_remove: PublicKey              | signer             |
| create_booking        | check_in: i64, check_out: i64          | client             |
| host_pending_accept   | —                                       | host               |
| host_pending_reject   | —                                       | host               |
| accept_reserve        | —                                       | client             |
| client_reject_reserve | —                                       | client             |
| complete_stay         | —                                       | client (guest)     |
| close_booking         | score: u8                               | client             |
| open_dispute          | reason: DisputeReason                   | caller             |
| close_dispute         | —                                       | admin              |
| resolve_dispute       | host_share_bps: u16, rejected: bool     | admin              |
| penalize_user         | severity: PenaltySeverity               | signer (admin)     |

---

## Cuentas PDA — seeds exactas

Derivadas del IDL:
config          → ["config"]
treasury_pda    → ["treasury"]
platform_vault_pda → ["platform_vault"]
treasury_token_account → ["treasury_vault"]
platform_vault_token_account → ["platform_vault_token"]
user_profile    → ["user", dni: Uint8Array(32), owner: PublicKey]
property        → ["property", host: PublicKey, listing_id: u8]
booking         → ["booking", property: PublicKey, guest: PublicKey, check_in: i64 (little-endian 8 bytes)]
booking_days    → ["booking_days", property: PublicKey, check_in: i64 (little-endian 8 bytes)]
(en host_pending_reject: ["booking_days", property: PublicKey, booking_days_pubkey: PublicKey])
dispute         → ["dispute", booking: PublicKey]
escrow_token_account → ["escrow", booking: PublicKey]
client_token_account → ATA estándar (Associated Token Account del client para el mint)

Para los ATAs usa el programa `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`.

---

## Tipos definidos
```typescript
type InitialConfig = {
  admins: PublicKey[];
  retribution_bps_low: number;    // u16
  retribution_bps_medium: number; // u16
  retribution_bps_high: number;   // u16
  minimum_deposit: bigint;         // u64
  fee_bps: number;                 // u16
};

enum DisputeReason {
  PropertyNotAsDescribed,
  CheckInIssues,
  CheckOutIssues,
  CleanlinessIssues,
  NoShow,
  DamageClaim,
  RefundRequest,
  Other,
}

enum PenaltySeverity { Low, Medium, High }

enum BookingStatus { Pending, Confirmed, Rejected, Completed, Disputed }
enum DisputeStatus { Open, Resolved, Rejected }
```

---

## Cuentas (structs on-chain)
```typescript
// UserProfile — PDA: ["user", dni[32], owner]
type UserProfile = {
  owner: PublicKey;
  deposit: bigint;
  deposit_timestamp: bigint;
  dni: Uint8Array;        // [u8; 32]
  is_verified: boolean;
  token_account: PublicKey;
  is_banned: boolean;
  active_booking: PublicKey | null;
  host_reviews: number;
  total_score_host: bigint;
  client_reviews: number;
  total_score_client: bigint;
  hosted_stays: number;
  completed_stays: number;
  is_host: boolean;
  low_infractions: number;
  medium_infractions: number;
  high_infractions: number;
  listing_count: number;
  bump: number;
};

// Property — PDA: ["property", host, listing_id]
type Property = {
  host: PublicKey;
  listing_id: number;         // u8
  price_per_night: bigint;
  hash_state: string;
  booking_active: PublicKey | null;
  bump: number;
};

// Booking — PDA: ["booking", property, guest, check_in]
type Booking = {
  property: PublicKey;
  guest: PublicKey;
  host: PublicKey;
  check_in: bigint;
  check_out: bigint;
  total_price: bigint;
  status: BookingStatus;
  bump: number;
};

// PlatformConfig — PDA: ["config"]
type PlatformConfig = {
  admins: PublicKey[];
  treasury: PublicKey;
  treasury_bump: number;
  platform_vault: PublicKey;
  platform_vault_bump: number;
  usdc_mint: PublicKey;
  fee_bps: number;
  retribution_bps_low: number;
  retribution_bps_medium: number;
  retribution_bps_high: number;
  minimum_deposit: bigint;
  is_initialized: boolean;
  bump: number;
};

// Dispute — PDA: ["dispute", booking]
type Dispute = {
  booking: PublicKey;
  opened_by: PublicKey;
  reason: DisputeReason;
  status: DisputeStatus;
  bump: number;
};
```

---

## Tarea

Genera `staykeClient.ts` con las siguientes funciones exportadas, 
usando **Codama** para construir y enviar todas las instrucciones.

### Setup
```typescript
import { createFromRoot } from "codama";
import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import idl from "./stayke.json";

const codama = createFromRoot(rootNodeFromAnchor(idl));
```

Usa `@solana/kit` (web3.js v2) como capa de transporte, no `@coral-xyz/anchor`.

### Funciones requeridas

**Administración:**
- `initializeContract(signer, initialConfig, usdcMint)`
- `addAdmin(signer, newAdmin)`
- `removeAdmin(signer, adminToRemove)`
- `penalizeUser(signer, penalizedProfilePda, affectedWallet, mint, treasuryTokenAccount, severity)`

**Usuarios:**
- `registerUser(signer, dniHash: Uint8Array)`  
  — dniHash es sha256 del DNI, ya computado off-chain
- `setHostStatus(signer, userProfilePda, status: boolean)`
- `depositFunds(signer, userProfilePda, senderTokenAccount, treasury, mint, amount: bigint)`

**Propiedades:**
- `publishProperty(signer, userProfilePda, pricePerNight: bigint)`
- `updatePropertyPrice(signer, userProfilePda, propertyPda, pricePerNight: bigint)`

**Bookings — flujo completo:**
- `createBooking(client, clientProfilePda, propertyPda, propertyHostPda, checkIn: bigint, checkOut: bigint)`
- `hostPendingAccept(host, propertyHostPda, bookingPda)`
- `hostPendingReject(host, propertyHostPda, guest, bookingPda, bookingDaysPda)`
- `acceptReserve(client, clientProfilePda, propertyPda, bookingPda, mint, clientTokenAccount, escrowTokenAccount)`
- `clientRejectReserve(client, clientProfilePda, bookingPda, bookingDaysPda)`
- `completeStay(client, clientProfilePda, hostProfilePda, propertyPda, bookingPda, escrowTokenAccount, hostTokenAccount, platformVaultTokenAccount, mint)`
- `closeBooking(client, clientProfilePda, hostProfilePda, propertyPda, bookingPda, score: number)`

**Disputas:**
- `openDispute(caller, userProfilePda, bookingPda, disputePda, reason: DisputeReason)`
- `closeDispute(admin, bookingPda, disputePda, hostProfilePda, guestProfilePda, propertyPda)`
- `resolveDispute(admin, bookingPda, disputePda, escrowTokenAccount, hostTokenAccount, guestTokenAccount, platformVaultTokenAccount, mint, hostShareBps: number, rejected: boolean)`

**Helpers de PDA** — exporta también estas funciones utilitarias:
- `pdaConfig(programId)`
- `pdaTreasury(programId)`
- `pdaPlatformVault(programId)`
- `pdaUserProfile(dni: Uint8Array, owner: PublicKey, programId)`
- `pdaProperty(host: PublicKey, listingId: number, programId)`
- `pdaBooking(property: PublicKey, guest: PublicKey, checkIn: bigint, programId)`
- `pdaBookingDays(property: PublicKey, checkIn: bigint, programId)`
- `pdaDispute(booking: PublicKey, programId)`
- `pdaEscrow(booking: PublicKey, programId)`

**Helpers de fetch** — usando los decoders de Codama:
- `fetchUserProfile(rpc, pda): Promise<UserProfile>`
- `fetchProperty(rpc, pda): Promise<Property>`
- `fetchBooking(rpc, pda): Promise<Booking>`
- `fetchConfig(rpc): Promise<PlatformConfig>`
- `fetchDispute(rpc, pda): Promise<Dispute>`

---

## Restricciones

- TypeScript estricto, sin `any`
- No usar `@coral-xyz/anchor` en ningún import
- Todas las instrucciones deben construirse con Codama 
  (`get<InstructionName>InstructionAsync` o equivalent)
- Los PDAs con seeds que incluyan `i64` (check_in) deben serializar 
  el valor como little-endian de 8 bytes
- Exportar `PROGRAM_ID` como constante:
  `export const PROGRAM_ID = "GwRWqCBjW87B74SeHx3sH8w4WVGdbwc6tCKoSsUsLGqW"`

---