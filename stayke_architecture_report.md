# Stayke — Informe de Arquitectura

> Generado el 24 de marzo de 2026 · Versión 0.1.0

---

## Índice

1. [Visión General](#1-visión-general)
2. [Backend — `backend/`](#2-backend)
3. [Frontend — `stayke-front/`](#3-frontend)
4. [Programa Solana (On-Chain)](#4-programa-solana-on-chain)
5. [Flujo de Integración End-to-End](#5-flujo-de-integración-end-to-end)
6. [Herramienta de Debug — `anchor-caller.html`](#6-herramienta-de-debug--anchor-callerhtml)

---

## 1. Visión General

**Stayke** es una plataforma de alquiler de propiedades cuya diferencia principal es el uso del **blockchain Solana** como capa de confianza. Cada usuario y cada propiedad tienen una representación dual:

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Off-chain | PostgreSQL + Express REST API | Metadatos legibles (nombres, fotos, precios) |
| On-chain | Solana Program (Anchor) | Identidad, depósitos de garantía, reservas, disputas |
| Frontend | Next.js 14 (App Router) | UI + orquestación de ambas capas |

---

## 2. Backend

### 2.1 Stack

| Pieza | Descripción |
|------|-------------|
| **Runtime** | Node.js (via `ts-node`) |
| **Framework** | Express 5 |
| **ORM** | TypeORM |
| **BD** | PostgreSQL |
| **Lenguaje** | TypeScript estricto |
| **Package Manager** | pnpm / yarn |

### 2.2 Estructura de Directorios

```
backend/src/
├── controllers/       # Lógica de negocio por dominio
│   ├── user.ts
│   ├── property.ts
│   └── solana.ts
├── database/
│   ├── entities/      # Entidades TypeORM (User, Property, Penalty)
│   ├── repositories/  # Helpers de repositorio
│   ├── appDataSource.ts
│   └── databaseConfig.ts
├── middlewares/       # Validación de cuerpos (express-validator)
├── routes/            # Registro de rutas HTTP
│   ├── index.ts       # Mountpoint centralizado
│   ├── user.routes.ts
│   ├── property.routes.ts
│   └── solana.routes.ts
├── solana/            # Helpers de integración Solana (derivar PDAs)
│   ├── userProgram.ts
│   └── propertyProgram.ts
├── utils/             # hashDni, responseAndLogger, etc.
├── server.ts          # Clase Server (Express wrapper)
└── index.ts           # Entry point
```

### 2.3 Entidades de Base de Datos

#### [User](file:///home/jose/Desktop/stayke/stayke-front/src/types/AuthContex.ts#10-24) — tabla `users`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| [id](file:///home/jose/Desktop/stayke/backend/src/server.ts#45-48) | UUID | PK (CoreEntity) |
| `wallet` | varchar(44) UNIQUE | Clave pública Solana — auth principal |
| `nombre` | varchar(100) | Nombre |
| `apellido` | varchar(100) | Apellido |
| `email` | varchar(150) | Email |
| `dni` | varchar(64) UNIQUE | SHA-256 del DNI raw |
| `pdaKey` | varchar(44) UNIQUE | Dirección PDA on-chain |
| `roles` | enum[] | `CLIENT` \| `HOST` \| `ADMIN` |
| `isActive` | boolean | Soft-delete flag |
| `phone` | varchar(20) | Opcional |
| `profileImage` | text | URL de avatar |
| `address` | varchar(300) | Dirección física |
| `infractions` | int | Contador de infracciones |

#### [Property](file:///home/jose/Desktop/stayke/backend/src/database/entities/Property.ts#8-60) — tabla `properties`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| [id](file:///home/jose/Desktop/stayke/backend/src/server.ts#45-48) | UUID | PK |
| `nombre` | varchar(200) | Nombre de la propiedad |
| `ubicacion` | varchar(300) | Ubicación textual |
| `latitud` / `longitud` | decimal | Coordenadas GPS |
| `pricePerNight` | decimal(10,2) | Precio en USD |
| `images` | text[] | URLs de imágenes |
| `comentarios` | text | Descripción libre |
| `pdaKey` | varchar(44) UNIQUE | PDA on-chain de la propiedad |
| [status](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#65-68) | enum | `AVAILABLE` \| `BOOKED` \| `INACTIVE` |
| `owner` | FK → User | Relación ManyToOne |
| `isActive` | boolean | Soft-delete flag |

### 2.4 API REST

**Base URL**: `http://localhost:<PORT>/api/v1`

#### Usuarios — `/api/v1/users`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/` | Lista todos los usuarios | — |
| `POST` | `/` | Registra un nuevo usuario | — |
| `POST` | `/admin` | Crea un administrador | `adminSecret` en body |
| `GET` | `/:wallet` | Busca usuario por wallet | — |
| `PUT` | `/:wallet` | Actualiza perfil | owner o ADMIN |
| `DELETE` | `/:wallet` | Elimina usuario | ADMIN |

**Body `POST /`**:
```json
{
  "wallet": "Base58PubKey",
  "nombre": "string",
  "apellido": "string",
  "email": "string",
  "dni": "string (raw, se hashea en backend)",
  "isHost": true,
  "phone": "opcional",
  "profileImage": "URL opcional"
}
```

**Respuesta `GET /:wallet`**:
```json
{ "exists": true, "user": { ... } }
// ó
{ "exists": false }
```

#### Propiedades — `/api/v1/properties`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/` | Lista todas las propiedades | — |
| `POST` | `/` | Registra propiedad off-chain | owner validado por middleware |
| `GET` | `/:wallet` | Propiedades de un usuario | — |
| `PUT` | [/:id](file:///home/jose/Desktop/stayke/backend/src/server.ts#45-48) | Actualiza propiedad (solo `AVAILABLE`) | owner o ADMIN |
| `DELETE` | [/:id](file:///home/jose/Desktop/stayke/backend/src/server.ts#45-48) | Elimina propiedad (solo `AVAILABLE`) | owner o ADMIN |

**Body `POST /`**:
```json
{
  "ownerWallet": "Base58PubKey",
  "nombre": "string",
  "ubicacion": "string",
  "pricePerNight": 150.00,
  "images": ["url1", "url2"],
  "latitud": -34.6037,
  "longitud": -58.3816
}
```

> [!NOTE]
> El backend deriva la `pdaKey` de la propiedad en el servidor usando `initPropertyPDA(ownerWallet, ownerCount)`.

#### Solana — `/api/v1/solana`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/init-ata` | Inicializa ATA de Mock USDC para el wallet |
| `POST` | `/transfer-token` | Simula transferencia de tokens |

### 2.5 Flujo de Registro de Usuario (Backend)

```
POST /api/v1/users
  │
  ├─ Validar body (middleware)
  ├─ Verificar wallet no duplicada
  ├─ SHA-256(dni) → dniHash
  ├─ Verificar dniHash no duplicado
  ├─ initUserPDA(wallet, dniHash) → pdaKey  ← Derivar PDA Solana
  ├─ repo.create({ wallet, nombre, ..., pdaKey, roles })
  └─ repo.save() → 201
```

---

## 3. Frontend

### 3.1 Stack

| Pieza | Descripción |
|------|-------------|
| **Framework** | Next.js 14 (App Router) |
| **Lenguaje** | TypeScript estricto |
| **Solana SDK** | `@solana/kit` (web3.js v2 — Codama) |
| **Wallet** | `@solana/react-hooks` (Phantom) |
| **Estilos** | Vanilla CSS + CSS Variables |

### 3.2 Estructura de Directorios

```
stayke-front/src/
├── app/                   # Rutas Next.js (App Router)
│   ├── page.tsx           # Home / Explorar listings
│   ├── register/          # Flujo de registro de usuario
│   ├── list-property/     # Crear nueva propiedad
│   ├── profile/           # Perfil de usuario
│   ├── bookings/          # Mis reservas
│   └── listing/[id]/      # Detalle de propiedad
├── client/                # Capa de interacción Solana
│   ├── rpc.ts             # Conexión RPC
│   ├── pdas.ts            # Helpers para derivar PDAs
│   ├── fetchers.ts        # Fetchers de cuentas on-chain
│   └── staykeClient.ts    # Cliente unificado del programa
├── Context/
│   └── AuthContext.tsx    # Estado global de usuario + wallet
├── Hooks/
│   ├── solana/            # Hooks de transacciones on-chain
│   │   ├── useStaykeProgram.ts  # Proveedor de signer
│   │   ├── useRegisterUser.ts   # Registro de usuario on-chain
│   │   ├── useProperty.ts       # Publicar/actualizar propiedad
│   │   ├── useDeposit.ts        # Garantía USDC
│   │   ├── useBooking.ts        # Ciclo de vida de reservas
│   │   └── useDispute.ts        # Disputas
│   ├── useSolanaBalance.tsx     # SOL balance
│   ├── useTokenBalance.tsx      # USDC balance (SPL)
│   └── useUserOnChain.tsx       # Verificar cuenta on-chain
├── generated/stayke/      # Código auto-generado por Codama
│   ├── accounts/          # Decoders de cuentas (UserProfile, Property, ...)
│   ├── instructions/      # Builders de instrucciones
│   └── types/             # Tipos (enums, structs)
├── helpers/
│   ├── mapUser.ts         # BackendUser → AuthContext User
│   ├── mapProperty.ts     # BackendProperty → ListingCard
│   ├── crypto.ts          # hashString() via SubtleCrypto
│   └── apiError.ts        # handleApiError()
├── services/
│   ├── apiService.ts      # HTTP client base
│   ├── userService.ts     # CRUD usuarios contra backend
│   ├── propertyService.ts # CRUD propiedades contra backend
│   └── solanaService.ts   # Endpoints Solana del backend
└── types/
    ├── AuthContex.ts      # Interfaces User, Review, etc.
    └── api.ts             # BackendUser, BackendProperty, payloads
```

### 3.3 Capa de Servicios (Off-Chain)

Los servicios hacen HTTP al backend REST. Todos usan [apiService.ts](file:///home/jose/Desktop/stayke/stayke-front/src/services/apiService.ts) como base.

#### [userService.ts](file:///home/jose/Desktop/stayke/stayke-front/src/services/userService.ts)

| Método | Backend | Descripción |
|--------|---------|-------------|
| [getUserByWallet(wallet)](file:///home/jose/Desktop/stayke/stayke-front/src/services/userService.ts#9-22) | `GET /users/:wallet` | Auth al iniciar sesión |
| [createUser(payload)](file:///home/jose/Desktop/stayke/stayke-front/src/services/userService.ts#23-35) | `POST /users` | Registro off-chain |

#### [propertyService.ts](file:///home/jose/Desktop/stayke/stayke-front/src/services/propertyService.ts)

| Método | Backend | Descripción |
|--------|---------|-------------|
| [listAllProperties()](file:///home/jose/Desktop/stayke/backend/src/controllers/property.ts#61-81) | `GET /properties` | Explorar listings |
| [listPropertiesByUser(wallet)](file:///home/jose/Desktop/stayke/backend/src/controllers/property.ts#84-107) | `GET /properties/:wallet` | Mis propiedades |
| [createProperty(payload)](file:///home/jose/Desktop/stayke/stayke-front/src/services/propertyService.ts#31-44) | `POST /properties` | Publicar propiedad |
| [updateProperty(id, wallet, updates)](file:///home/jose/Desktop/stayke/stayke-front/src/services/propertyService.ts#45-60) | `PUT /properties/:id` | Editar |
| [deleteProperty(id, wallet)](file:///home/jose/Desktop/stayke/stayke-front/src/services/propertyService.ts#61-73) | `DELETE /properties/:id` | Eliminar |

#### [solanaService.ts](file:///home/jose/Desktop/stayke/stayke-front/src/services/solanaService.ts)

| Método | Backend | Descripción |
|--------|---------|-------------|
| [initATA(wallet)](file:///home/jose/Desktop/stayke/stayke-front/src/services/solanaService.ts#8-17) | `POST /solana/init-ata` | Inicializar token account |
| [transferToken(from, to, amount)](file:///home/jose/Desktop/stayke/stayke-front/src/services/solanaService.ts#18-27) | `POST /solana/transfer-token` | Simular transferencia |

### 3.4 Hooks On-Chain (Solana)

Todos los hooks siguen el mismo patrón:
- Obtienen el `signer` de [useStaykeProgram()](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useStaykeProgram.ts#8-26) (vía Phantom)
- Devuelven `{ fn(...), loading, error }`
- Usan [staykeClient.ts](file:///home/jose/Desktop/stayke/stayke-front/src/client/staykeClient.ts) para construir y enviar las transacciones

#### [useRegisterUser](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useRegisterUser.ts#15-80)

```typescript
register(firstName, lastName, email, dni, dniHash: Uint8Array)
  → staykeClient.registerUser() → tx on-chain
  → userService.createUser()   → POST /backend
  → setUser(mappedUser)        → actualiza AuthContext
```

#### [useProperty](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useProperty.ts#7-81)

| Función | Instrucción on-chain |
|---------|---------------------|
| [publishProperty(pdaKey, listingId, pricePerNight)](file:///home/jose/Desktop/stayke/stayke-front/src/client/staykeClient.ts#131-150) | [register_property](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#38-41) |
| [updatePrice(pdaKey, listingId, newPrice)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useProperty.ts#47-78) | [update_property_price](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#46-52) |

#### [useDeposit](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useDeposit.ts#7-85)

| Función | Instrucción on-chain |
|---------|---------------------|
| [deposit(dniHash, amount, senderATA, mint)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useDeposit.ts#15-48) | [deposit_funds](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#57-60) |
| [withdraw(pdaKey, amount, receiverATA, mint)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useDeposit.ts#49-82) | [withdraw_guarantee](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#61-64) |

#### [useBooking](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useBooking.ts#7-266)

| Función | Instrucción on-chain |
|---------|---------------------|
| [createBooking(...)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useBooking.ts#15-50) | [create_booking](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#73-80) |
| [hostAccept(...)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useBooking.ts#51-73) | `host_accept_booking` |
| [hostReject(...)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useBooking.ts#74-109) | `host_reject_booking` |
| [activateBooking(...)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useBooking.ts#110-145) | [accept_reserve](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#89-92) |
| [completeStay(...)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useBooking.ts#146-183) | [complete_stay](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#97-100) |
| [closeBooking(...)](file:///home/jose/Desktop/stayke/stayke-front/src/client/staykeClient.ts#290-311) | [close_booking](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#101-104) |
| [clientReject(...)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useBooking.ts#220-253) | [client_reject_reserve](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#93-96) |

#### [useDispute](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useDispute.ts#8-124)

| Función | Instrucción on-chain |
|---------|---------------------|
| [openDispute(pdaKey, bookingPda, reason)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useDispute.ts#16-47) | [open_dispute](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#109-112) |
| [resolveDispute(...)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useDispute.ts#48-87) | [resolve_dispute](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#113-120) |
| [closeDispute(...)](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useDispute.ts#88-121) | [close_dispute](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#121-124) |

### 3.5 Vistas y su Integración

| Página | Off-chain | On-chain |
|--------|-----------|----------|
| `/` | `propertyService.listAllProperties()` | — |
| `/register` | `userService.createUser()` | `useRegisterUser.register()` |
| `/list-property` | `propertyService.createProperty()` | `useProperty.publishProperty()` |
| `/profile` | `propertyService.listPropertiesByUser()` | `useDeposit.deposit()` |
| `/bookings` | (mock data, pendiente) | `useBooking.activateBooking()` / [completeStay()](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useBooking.ts#146-183) |
| `/listing/:id` | datos estáticos / backend | — |

---

## 4. Programa Solana (On-Chain)

- **Program ID**: `GwRWqCBjW87B74SeHx3sH8w4WVGdbwc6tCKoSsUsLGqW`
- **Framework**: Anchor 0.30
- **Red**: Devnet
- **Mint USDC (devnet)**: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

### 4.1 Cuentas (PDAs)

| Cuenta | Seeds | Descripción |
|--------|-------|-------------|
| [UserProfile](file:///home/jose/Desktop/stayke/stayke-front/src/generated/stayke/accounts/userProfile.ts#62-85) | `["user", dni_hash[32], wallet]` | Perfil de usuario on-chain |
| [Property](file:///home/jose/Desktop/stayke/backend/src/database/entities/Property.ts#8-60) | `["property", user_profile_pda, listing_id:u8]` | Propiedad listada |
| [Booking](file:///home/jose/Desktop/stayke/stayke-front/src/app/bookings/page.tsx#22-33) | `["booking", property_pda, client_wallet, check_in:i64]` | Reserva |
| [BookingDays](file:///home/jose/Desktop/stayke/stayke-front/src/client/pdas.ts#84-94) | `["booking_days", property_pda, year_month:u32]` | Disponibilidad mensual |
| [Dispute](file:///home/jose/Desktop/stayke/stayke-front/src/Hooks/solana/useDispute.ts#8-124) | `["dispute", booking_pda]` | Disputa abierta |
| `PlatformConfig` | `["config"]` | Configuración global del protocolo |

### 4.2 Instrucciones Principales

| Instrucción | Descripción |
|-------------|-------------|
| [initialize_contract](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#27-33) | Admin: inicializa la plataforma con config, treasury y vault |
| [register_user](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#34-37) | Registra perfil de usuario (requiere DNI hash) |
| [deposit_funds](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#57-60) | Deposita garantía USDC en treasury |
| [withdraw_guarantee](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#61-64) | Retira garantía cuando no hay reservas activas |
| [register_property](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#38-41) | Publica propiedad on-chain |
| [update_property_price](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#46-52) | Actualiza precio por noche |
| [create_booking](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#73-80) | Crea reserva (estado: Pending) |
| `host_accept_booking` | Host acepta (estado: HostAccepted) |
| `host_reject_booking` | Host rechaza |
| [accept_reserve](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#89-92) | Guest paga (estado: Active) |
| [complete_stay](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#97-100) | Guest confirma estadía, fondos liberados al host |
| [close_booking](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#101-104) | Cierra y califica (estado: Completed) |
| [open_dispute](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#109-112) | Abre disputa (estado: Disputed) |
| [resolve_dispute](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#113-120) | Admin resuelve con reparto configurable |
| [close_dispute](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#121-124) | Admin cierra la disputa |
| [add_admin](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#129-132) / [remove_admin](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#133-136) | Gestión de administradores |
| [penalize_user](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#141-144) | Admin penaliza con severity Low/Medium/High |

### 4.3 Ciclo de Vida de una Reserva

```
create_booking (Pending)
  → host_accept_booking (HostAccepted) ─── host_reject_booking (Cancelled)
  → accept_reserve (Active)
  → complete_stay (Completed)          ─── open_dispute (Disputed)
  → close_booking (score 1-5)                → resolve_dispute
                                             → close_dispute
```

### 4.4 `InitialConfig` (para [initialize_contract](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#27-33))

```json
{
  "admins": ["wallet_pubkey_admin"],
  "retribution_bps_low": 1000,
  "retribution_bps_medium": 2000,
  "retribution_bps_high": 3000,
  "minimum_deposit": 1000000,
  "fee_bps": 300
}
```

> Los valores `*_bps` son basis points (10000 = 100%). `minimum_deposit` está en unidades USDC mínimas (1e6 = 1 USDC con 6 decimales).

---

## 5. Flujo de Integración End-to-End

### Ejemplo: Registro de nuevo usuario

```
[Browser/Phantom]
  1. Usuario conecta wallet
  2. Completa formulario (nombre, apellido, DNI, email)
  
[Frontend — /register/page.tsx]
  3. hashString(dni) → Uint8Array (SHA-256 via SubtleCrypto)
  4. useRegisterUser.register(...)

[useRegisterUser.ts]
  5. staykeClient.registerUser(signer, dniHash, ...)
     └── Instrucción on-chain: register_user
         └── Verifica PDA UserProfile no existe
         └── Crea cuenta UserProfile on-chain
  6. userService.createUser({ wallet, dni_raw, ... })
     └── POST /api/v1/users
         └── backend hashDni(dni_raw) → SHA-256
         └── initUserPDA(wallet, dniHash) → deriva pdaKey
         └── Guarda en DB
  7. setUser(mapBackendUserToUser(backendUser))
     └── Actualiza AuthContext → UI actualizada
```

### Ejemplo: Publicar propiedad (Host)

```
[Frontend — /list-property/page.tsx]
  1. fetchUserProfileAccount(user.pdaKey)
     └── Lee cuenta on-chain → obtiene listingCount
  2. useProperty.publishProperty(pdaKey, listingCount, price)
     └── staykeClient.registerProperty(signer, ...)
         └── Instrucción on-chain: register_property
  3. getPdaProperty(pdaKey, listingCount) → propertyPdaKey
  4. propertyService.createProperty({ ...form, pdaKey: propertyPdaKey })
     └── POST /api/v1/properties
```

---

## 6. Herramienta de Debug — [anchor-caller.html](file:///home/jose/Desktop/stayke/stayke-front/anchor-caller.html)

Archivo estático HTML/JS sin framework para testear el programa Solana directamente.

### Funcionalidades

| Sección | Descripción |
|---------|-------------|
| **IDL Loader** | Pegar o cargar [stayke.json](file:///home/jose/Desktop/stayke/stayke-front/anchor/target/idl/stayke.json) → parsea instrucciones automáticamente |
| **Instruction Cards** | Una tarjeta por instrucción con campos para cuentas y argumentos |
| **PDA Calculator** | Panel lateral con calculadoras para cada PDA del protocolo |
| **Console** | Log en tiempo real de PDAs derivadas y resultados de tx |
| **Fetch Accounts** | Decodifica cuentas on-chain con el decoder Borsh del IDL |

### PDAs disponibles en el calculador

| PDA | Seeds |
|-----|-------|
| `user_profile` | `["user", SHA256(dni), wallet]` |
| [register_property](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#38-41) | `["property", profile_pda, listing_count:u8]` |
| [create_booking](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#73-80) | `["booking", property_pda, client_pda, check_in:i64_le]` |
| `booking_days` | `["booking_days", property_pda, year_month:u32_le]` |
| [open_dispute](file:///home/jose/Desktop/stayke/stayke-front/anchor/programs/stayke/src/lib.rs#109-112) | `["dispute", booking_pda]` |

### Uso básico

1. Abrir [anchor-caller.html](file:///home/jose/Desktop/stayke/stayke-front/anchor-caller.html) en el navegador (file:// o servidor local)
2. Pegar el contenido de [anchor/target/idl/stayke.json](file:///home/jose/Desktop/stayke/stayke-front/anchor/target/idl/stayke.json) en el panel IDL
3. Click **parse →**
4. Conectar Phantom (red Devnet)
5. Expandir la instrucción deseada, completar campos, click **call**

---

## Resumen de Dependencias Inter-Capa

```
Blockchain (Solana Devnet)
    ↑ instrucciones firmadas con Phantom
    │
Frontend (Next.js)
    ├── staykeClient.ts ──→ @solana/kit + Codama generated/
    ├── Hooks/solana/  ──→ staykeClient.ts
    ├── services/      ──→ backend REST API (axios/fetch)
    └── AuthContext    ──→ estado reactivo
         ↕
Backend (Express/TypeORM)
    ├── controllers/   ──→ repositories (TypeORM)
    ├── solana/        ──→ deriva PDAs (helper)
    └── database/      ──→ PostgreSQL
```
