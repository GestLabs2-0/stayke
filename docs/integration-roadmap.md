# Roadmap de Integración Frontend ↔ Backend — Stayke

Este documento guía la integración de los endpoints del backend (`/api-v1`) con el frontend Next.js de Stayke (`stayke-front`). Está estructurado por fases y sigue el mismo patrón de servicios documentado en [`service.md`](./service.md).

> **Base URL del backend:** `http://localhost:3030/api-v1`  
> **Prefijo de rutas:** `/api-v1/users` y `/api-v1/properties`

---

## 📋 Resumen de Endpoints Disponibles

### 👤 Usuarios — `/api-v1/users`

| Método | Ruta                        | Descripción                                              | Body requerido                                                                |
| ------ | --------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/`                         | Listar todos los usuarios                                | —                                                                             |
| POST   | `/`                         | Registrar un nuevo usuario                               | `wallet, firstName, lastName, email?, phone?, address?, dni?, profileImage?` |
| POST   | `/admin`                    | Crear usuario administrador                              | `wallet, firstName, lastName, email, adminSecret`                            |
| GET    | `/:wallet`                  | Verificar si un usuario existe                           | —                                                                             |
| PUT    | `/:wallet`                  | Actualizar perfil del usuario                            | `requesterWallet` + campos a actualizar                                       |
| DELETE | `/:wallet`                  | Eliminar usuario (solo ADMIN)                            | `requesterWallet`                                                             |

### 🏠 Propiedades — `/api-v1/properties`

| Método | Ruta                        | Descripción                                             | Body requerido                                      |
| ------ | --------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| POST   | `/`                         | Registrar nueva propiedad off-chain                     | Datos de la propiedad + `ownerWallet`               |
| GET    | `/`                         | Listar todas las propiedades                            | —                                                   |
| GET    | `/:wallet`                  | Listar propiedades de un usuario específico             | —                                                   |
| PUT    | `/:id`                      | Actualizar propiedad (owner o ADMIN, solo si AVAILABLE) | `requesterWallet` + campos a actualizar             |
| DELETE | `/:id`                      | Eliminar propiedad (owner o ADMIN, solo si AVAILABLE)   | `requesterWallet`                                   |

---

## 🗺️ Fases del Roadmap

---

## Fase 1 — Configuración Base del Servicio API

**Objetivo:** Crear la infraestructura de servicios en el frontend siguiendo el patrón de `service.md`, antes de conectar ninguna vista.

### 1.1 Variables de entorno

Crear o verificar el archivo `.env.local` en `stayke-front/`:

```bash
# stayke-front/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3030
NEXT_PUBLIC_API_TIMEOUT=10000
```

### 1.2 Constantes de API

Crear `stayke-front/src/constants/api.ts` con los endpoints tipados:

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030",
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"),
  ENDPOINTS: {
    // Usuarios
    USERS: "/api-v1/users",
    USER_BY_WALLET: (wallet: string) => `/api-v1/users/${wallet}`,
    ADMIN_USER: "/api-v1/users/admin",

    // Propiedades
    PROPERTIES: "/api-v1/properties",
    PROPERTIES_BY_WALLET: (wallet: string) => `/api-v1/properties/${wallet}`,
    PROPERTY_BY_ID: (id: string | number) => `/api-v1/properties/${id}`,
  },
} as const;
```

### 1.3 Tipos TypeScript

Crear `stayke-front/src/types/api.ts` con los tipos que devuelve el backend:

```typescript
// Respuesta genérica del backend
export interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
  errors?: Record<string, string>;
}

// Entidad User (conforme al backend)
export interface BackendUser {
  id: string;
  wallet: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  role: "CLIENT" | "HOST" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

// Payload para crear usuario
export interface CreateUserPayload {
  wallet: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  dni?: string;
  profileImage?: string;
}

// Entidad Property (conforme al backend)
export interface BackendProperty {
  id: number;
  ownerWallet: string;
  pdaKey: string;
  title: string;
  description?: string;
  location: string;
  pricePerNight: number;
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE";
  createdAt: string;
  updatedAt: string;
}

// Payload para crear propiedad
export interface CreatePropertyPayload {
  ownerWallet: string;
  pdaKey: string;
  title: string;
  description?: string;
  location: string;
  pricePerNight: number;
}
```

### 1.4 Servicio base

Crear `stayke-front/src/services/apiService.ts` con el patrón Singleton:

```typescript
import { API_CONFIG } from "@/src/constants/api";
import type { ApiResponse } from "@/src/types/api";

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Exponer métodos HTTP
  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "DELETE",
      ...(body && { body: JSON.stringify(body) }),
    });
  }
}

export const apiService = new ApiService();
```

---

## Fase 2 — Integración de APIs de Usuario

**Objetivo:** Conectar los endpoints de `/api-v1/users` con las vistas y contextos del frontend.

### 2.1 Servicio de usuarios

Crear `stayke-front/src/services/userService.ts`:

```typescript
import { apiService } from "./apiService";
import { API_CONFIG } from "@/src/constants/api";
import type {
  BackendUser,
  CreateUserPayload,
  ApiResponse,
} from "@/src/types/api";

class UserService {
  /**
   * Verifica si un usuario ya está registrado por su wallet.
   * GET /api-v1/users/:wallet
   */
  async getUserByWallet(
    wallet: string
  ): Promise<{ exists: boolean; user?: BackendUser }> {
    const res = await apiService.get<{ exists: boolean; user?: BackendUser }>(
      API_CONFIG.ENDPOINTS.USER_BY_WALLET(wallet)
    );
    return res.data;
  }

  /**
   * Registra un nuevo usuario.
   * POST /api-v1/users
   */
  async createUser(payload: CreateUserPayload): Promise<BackendUser> {
    const res = await apiService.post<BackendUser>(
      API_CONFIG.ENDPOINTS.USERS,
      payload
    );
    return res.data;
  }

  /**
   * Actualiza los datos del usuario (parcial).
   * PUT /api-v1/users/:wallet
   */
  async updateUser(
    wallet: string,
    requesterWallet: string,
    updates: Partial<CreateUserPayload>
  ): Promise<BackendUser> {
    const res = await apiService.put<BackendUser>(
      API_CONFIG.ENDPOINTS.USER_BY_WALLET(wallet),
      { requesterWallet, ...updates }
    );
    return res.data;
  }

  /**
   * Lista todos los usuarios (uso administrativo).
   * GET /api-v1/users
   */
  async listAllUsers(): Promise<BackendUser[]> {
    const res = await apiService.get<BackendUser[]>(API_CONFIG.ENDPOINTS.USERS);
    return res.data;
  }
}

export const userService = new UserService();
```

### 2.2 Puntos de integración en el Frontend — Usuarios

#### 📍 `WalletButton.tsx` — Verificación al conectar wallet

Al conectar la wallet, verificar si el usuario ya está registrado en el backend. Si no, redirigir a `/register`.

**Flujo actual:** El componente usa `useAuth().login(...)` → llama a `mockLogin`.  
**Flujo objetivo:**
1. Conectar wallet → obtener `address`
2. Llamar `userService.getUserByWallet(address)`
3. Si `exists: true` → setear usuario en contexto y navegar a `/profile`
4. Si `exists: false` → navegar a `/register` para nuevo registro

```typescript
// En AuthContext.tsx — reemplazar mockLogin:
const login = async (address: string) => {
  const { exists, user } = await userService.getUserByWallet(address);
  if (exists && user) {
    setUserState(mapBackendUserToUser(user)); // adaptar tipos
    return { registered: true };
  }
  return { registered: false };
};
```

#### 📍 `/register/page.tsx` — Registro de nuevo usuario

**Flujo actual:** `handleSubmit` llama a `registerUser(payload)` → `mockRegister`.  
**Flujo objetivo:** Reemplazar `mockRegister` en `AuthContext` por llamada real al backend.

```typescript
// En AuthContext.tsx — reemplazar mockRegister:
const registerUser = async (data: RegisterPayload) => {
  try {
    const backendUser = await userService.createUser({
      wallet: data.wallet,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      dni: data.dni,
    });
    setUserState(mapBackendUserToUser(backendUser));
    return { success: true };
  } catch (error) {
    console.error("[register] Error:", error);
    return { success: false };
  }
};
```

**Campos del formulario actual vs backend:**

| Campo front (`RegisterFormData`) | Campo backend (`CreateUserPayload`) | Estado       |
| -------------------------------- | ----------------------------------- | ------------ |
| `wallet`                         | `wallet`                            | ✅ Mapeado   |
| `firstName`                      | `firstName`                         | ✅ Mapeado   |
| `lastName`                       | `lastName`                          | ✅ Mapeado   |
| `email`                          | `email`                             | ✅ Mapeado   |
| `phone`                          | `phone`                             | ✅ Mapeado   |
| `address`                        | `address`                           | ✅ Mapeado   |
| `dni`                            | `dni`                               | ✅ Mapeado   |
| `image`                          | `profileImage`                      | ⚠️ Renombrar |
| `isHost`                         | (no existe campo directo)           | ⚠️ Ver nota  |

> **Nota `isHost`:** El backend maneja roles internamente. Verificar si se puede enviar como `roles: ["HOST", "CLIENT"]` en el cuerpo del POST, o si es un campo editable vía `PUT`.

#### 📍 `/profile/page.tsx` — Visualización de perfil

**Flujo actual:** Usa datos del contexto (`useAuth().user`), que vienen del mock.  
**Flujo objetivo:** El perfil se pobla automáticamente desde el contexto una vez que `login` obtenga datos reales del backend. No requiere llamada directa adicional, pero se necesita la función adaptadora de tipos:

```typescript
// stayke-front/src/helpers/mapUser.ts
import type { BackendUser } from "@/src/types/api";
import type { User } from "@/src/types/AuthContex";

export const mapBackendUserToUser = (backendUser: BackendUser): User => ({
  id: backendUser.id,
  firstName: backendUser.firstName,
  lastName: backendUser.lastName,
  email: backendUser.email,
  wallet: backendUser.wallet,
  isHost: backendUser.role === "HOST" || backendUser.role === "ADMIN",
  reputation: 0, // campo futuro
  reviews: [],   // campo futuro
  phone: backendUser.phone,
  image: backendUser.profileImage,
});
```

---

## Fase 3 — Integración de APIs de Propiedades

**Objetivo:** Conectar los endpoints de `/api-v1/properties` con las vistas de exploración y listado.

### 3.1 Servicio de propiedades

Crear `stayke-front/src/services/propertyService.ts`:

```typescript
import { apiService } from "./apiService";
import { API_CONFIG } from "@/src/constants/api";
import type {
  BackendProperty,
  CreatePropertyPayload,
} from "@/src/types/api";

class PropertyService {
  /**
   * Lista todas las propiedades disponibles.
   * GET /api-v1/properties
   */
  async listAllProperties(): Promise<BackendProperty[]> {
    const res = await apiService.get<BackendProperty[]>(
      API_CONFIG.ENDPOINTS.PROPERTIES
    );
    return res.data;
  }

  /**
   * Lista propiedades de un usuario específico.
   * GET /api-v1/properties/:wallet
   */
  async listPropertiesByUser(wallet: string): Promise<BackendProperty[]> {
    const res = await apiService.get<BackendProperty[]>(
      API_CONFIG.ENDPOINTS.PROPERTIES_BY_WALLET(wallet)
    );
    return res.data;
  }

  /**
   * Registra una nueva propiedad off-chain.
   * POST /api-v1/properties
   */
  async createProperty(
    payload: CreatePropertyPayload
  ): Promise<BackendProperty> {
    const res = await apiService.post<BackendProperty>(
      API_CONFIG.ENDPOINTS.PROPERTIES,
      payload
    );
    return res.data;
  }

  /**
   * Actualiza una propiedad (solo si estado es AVAILABLE).
   * PUT /api-v1/properties/:id
   */
  async updateProperty(
    id: number,
    requesterWallet: string,
    updates: Partial<CreatePropertyPayload>
  ): Promise<BackendProperty> {
    const res = await apiService.put<BackendProperty>(
      API_CONFIG.ENDPOINTS.PROPERTY_BY_ID(id),
      { requesterWallet, ...updates }
    );
    return res.data;
  }

  /**
   * Elimina una propiedad (solo si estado es AVAILABLE).
   * DELETE /api-v1/properties/:id
   */
  async deleteProperty(
    id: number,
    requesterWallet: string
  ): Promise<void> {
    await apiService.delete(API_CONFIG.ENDPOINTS.PROPERTY_BY_ID(id), {
      requesterWallet,
    });
  }
}

export const propertyService = new PropertyService();
```

### 3.2 Puntos de integración en el Frontend — Propiedades

#### 📍 `/listPropertys/page.tsx` — Explorar propiedades

**Flujo actual:** Renderiza las `listings` hardcodeadas desde `constants.ts`.  
**Flujo objetivo:** Reemplazar el array estático por llamada real a `propertyService.listAllProperties()`.

```typescript
// Hook propuesto para /listPropertys/page.tsx
"use client";
import { useEffect, useState } from "react";
import { propertyService } from "@/src/services/propertyService";
import type { BackendProperty } from "@/src/types/api";

// Dentro del componente:
const [properties, setProperties] = useState<BackendProperty[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  propertyService
    .listAllProperties()
    .then(setProperties)
    .finally(() => setLoading(false));
}, []);
```

**Campos hardcodeados vs backend:**

| Campo mock (constants.ts) | Campo backend (`BackendProperty`) | Estado             |
| ------------------------- | --------------------------------- | ------------------ |
| `id`                      | `id`                              | ✅ Mapeado         |
| `image`                   | (no existe en backend aún)        | ⚠️ Campo futuro    |
| `title`                   | `title`                           | ✅ Mapeado         |
| `location`                | `location`                        | ✅ Mapeado         |
| `price`                   | `pricePerNight`                   | ⚠️ Renombrar       |
| `rating`                  | (no existe en backend aún)        | ⚠️ Campo futuro    |
| `reviews`                 | (no existe en backend aún)        | ⚠️ Campo futuro    |
| `description`             | `description`                     | ✅ Mapeado         |

#### 📍 Perfil de Host — Mis propiedades (sección futura)

En `/profile/page.tsx` existe espacio para mostrar las propiedades del usuario logueado. Una sección "My Properties" puede usar `propertyService.listPropertiesByUser(wallet)`.

#### 📍 Formulario de alta de propiedad (sección futura)

El nav link `"List Property"` apunta a `/listPropertys`. En el futuro debería existir un formulario separado (e.g. `/listing/new`) que llame a `propertyService.createProperty(payload)`. Esta integración requiere que el usuario esté registrado (tiene wallet) y que el smart contract haya generado un `pdaKey`.

---

## 📁 Estructura de Archivos Propuesta (stayke-front)

```
stayke-front/src/
├── constants/
│   └── api.ts                  # [NUEVO] Configuración centralizada de endpoints
├── types/
│   ├── api.ts                  # [NUEVO] Tipos del backend (BackendUser, BackendProperty…)
│   └── AuthContex.ts           # [EXISTENTE] Tipos del contexto de auth
├── services/
│   ├── apiService.ts           # [NUEVO] Servicio HTTP base (Singleton)
│   ├── userService.ts          # [NUEVO] Métodos para /api-v1/users
│   └── propertyService.ts      # [NUEVO] Métodos para /api-v1/properties
├── helpers/
│   └── mapUser.ts              # [NUEVO] Adaptador BackendUser → User (contexto)
├── Context/
│   └── AuthContext.tsx         # [MODIFICAR] Reemplazar mockLogin y mockRegister
└── app/
    ├── register/page.tsx       # [MODIFICAR] Integrar userService.createUser()
    ├── listPropertys/page.tsx  # [MODIFICAR] Integrar propertyService.listAllProperties()
    └── profile/page.tsx        # Beneficia automáticamente del contexto actualizado
```

---

## ✅ Checklist de Integración

### Fase 1 — Configuración
- [ ] Crear `.env.local` con `NEXT_PUBLIC_API_URL`
- [ ] Crear `src/constants/api.ts` con los endpoints
- [ ] Crear `src/types/api.ts` con `BackendUser`, `BackendProperty`, `ApiResponse<T>`
- [ ] Crear `src/services/apiService.ts` con el servicio HTTP base

### Fase 2 — APIs de Usuario
- [ ] Crear `src/services/userService.ts`
- [ ] Crear `src/helpers/mapUser.ts` (adaptador de tipos)
- [ ] Modificar `AuthContext.tsx`: `login` → `userService.getUserByWallet()`
- [ ] Modificar `AuthContext.tsx`: `registerUser` → `userService.createUser()`
- [ ] Verificar mapeo de campos del formulario de registro (`isHost`, `image` vs `profileImage`)

### Fase 3 — APIs de Propiedades
- [ ] Crear `src/services/propertyService.ts`
- [ ] Modificar `/listPropertys/page.tsx` → usar `propertyService.listAllProperties()`
- [ ] Adaptar `ListingCard` para recibir `BackendProperty` o mapear a la estructura actual
- [ ] Planificar sección "Mis Propiedades" en `/profile`
- [ ] Planificar formulario de alta de propiedad (depende de Fase Smart Contracts)

---

## Fase 4 — Seguridad on-chain: bcrypt + PDA de Usuario (Backend)

**Objetivo:** Preparar el backend para interactuar de forma segura con los programas de Rust, usando el DNI hasheado como seed del PDA de usuario.

### 4.1 Hash del DNI con bcrypt

El DNI del usuario es el dato que se usará como **seed** para derivar el PDA del usuario en el programa de Solana. Para protegerlo en base de datos y evitar que sea reversible en texto plano, se aplica bcrypt **antes de persistirlo**.

**Pasos:**
1. Instalar bcrypt en el backend:
   ```bash
   npm install bcrypt @types/bcrypt
   ```
2. En `backend/src/controllers/user.ts`, antes de `repo.create(...)`, hashear el DNI:
   ```typescript
   import bcrypt from "bcrypt";
   
   // Dentro de createUser:
   const dniHash = dni ? await bcrypt.hash(dni, 10) : undefined;
   // Guardar dniHash en el campo dni de la entidad
   ```
3. Agregar un helper `backend/src/utils/hashDni.ts`:
   ```typescript
   import bcrypt from "bcrypt";
   export const hashDni = (dni: string) => bcrypt.hash(dni, 10);
   ```

> **Nota:** El hash del DNI se usará como entrada del programa de Rust para derivar el PDA. No se guarda el DNI en texto plano en producción.

### 4.2 Integración con el programa de usuario (Rust / Anchor)

El backend necesita un `client.ts` que pueda comunicarse con el programa desplegado en Solana (Devnet / Playground).

**Pasos:**
1. Crear `backend/src/solana/client.ts` como singleton de la conexión a Solana:
   ```typescript
   import { Connection, clusterApiUrl } from "@solana/web3.js";
   
   const CLUSTER = process.env.SOLANA_CLUSTER || "devnet";
   
   export const getSolanaConnection = (): Connection =>
     new Connection(clusterApiUrl(CLUSTER as "devnet"), "confirmed");
   ```
2. Crear `backend/src/solana/userProgram.ts` con los métodos del programa de usuario:
   ```typescript
   import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
   import { getSolanaConnection } from "./client";
   // idl: importar el IDL generado por Anchor del programa User
   
   export const initUserPDA = async (walletPubkey: string, dniHash: string) => {
     // Derivar el PDA usando [diniHash, walletPubkey] como seeds
     // Llamar la instrucción `initUser` del programa
     // Retornar la pdaKey como string
   };
   ```
3. En el controlador `createUser`, **después** de persistir el off-chain record:
   - Llamar a `initUserPDA(wallet, dniHash)` para crear el PDA on-chain.
   - Guardar el `pdaKey` retornado en el registro del usuario.

### 4.3 PDA de Propiedad

El programa de Propiedades usa como seeds `[ownerWallet, pdaKey (incremental)]`.

**Pasos:**
1. Crear `backend/src/solana/propertyProgram.ts`:
   ```typescript
   export const initPropertyPDA = async (ownerWallet: string) => {
     // Derivar el PDA de la propiedad con seeds [ownerWallet, counter]
     // Llamar instrucción `createProperty` del programa
     // Retornar la pdaKey
   };
   ```
2. En `createProperty` del backend, llamar `initPropertyPDA` y guardar el `pdaKey` antes de persistir off-chain.

---

## Fase 5 — SPL Token: Stable Coin como medio de pago

**Objetivo:** Configurar el token SPL (stablecoin) que se usará para depósitos, rentas y otras transacciones dentro de Stayke.

### 5.1 Crear el token SPL

```bash
# Usando Solana CLI en devnet
spl-token create-token
# Guardar el mint address resultante como STAYKE_USDC_MINT
```

### 5.2 Variables de entorno

En `.env` del backend y `.env.local` del frontend:
```bash
SOLANA_CLUSTER=devnet
STAYKE_USDC_MINT=<mint_address>
ANCHOR_WALLET=<path_to_keypair.json>
```

### 5.3 Asociar cuentas de token (ATA)

Para cada usuario que se registre, se debe crear o verificar su **Associated Token Account (ATA)** para el mint del SPL:

```typescript
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

export const getOrCreateUserTokenAccount = async (
  connection: Connection,
  payer: Keypair,
  ownerPubkey: PublicKey,
  mint: PublicKey
) => {
  return getOrCreateAssociatedTokenAccount(connection, payer, mint, ownerPubkey);
};
```

---

## Fase 6 — Hooks de Solana en el Frontend

**Objetivo:** Exponer las acciones de los programas de Rust como hooks de React reutilizables, para ser consumidos fácilmente desde las vistas del frontend.

### 6.1 Patrón de Hook por programa

Para cada programa/acción on-chain se crea un hook dedicado bajo `stayke-front/src/Hooks/solana/`:

```
stayke-front/src/Hooks/solana/
├── useUserProgram.ts        # Acciones del programa User
├── usePropertyProgram.ts    # Acciones del programa Property
└── useTokenTransfer.ts      # Transferencias SPL
```

### 6.2 Hook de Usuario — `useUserProgram.ts`

```typescript
"use client";
import { useState } from "react";
import { useWalletConnection } from "@solana/react-hooks";

export const useUserProgram = () => {
  const { wallet } = useWalletConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Inicializa el PDA del usuario en el programa Solana.
   * Se llama luego del registro off-chain exitoso.
   */
  const initUser = async (dniHash: string) => {
    setLoading(true);
    setError(null);
    try {
      const address = wallet?.account?.address?.toString();
      if (!address) throw new Error("Wallet no conectada");
      // Llamar endpoint del backend que ejecuta initUserPDA
      const res = await fetch("/api/solana/init-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, dniHash }),
      });
      if (!res.ok) throw new Error("Error al inicializar PDA de usuario");
      return await res.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { initUser, loading, error };
};
```

### 6.3 Hook de Propiedad — `usePropertyProgram.ts`

```typescript
"use client";
import { useState } from "react";
import { useWalletConnection } from "@solana/react-hooks";

export const usePropertyProgram = () => {
  const { wallet } = useWalletConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Inicializa el PDA de la propiedad en el programa Solana.
   * Se llama antes de registrar la propiedad off-chain.
   * Devuelve el pdaKey necesario para el registro en el backend.
   */
  const createProperty = async (): Promise<{ pdaKey: string }> => {
    setLoading(true);
    setError(null);
    try {
      const address = wallet?.account?.address?.toString();
      if (!address) throw new Error("Wallet no conectada");
      const res = await fetch("/api/solana/create-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerWallet: address }),
      });
      if (!res.ok) throw new Error("Error al inicializar PDA de propiedad");
      return await res.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createProperty, loading, error };
};
```

### 6.4 Flujo de Registro integrado (Frontend + Backend + Solana)

```
Usuario completa formulario /register
       │
       ▼
1. registerUser(payload) → POST /api-v1/users (off-chain)
       │
       ▼
2. Backend: hashDni(dni) + createUser BD + initUserPDA on-chain
       │
       ▼
3. Backend retorna { user, pdaKey }
       │
       ▼
4. Frontend: AuthContext actualiza user con pdaKey
```

### 6.5 Flujo de Alta de Propiedad integrado

```
Host completa formulario /list-property
       │
       ▼
1. usePropertyProgram.createProperty() → /api/solana/create-property
       │  (backend deriva PDA on-chain, retorna pdaKey)
       ▼
2. propertyService.createProperty({ ...form, pdaKey })
       │  → POST /api-v1/properties (off-chain con pdaKey)
       ▼
3. Propiedad queda registrada on-chain + off-chain
```

---

## 📁 Estructura de Archivos Propuesta (stayke-front)

```
stayke-front/src/
├── constants/
│   └── api.ts                  # [EXISTENTE] Configuración centralizada de endpoints
├── types/
│   ├── api.ts                  # [EXISTENTE] Tipos del backend
│   └── AuthContex.ts           # [EXISTENTE] Tipos del contexto de auth
├── services/
│   ├── apiService.ts           # [EXISTENTE] Servicio HTTP base (Singleton)
│   ├── userService.ts          # [EXISTENTE] Métodos /api-v1/users
│   └── propertyService.ts      # [EXISTENTE] Métodos /api-v1/properties
├── helpers/
│   ├── mapUser.ts              # [EXISTENTE] Adaptador BackendUser → User
│   ├── mapProperty.ts          # [EXISTENTE] Adaptador BackendProperty → ListingCard
│   └── apiError.ts             # [EXISTENTE] Helper para alertas de error
├── Hooks/
│   └── solana/
│       ├── useUserProgram.ts   # [NUEVO] Hook — programa User
│       ├── usePropertyProgram.ts # [NUEVO] Hook — programa Property
│       └── useTokenTransfer.ts # [NUEVO] Hook — transferencias SPL
├── Context/
│   └── AuthContext.tsx         # [EXISTENTE] Login / Register real
└── app/
    ├── register/page.tsx       # [MODIFICAR] Llamar useUserProgram.initUser()
    ├── list-property/page.tsx  # [MODIFICAR] Llamar usePropertyProgram.createProperty()
    └── profile/page.tsx        # [EXISTENTE] Muestra mis propiedades
```

```
backend/src/
├── solana/
│   ├── client.ts              # [NUEVO] Conexión Solana singleton
│   ├── userProgram.ts         # [NUEVO] initUserPDA
│   └── propertyProgram.ts     # [NUEVO] initPropertyPDA
├── utils/
│   └── hashDni.ts             # [NUEVO] Helper bcrypt para DNI
└── controllers/
    ├── user.ts                # [MODIFICAR] Agregar bcrypt + initUserPDA
    └── property.ts            # [MODIFICAR] Agregar initPropertyPDA
```

---

## ✅ Checklist de Integración

### Fase 1 — Configuración ✅
- [x] Crear `.env.local` con `NEXT_PUBLIC_API_URL`
- [x] Crear `src/constants/api.ts` con los endpoints
- [x] Crear `src/types/api.ts` con `BackendUser`, `BackendProperty`, `ApiResponse<T>`
- [x] Crear `src/services/apiService.ts` con el servicio HTTP base

### Fase 2 — APIs de Usuario ✅
- [x] Crear `src/services/userService.ts`
- [x] Crear `src/helpers/mapUser.ts` (adaptador de tipos)
- [x] Modificar `AuthContext.tsx`: `login` → `userService.getUserByWallet()`
- [x] Modificar `AuthContext.tsx`: `registerUser` → `userService.createUser()`
- [x] Pasar `isHost` al backend para asignar roles desde el registro

### Fase 3 — APIs de Propiedades ✅
- [x] Crear `src/services/propertyService.ts`
- [x] Crear `src/helpers/mapProperty.ts`
- [x] Crear `src/helpers/apiError.ts`
- [x] Modificar `/listPropertys/page.tsx` → usar `propertyService.listAllProperties()`
- [x] Sección "My Properties" en `/profile`
- [x] Formulario de alta `/list-property/page.tsx` con `propertyService.createProperty()`

### Fase 4 — bcrypt + PDA de Usuario (Backend)
- [ ] Instalar `bcrypt` en el backend
- [ ] Crear `backend/src/utils/hashDni.ts`
- [ ] Modificar `createUser` para hashear el DNI antes de persistir
- [ ] Crear `backend/src/solana/client.ts`
- [ ] Crear `backend/src/solana/userProgram.ts` con `initUserPDA`
- [ ] Crear `backend/src/solana/propertyProgram.ts` con `initPropertyPDA`
- [ ] Conectar `createUser` → `initUserPDA` post-persistencia
- [ ] Conectar `createProperty` → `initPropertyPDA` y guardar `pdaKey`

### Fase 5 — SPL Token
- [ ] Crear mint del token SPL (usando Solana CLI en devnet)
- [ ] Configurar `STAYKE_USDC_MINT` y `ANCHOR_WALLET` en variables de entorno
- [ ] Crear helper `getOrCreateUserTokenAccount`
- [ ] Asociar ATA al registro de cada nuevo usuario

### Fase 6 — Hooks Solana en el Frontend
- [ ] Crear `useUserProgram.ts` — acción `initUser`
- [ ] Crear `usePropertyProgram.ts` — acción `createProperty`
- [ ] Crear `useTokenTransfer.ts` — transferencia de SPL token
- [ ] Integrar `useUserProgram.initUser()` en `/register/page.tsx`
- [ ] Integrar `usePropertyProgram.createProperty()` en `/list-property/page.tsx`
- [ ] Definir rutas API Next.js (`/api/solana/*`) como proxy al backend Solana
