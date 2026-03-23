# Frontend Analysis - Stayke

## Estructura General
El frontend está construido con Next.js (utilizando el *App Router* en `app/` y `src/`) junto con TypeScript.
Contiene además un directorio local `anchor/` que típicamente almacena los contratos inteligentes (Programas de Solana) y las rutinas de compilación (IDL).

La estructura de `src/` incluye:
- `app/`, `components/`, `Context/`, `Hooks/`: Componentes y estado de React.
- `services/`: Lógica para comunicarse con el backend y la blockchain.
- `constants/`: Constantes fijas como los endpoints de la API (`API_CONFIG.ENDPOINTS`).

## Interacción con el Backend y Solana
Como fue anticipado por las sospechas de arquitectura, el frontend delega en el backend operaciones de Solana que debería ejecutar nativamente usando un Wallet Adapter.

### Puntos Críticos Encontrados:
- **`solanaService.ts`**: El frontend posee un archivo `src/services/solanaService.ts` que se comunica con la API de Node.js a través de peticiones POST HTTP en lugar de interactuar directamente de forma RPC con Solana a través de un proveedor de wallet (`@solana/wallet-adapter-react`).
- Faltan integraciones robustas de `WalletProvider` nativo para construir, firmar y enviar las instrucciones (ej: `createAssociatedTokenAccountInstruction` o transferencias de tokens SPL).

En un entorno descentralizado real, el frontend de Stayke debe montar el contexto de un provedor de Solana (`ConnectionProvider`, `WalletProvider`), solicitar la aprobación del usuario a través de la extensión de su navegador y transmitir la transacción ya firmada al RPC de Solana, notificando al backend solo una vez que esté exitosa (o dejando que el backend observe los eventos blockchain independientemente).
