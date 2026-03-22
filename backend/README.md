# 🚀 Stayke Backend - API REST con Express + TypeScript

API REST para la gestión de usuarios y propiedades en la plataforma Stayke, con autenticación via wallets de Solana y base de datos PostgreSQL.

## 📋 Tabla de Contenidos

- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [API Endpoints](#-api-endpoints)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Base de Datos](#-base-de-datos)

---

## 🤖 Requisitos

- **Node.js** >= v24.0.1
- **PostgreSQL** >= 13
- **yarn** ≥ 4.9.1
- **TypeScript** >= 5.9.3

---

## ⚙️ Instalación

1. **Instalar dependencias**:

   ```bash
   yarn install
   ```

2. **Configurar variables de entorno**:

   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

3. **Ejecutar migraciones de la base de datos**:

   ```bash
   yarn migrate
   ```

4. **Iniciar servidor en desarrollo**:

   ```bash
   yarn dev
   ```

5. **Verificar instalación**:
   ```bash
   curl http://localhost:4040/api-v1/users
   ```

---

## � Configuración

### Variables de Entorno (.env)

```env
# Express
PORT=4040

# Database
DB_PORT=5432
DB_HOST=localhost
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=stayke_db

# Seguridad
ADMIN_SECRET=tu_secreto_admin_super_secreto
```

---

La API corre en http://localhost:4040 con el prefijo /api-v1.

### 🏥 Health Check

#### `GET /api-v1/`

Verificar el estado de la API.

**Response Exitoso (200):**

```json
{
  "message": "Ok",
  "status": 200
}
```

### 📱 Usuarios

#### `GET /api-v1/users`

Listar todos los usuarios registrados.

**Response Exitoso (200):**

```json
{
  "success": true,
  "message": "Lista de usuarios recuperada exitosamente",
  "data": [
    {
      "id": 1,
      "wallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@example.com",
      "role": "USER",
      "isActive": true
    }
  ]
}
```

#### `POST /api/v1/users`

Crear un nuevo usuario en el sistema.

**Request Body:**

```json
{
  "wallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "phone": "+1234567890",
  "address": "Calle Falsa 123",
  "dni": "12345678",
  "profileImage": "https://example.com/avatar.jpg"
}
```

**Response Exitoso (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "wallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "phone": "+1234567890",
    "address": "Calle Falsa 123",
    "dni": "12345678",
    "profileImage": "https://example.com/avatar.jpg",
    "role": "USER",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores Comunes:**

- `409`: "Ya existe un usuario registrado con esta wallet"
- `409`: "Ya existe un usuario registrado con este DNI"
- `422`: "La wallet debe ser una clave pública de Solana válida"

#### `POST /api/v1/users/admin`

Crear un usuario administrador.

**Request Body:**

```json
{
  "wallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "nombre": "Admin",
  "apellido": "User",
  "adminSecret": "tu_secreto_admin_super_secreto"
}
```

#### `GET /api/v1/users/:wallet`

Obtener información de un usuario por su wallet.

**Response Exitoso (200):**

```json
{
  "success": true,
  "data": {
    "exists": true,
    "user": {
      "id": 1,
      "wallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@example.com",
      "role": "USER",
      "isActive": true
    }
  }
}
```

#### `PUT /api/v1/users/:wallet`

Actualizar información de un usuario.

**Request Body:**

```json
{
  "requesterWallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "nombre": "Juan Carlos",
  "email": "juancarlos@example.com",
  "phone": "+1234567890",
  "address": "Nueva Dirección 456"
}
```

#### `DELETE /api/v1/users/:wallet`

Eliminar un usuario (solo administradores).

**Request Body:**

```json
{
  "requesterWallet": "admin_wallet_address"
}
```

### 🏠 Propiedades

#### `POST /api/v1/properties`

Registrar una nueva propiedad.

**Request Body:**

```json
{
  "nombre": "Casa de Playa",
  "ownerWallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "pdaKey": "11111111111111111111111111111111",
  "pricePerNight": 150.5,
  "ubicacion": "Miami Beach, FL",
  "latitud": 25.7617,
  "longitud": -80.1918,
  "comentarios": "Hermosa casa frente al mar con vistas increíbles",
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg", "https://example.com/image3.jpg"]
}
```

#### `GET /api-v1/properties`

Listar todas las propiedades registradas.

#### `GET /api-v1/properties/user/:wallet`

Listar propiedades de un usuario específico.

#### `PUT /api-v1/properties/:id`

Actualizar una propiedad.

**Request Body:**

```json
{
  "requesterWallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "nombre": "Casa de Playa Actualizada",
  "pricePerNight": 175.0,
  "comentarios": "Nuevas amenidades incluidas: piscina privada y wifi"
}
```

#### `DELETE /api-v1/properties/:id`

Eliminar una propiedad.

**Request Body:**

```json
{
  "requesterWallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
}
```

### 🔐 Wallet (Pendiente de Implementación)

#### `POST /api-v1/wallet/connect`

Conectar wallet de Solana.

**Response Actual (501):**

```json
{
  "message": "Not implemented yet",
  "status": false
}
```

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── __tests__/           # Tests unitarios
│   ├── controllers/         # Lógica de negocio
│   │   ├── user.ts         # Controlador de usuarios
│   │   └── property.ts     # Controlador de propiedades
│   ├── middlewares/         # Middleware de validación
│   │   ├── user.middleware.ts    # Validaciones de usuarios
│   │   └── property.middleware.ts # Validaciones de propiedades
│   ├── routes/             # Definición de rutas
│   │   ├── user.routes.ts  # Rutas de usuarios
│   │   ├── property.routes.ts # Rutas de propiedades
│   │   └── walletRoutes.ts # Rutas de wallet (pendiente)
│   ├── database/           # Configuración de DB
│   │   ├── entities/       # Entidades TypeORM
│   │   │   ├── User.ts     # Entidad Usuario
│   │   │   ├── Property.ts # Entidad Propiedad
│   │   │   ├── Penalty.ts  # Entidad Penalización
│   │   │   ├── base/       # Entidades base
│   │   │   └── enums/      # Enumeraciones
│   │   ├── repositories/   # Repositorios personalizados
│   │   ├── appDataSource.ts # Configuración TypeORM
│   │   └── databaseConfig.ts # Configuración de conexión
│   ├── utils/              # Utilidades
│   │   ├── inputValidations.ts # Validaciones de inputs
│   │   └── responseAndLogger.ts # Respuestas y logging
│   ├── typescript/         # Tipos TypeScript
│   ├── index.ts            # Punto de entrada
│   └── server.ts           # Configuración del servidor
├── scripts/                # Scripts de utilidad
├── .env.example           # Variables de entorno ejemplo
├── package.json           # Dependencias y scripts
├── tsconfig.json          # Configuración TypeScript
└── README.md             # Este archivo
```

---

## 🛠️ Scripts Disponibles

| Script       | Comando                                    | Descripción                        |
| ------------ | ------------------------------------------ | ---------------------------------- |
| `dev`        | `tsx --watch --env-file .env src/index.ts` | Inicia servidor en modo desarrollo |
| `start`      | `node --env-file .env dist/index.js`       | Ejecuta aplicación compilada       |
| `build`      | `tsc -p tsconfig.build.json`               | Compila TypeScript                 |
| `type-check` | `tsc --noEmit`                             | Verifica tipos sin compilar        |
| `lint`       | `eslint .`                                 | Revisa código con ESLint           |
| `lint:fix`   | `eslint --fix .`                           | Corrige errores de ESLint          |
| `format`     | `prettier --write .`                       | Formatea código con Prettier       |
| `test`       | `vitest`                                   | Ejecuta tests                      |
| `test:run`   | `vitest --run`                             | Ejecuta todos los tests            |
| `coverage`   | `vitest run --coverage`                    | Genera reporte de cobertura        |
| `migrate`    | `tsx --env-file .env scripts/migrate.ts`   | Ejecuta migraciones                |

---

## 🗄️ Base de Datos

### Entidades Principales

#### User

```typescript
interface User {
  id: number;
  wallet: string; // Wallet de Solana (única)
  nombre: string; // Nombre del usuario
  apellido: string; // Apellido del usuario
  email?: string; // Email (opcional)
  phone?: string; // Teléfono (opcional)
  address?: string; // Dirección (opcional)
  dni?: string; // DNI (único, opcional)
  profileImage?: string; // URL de imagen de perfil
  role: UserRole; // USER | ADMIN
  isActive: boolean; // Estado del usuario
  createdAt: Date;
  updatedAt: Date;
}
```

#### Property

```typescript
interface Property {
  id: number;
  nombre: string; // Nombre de la propiedad
  ownerWallet: string; // Wallet del propietario
  pdaKey: string; // Clave PDA única (on-chain)
  pricePerNight: number; // Precio por noche
  ubicacion?: string; // Ubicación descriptiva
  latitud?: number; // Coordenada latitud
  longitud?: number; // Coordenada longitud
  comentarios?: string; // Comentarios adicionales
  images: string[]; // Array de URLs de imágenes
  status: PropertyStatus; // ACTIVE | INACTIVE | PENDING
  isActive: boolean; // Estado activo/inactivo
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔒 Seguridad

### Validaciones Implementadas

- **Wallet de Solana**: Validación de formato Base58 (32-44 caracteres)
- **DNI**: Único y opcional
- **Email**: Formato válido (opcional)
- **Roles**: Verificación de permisos para operaciones críticas
- **Ownership**: Solo propietarios o admins pueden modificar/eliminar

---

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
yarn install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Ejecutar migraciones
yarn migrate

# 4. Iniciar servidor
yarn dev

# 5. Probar API
curl http://localhost:4040/api-v1/users
```
