# Guía de Integración Frontend de Solana - Stayke

Esta guía explica cómo el frontend interactúa con la blockchain de Solana y los servicios del backend para gestionar identidades de usuario y balances de Mock USDC.

## 1. Variables de Entorno
Asegúrate de tener estas variables configuradas en `stayke-front/.env.local`:
- `NEXT_PUBLIC_SOLANA_CLUSTER`: normalmente `devnet`.
- `NEXT_PUBLIC_STAYKE_USDC_MINT`: La clave pública del token Mock USDC.
- `NEXT_PUBLIC_API_URL`: URL del Backend (ej. `http://localhost:4041`).

## 2. Referencia de Hooks Personalizados

### `useSolBalance(address)`
Obtiene el balance de SOL nativo de una dirección de wallet.
- **Entrada**: String con la clave pública de la wallet.
- **Salida**: `{ balance: number | null, isLoading: boolean }`.

### `useTokenBalance(wallet)`
Obtiene el balance de **Mock USDC** de una dirección de wallet.
- **Entrada**: String con la clave pública de la wallet.
- **Salida**: `{ balance: number | null, isLoading: boolean }`.
- **Lógica**: Utiliza `getTokenAccountsByOwner` para encontrar el balance de la Cuenta de Token Asociada (ATA) específica de USDC.

### `useUserOnChain(pdaKey)`
Verifica si un usuario ya está registrado en la cadena (on-chain).
- **Entrada**: `pdaKey` del usuario (obtenida del backend).
- **Salida**: `{ isRegistered: boolean | null, isLoading: boolean }`.
- **Lógica**: Realiza un `getAccountInfo` para verificar si la cuenta existe en la blockchain.

## 3. Flujo de Interacción

### A. Autenticación y Registro
1. El usuario conecta su wallet mediante el `WalletButton`.
2. `AuthContext` llama a `userService.getUserByWallet(address)`.
3. Si el usuario no existe, se le pide que se registre.
4. Durante el registro, el backend hashea el DNI para generar una `pdaKey` única.

### B. Inicialización On-Chain
Si un usuario ha iniciado sesión pero `useUserOnChain` devuelve `false`:
1. El usuario verá un botón "Initialize Blockchain Profile" en `/profile`.
2. Al hacer clic, se dispara `solanaService.initATA(wallet)`.
3. El backend asegura que el usuario tenga una Cuenta de Token Asociada (ATA) para USDC.

### C. Transacciones (Futuro)
- El alquiler o listado de propiedades implicará firmar transacciones mediante la wallet y/o llamar a proxies del backend que utilicen la lógica de `transferSPL`.

## 4. Servicios

### `solanaService.ts`
Servicio proxy para llamar a los helpers de Solana en el backend:
- `initATA(wallet)`: Dispara la creación/verificación de la ATA en el backend.
- `transferToken(from, to, amount)`: (Placeholder) Simula transferencias de tokens.

---
*Nota: Asegúrate siempre de que el Backend esté en ejecución para procesar los cálculos de PDA e inicializaciones de ATA.*
