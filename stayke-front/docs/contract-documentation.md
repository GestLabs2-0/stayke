# Documentación del Smart Contract Stayke

## Resumen

Stayke es una plataforma de smart contracts basada en Solana construida con el framework Anchor que facilita un sistema descentralizado de alquiler de propiedades a corto plazo. El contrato gestiona perfiles de usuario, listados de propiedades, reservas y resolución de disputas a través de una implementación blockchain segura y transparente.

## Arquitectura

### Detalles del Programa
- **ID del Programa**: `GnzJGwApzby8BpL17fctpBZGCfk1C6FEauAhRg3VA2ac`
- **Framework**: Anchor v1.0.0-rc.5
- **Lenguaje**: Rust
- **Red**: Devnet (configurada para desarrollo)

### Componentes Principales

#### 1. Gestión de Estado
El contrato mantiene varias estructuras de cuenta clave:

- **PlatformConfig**: Configuración global de la plataforma y configuración de administradores
- **UserProfile**: Datos específicos del usuario incluyendo depósitos, reseñas y estado de host
- **Property**: Listados de propiedades con precios y disponibilidad
- **Booking**: Registros de reservas con seguimiento de estado
- **BookingDays**: Seguimiento de disponibilidad mensual usando operaciones bitwise

#### 2. Módulos de Instrucciones
- **Initialize**: Inicialización del contrato y usuarios
- **UserProfile**: Gestión de usuarios y depósitos
- **Properties**: Registro y gestión de propiedades
- **Booking**: Creación y gestión de reservas
- **Admin**: Funciones administrativas

## Dependencias y Versiones

### Dependencias Principales
```toml
anchor-lang = "1.0.0-rc.5"
anchor-spl = "1.0.0-rc.5"
solana-program = "1.18.0"
```

### Dependencias del Frontend
```json
{
  "@solana/client": "^1.2.0",
  "@solana/kit": "^5.1.0",
  "@solana/react-hooks": "^1.1.5",
  "@codama/nodes-from-anchor": "^1.3.8",
  "@codama/renderers-js": "^1.5.5",
  "codama": "^1.5.0"
}
```

### Herramientas de Desarrollo
- **Node.js**: v20+
- **Rust**: 1.79.0-dev (toolchain de Solana)
- **Package Manager**: pnpm@10.28.2+
- **TypeScript**: v5+

## Métodos del Contrato

### Funciones de Inicialización

#### `initialize_contract`
- **Propósito**: Inicializar la configuración de la plataforma
- **Parámetros**: 
  - `initial_data: InitialConfig` - Lista de administradores, direcciones de tesorería, estructura de tarifas
- **Requisitos**: Solo inicialización por primera vez
- **Acceso**: Cualquiera (se convierte en primer administrador)

#### `register_user`
- **Propósito**: Crear un nuevo perfil de usuario
- **Parámetros**: 
  - `dni_hash: [u8; 32]` - Identificador de usuario hasheado
- **Requisitos**: Hash DNI único
- **Acceso**: Público

#### `register_property`
- **Propósito**: Registrar un nuevo listado de propiedad
- **Parámetros**: 
  - `price_per_night: u64` - Precio de alquiler diario
- **Requisitos**: El usuario debe ser un host registrado
- **Acceso**: Solo hosts registrados

### Funciones de Usuario

#### `deposit_funds`
- **Propósito**: Depositar tokens USDC en la cuenta del usuario
- **Parámetros**: 
  - `amount: u64` - Cantidad del depósito
  - `decimals: u8` - Decimales del token
- **Requisitos**: Umbral mínimo de depósito
- **Acceso**: Solo propietario del perfil

#### `set_host_status`
- **Propósito**: Alternar capacidades de hosting del usuario
- **Parámetros**: 
  - `dni_hash: [u8; 32]` - Identificador del usuario
  - `status: bool` - Estado de host
- **Requisitos**: Perfil de usuario verificado
- **Acceso**: Solo propietario del perfil

### Funciones de Host

#### `update_property_price`
- **Propósito**: Actualizar tarifa nocturna de la propiedad
- **Parámetros**: 
  - `new_price_per_night: u64` - Nuevo precio diario
- **Requisitos**: Sin reservas activas
- **Acceso**: Solo propietario de la propiedad

### Funciones de Administrador

#### `add_admin`
- **Propósito**: Agregar nuevo administrador de la plataforma
- **Parámetros**: 
  - `new_admin: Pubkey` - Dirección del wallet del administrador
- **Requisitos**: Máximo 10 administradores
- **Acceso**: Solo administradores existentes

#### `remove_admin`
- **Propósito**: Eliminar administrador de la plataforma
- **Parámetros**: 
  - `admin_to_remove: Pubkey` - Wallet del administrador a eliminar
- **Requisitos**: Mínimo 1 administrador restante
- **Acceso**: Solo administradores existentes

## Estructuras de Datos

### PlatformConfig
```rust
pub struct PlatformConfig {
    pub admins: Vec<Pubkey>,           // Máximo 10 administradores
    pub treasury: Pubkey,              // Tesorería principal
    pub escrow_treasury: Pubkey,       // Tesorería de escrow
    pub usdc_mint: Pubkey,             // Mint del token USDC
    pub retribution_bps_low: u16,      // Basis points de tarifa baja
    pub retribution_bps_medium: u16,   // Basis points de tarifa media
    pub retribution_bps_high: u16,     // Basis points de tarifa alta
    pub minimum_deposit: u64,          // Requisito mínimo de depósito
    pub is_initialized: bool,          // Bandera de inicialización
    pub bump: u8,                      // Bump de PDA
}
```

### UserProfile
```rust
pub struct UserProfile {
    pub owner: Pubkey,                 // Dirección del wallet
    pub deposit: u64,                  // Depósito actual
    pub deposit_timestamp: i64,        // Timestamp del último depósito
    pub dni: [u8; 32],                 // Identificador hasheado
    pub is_verified: bool,             // Estado de verificación
    pub is_banned: bool,               // Estado de baneo
    pub active_booking: Option<Pubkey>, // Reserva actual
    pub host_reviews: u32,             // Conteo de reseñas como host
    pub total_score_host: u64,         // Puntaje total como host
    pub client_reviews: u32,           // Conteo de reseñas como cliente
    pub total_score_client: u64,       // Puntaje total como cliente
    pub hosted_stays: u32,             // Propiedades alojadas
    pub completed_stays: u32,          // Estadías completadas
    pub is_host: bool,                 // Estado de host
    pub low_infractions: u8,           // Infracciones de baja gravedad
    pub medium_infractions: u8,        // Infracciones de media gravedad
    pub high_infractions: u8,          // Infracciones de alta gravedad
    pub listing_count: u8,             // Conteo de propiedades
    pub bump: u8,                      // Bump de PDA
}
```

### Property
```rust
pub struct Property {
    pub host: Pubkey,                  // Propietario de la propiedad
    pub listing_id: u8,                // ID único del listado
    pub price_per_night: u64,          // Tarifa diaria
    pub hash_state: String,            // Hash de datos off-chain
    pub booking_active: Option<Pubkey>, // Reserva actual
    pub bump: u8,                      // Bump de PDA
}
```

### Booking
```rust
pub struct Booking {
    pub guest: Pubkey,                 // Wallet del huésped
    pub host: Pubkey,                  // Wallet del host
    pub property: Pubkey,              // Dirección de la propiedad
    pub deposit: u64,                  // Depósito de seguridad
    pub check_in: i64,                 // Timestamp de check-in
    pub check_out: i64,                // Timestamp de check-out
    pub days: u64,                     // Número de días
    pub yearmonth_in: u32,             // Año/mes de check-in
    pub yearmonth_out: u32,            // Año/mes de check-out
    pub total_price: u64,              // Costo total
    pub review: u8,                    // Puntaje de reseña (0-5)
    pub status: BookingStatus,         // Estado actual
    pub bump: u8,                      // Bump de PDA
}
```

### BookingStatus Enum
```rust
pub enum BookingStatus {
    Pending,           // Creada por el huésped
    HostAccepted,      // Aceptada por el host
    Active,            // Huésped hizo check-in
    Completed,         // Huésped hizo check-out
    Cancelled,         // Cancelada antes del check-in
    Disputed,          // Disputa levantada
    DisputeResolved,   // Disputa resuelta
    DisputeRejected,   // Disputa rechazada
}
```

## Manejo de Errores

El contrato implementa un manejo comprehensivo de errores con más de 30 tipos de errores personalizados:

### Errores de Usuario
- `UserProfileAlreadyExists` - Perfil de usuario ya existe
- `UnauthorizedUser` - Usuario no autorizado
- `UserBanned` - Usuario baneado
- `UserNotVerified` - Usuario no verificado
- `UserNotHost` - Usuario no es host
- `InsufficientDeposit` - Depósito insuficiente

### Errores de Propiedad
- `PropertyAlreadyExists` - Propiedad ya existe
- `PropertyInActiveBooking` - Propiedad en reserva activa
- `UnauthorizedHost` - Host no autorizado
- `NoPropertiesToModify` - Sin propiedades para modificar

### Errores de Reserva
- `BookingAlreadyExists` - Reserva ya existe
- `InvalidBookingDates` - Fechas de reserva inválidas
- `DatesAlreadyBooked` - Fechas ya reservadas
- `UnauthorizedBooking` - Reserva no autorizada

### Errores de Administrador
- `UnauthorizedAdmin` - Acción de administrador no autorizada
- `MaxAdminsReached` - Máximo de administradores alcanzado
- `CannotRemoveSelf` - No puede eliminarse a sí mismo
- `AtLeastOneAdminRequired` - Se requiere al menos un administrador

### Errores Financieros
- `DepositTooLow` - Depósito por debajo del mínimo
- `InvalidTreasuryAccount` - Cuenta de tesorería inválida
- `InvalidTokenMint` - Mint de token no coincide con USDC

## Características de Seguridad

### Control de Acceso
- Permisos basados en roles (Usuario, Host, Administrador)
- Propiedad de cuentas basada en PDA
- Verificación de firmas para todos los cambios de estado

### Seguridad Financiera
- Sistema de escrow para depósitos
- Requisitos mínimos de depósito
- Validación de tesorerías
- Verificación de mint de tokens

### Integridad de Datos
- Registros de reserva inmutables
- Seguimiento de disponibilidad con operaciones bitwise
- Verificación de datos off-chain basada en hash

## Configuración y Despliegue

### Prerrequisitos
1. Instalar herramientas CLI de Solana
2. Instalar framework Anchor
3. Configurar wallet con SOL de devnet
4. Instalar Node.js 20+ y pnpm

### Configuración de Desarrollo
```bash
# Clonar repositorio
git clone <repository-url>
cd stayke/stayke-front

# Instalar dependencias
pnpm install

# Construir programa Anchor
pnpm run anchor-build

# Generar bindings TypeScript
pnpm run codama:js

# Iniciar servidor de desarrollo
pnpm run dev
```

### Comandos de Despliegue
```bash
# Construir programa
anchor build

# Desplegar a devnet
anchor deploy

# Ejecutar pruebas
anchor test --skip-deploy
```

## Integración con Frontend

### Bindings Generados
El contrato usa Codama para auto-generar bindings TypeScript en `app/generated/vault/`:
- Constructores de instrucciones
- Definiciones de tipos
- Constantes de error
- Interfaces de programa

### Archivos Clave del Frontend
- `app/generated/vault/` - Bindings del contrato auto-generados
- `app/components/` - Componentes React
- `app/page.tsx` - Interfaz principal de la aplicación

### Ejemplo de Uso
```typescript
import { createInitializeContractInstruction } from './generated/vault';

// Crear instrucción
const instruction = createInitializeContractInstruction({
  signer: wallet.publicKey,
  config: configPDA,
  systemProgram: SystemProgram.programId,
}, {
  initialData: {
    admins: [],
    treasury: treasuryPubkey,
    escrowTreasury: escrowPubkey,
    retributionBpsLow: 100,
    retributionBpsMedium: 200,
    retributionBpsHigh: 300,
    minimumDeposit: 1000000,
    usdcMint: usdcMintPubkey,
  }
});
```

## Estrategia de Pruebas

### Pruebas Unitarias
- Pruebas de instrucciones individuales
- Validación de condiciones de error
- Verificación de transiciones de estado

### Pruebas de Integración
- Pruebas de flujo de trabajo completo de reservas
- Escenarios de interacción multi-usuario
- Validación de transacciones financieras

### Cobertura de Pruebas
- Registro y verificación de usuarios
- Listado y gestión de propiedades
- Creación y finalización de reservas
- Flujos de depósito y retiro
- Operaciones de administrador
- Caminos de manejo de errores

## Mejoras Futuras

### Funcionalidades Planeadas
- Sistema de resolución de disputas
- Sistema de reseñas y calificaciones
- Gestión avanzada de disponibilidad
- Soporte multi-token
- Capacidades cross-chain

### Oportunidades de Optimización
- Optimización de uso de gas
- Operaciones por lotes
- Estrategias de caché
- Integración de datos off-chain

## Conclusión

El smart contract Stayke proporciona una base comprensiva para una plataforma de alquiler de propiedades descentralizada en Solana. Con robustas medidas de seguridad, clara separación de roles y extensivo manejo de errores, ofrece una solución confiable para alquileres a corto plazo peer-to-peer mientras mantiene transparencia y confianza a través de tecnología blockchain.
