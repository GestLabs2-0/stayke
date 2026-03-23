# Backend Analysis - Stayke

## Estructura General
El backend está construido con Node.js, Express y TypeScript.
La estructura principal dentro de `src/` se divide en:
- `controllers/`: Contiene la lógica principal de los endpoints (ej: `user.ts`, `property.ts`, `solana.ts`).
- `routes/`: Define las rutas de la API, delegando a los controladores.
- `solana/`: Contiene la lógica de integración con Solana (`token.ts`, `userProgram.ts`, `propertyProgram.ts`, `client.ts`).
- `database/`: Manejo de la base de datos y repositorios.
- `middlewares/, utils/, types/`: Funciones auxiliares y definiciones.

## Integración con Solana
El backend asume actualmente varias responsabilidades de integración blockchain que, en un diseño ideal de dApp, deberían recaer parcial o totalmente sobre el cliente (frontend/billetera del usuario).

### Puntos Críticos Encontrados:
1. **Creación de Cuentas Token (ATA):**
   - El archivo `src/solana/token.ts` implementa `getATA` usando la función `getOrCreateAssociatedTokenAccount` de `@solana/spl-token`.
   - El controlador `src/controllers/solana.ts` tiene un endpoint `/api/v1/solana/init-ata` que simula la inicialización de ATAs.
   - **Problema:** En la red principal, usar `getOrCreateAssociatedTokenAccount` desde el backend requiere que el backend posea un *Keypair* (signer) con fondos para pagar las comisiones de red (renta del account y tx fee). Lo correcto es que el usuario desde el frontend firme la transacción creando o asociando su propio ATA.

2. **Transferencias de Tokens:**
   - Similarmente, `transferSPL` y el endpoint `/api/v1/solana/transfer-token` simulan transferencias.
   - **Problema:** La transferencia de fondos de usuarios requiere la firma del usuario. El backend no debería custodiar claves privadas de los usuarios para firmar transacciones en su nombre. Las transferencias deben construirse en el frontend, ser firmadas por la wallet del cliente (ej: Phantom) y ser enviadas directamente a la red (o pasadas al backend parcialmente firmadas si requieren firma cruzada, aunque suele ser más fácil hacerlo puramente en frontend).

3. **Derivación y Registro de PDAs:**
   - Archivos como `src/solana/userProgram.ts` interactúan con Solana para calcular direcciones de programas (`PublicKey.findProgramAddressSync`).
   - Esto es útil y válido en el backend estrictamente para lectura y validación de estado o como sistema indexador relacional (guardar el `pdaKey` en base de datos para no tener que derivarlo múltiples veces), pero las instrucciones de escritura (crear el usuario en cadena) deben correr a cargo de las wallets de los usuarios. Actualmente se simula (`await Promise.resolve()`).
