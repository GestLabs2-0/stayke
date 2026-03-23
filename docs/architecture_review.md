# Revisión de Arquitectura Integral - Stayke (Solana)

## Problema de Diseño Identificado
El usuario ha detectado un *anti-patrón* de dApps en la interacción actual entre el frontend, el backend y la red Solana. 

Tras analizar minuciosamente ambos repositorios de Stayke, la sospecha es **correcta**. 

El backend asume el rol de emisor y pagador de transacciones (Tokens/ATAs), y el frontend simplemente opera como una web2 tradicional enviando eventos HTTP POST para que el backend gestione la ejecución sobre la blockchain de Solana.

### Arquitectura Actual (Equivocada para dApps No-Custodiales)

1. El usuario en el frontend gatilla un evento (ej. Inicializar ATA o Transferir Tokens).
2. El frontend utiliza `solanaService.ts` para ejecutar peticiones HTTP (`/api/v1/solana/init-ata`, `/api/v1/solana/transfer-token`).
3. El backend Node.js llama a `@solana/spl-token` (ej `getOrCreateAssociatedTokenAccount`).
4. **Falla Real:** Para que esto funcione en mainnet, el backend necesita una llave privada fondeada con SOL. Estaría pagando el costo rent/tx de cada usuario y actuando como un custodio, lo cual rompe el concepto de billetera auto-custodiada (non-custodial).

### Solución Arquitectónica Recomendada

Las operaciones de cadena (On-Chain) que involucran activos o estado de un usuario **deben originarse en el Frontend**, porque es ahí donde reside el Signer (la Wallet del usuario, como Phantom o Solflare).

#### Pasos de refactorización:

1. **Frontend (App Next.js):**
   - Implementar `@solana/wallet-adapter-react` para manejar la conexión de wallets de usuarios.
   - Migrar la lógica de creación de la cuenta asociada (ATA) e instrucciones SPL al frontend usando `@solana/spl-token` o `@solana/web3.js` e instrucciones base.
   - El frontend construye la transacción, pide firma al usuario (popup en wallet) y envía la transacción a la red.

2. **Backend (API Node.js):**
   - Eliminar dependencias transaccionales delegadas como `getOrCreateAssociatedTokenAccount` o `sendAndConfirmTransaction` a no ser que el backend se requiera como co-firmante en billeteras multi-sig o en lógica administrativa nativa.
   - El backend pasa a tener un modelo **Reactivo/Estacionario**. Su tarea debe ser indexar datos y manejar perfiles *off-chain* (base de datos relacional).
   - Ejemplo: Proveer datos de perfil (nombre, email), guardar los addresses de usuario (`pdaKey`), o verificar mediante Webhooks/RPC polling que una transacción solicitada se haya completado en la red.

**Conclusión:** La responsabilidad on-chain sobre cuentas y transferencias debe ser transferida inmediatamente al cliente (Frontend), lo que resolverá el problema de firmas y rentas, mejorando drásticamente la seguridad del proyecto y su congruencia con el ecosistema de blockchain pública.
