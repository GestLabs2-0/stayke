# Estructura y Funcionamiento del Directorio `src/services`

Este documento explica la estructura y funcionamiento del directorio `src/services` del proyecto "Rifas La Máquina" para que puedas implementar una configuración similar en otros proyectos.

## 📁 Estructura del Directorio

```
src/services/
├── api.ts                        # Servicio principal de API REST
├── authApi.ts                    # Servicio de autenticación con Axios
├── internalNotificationService.ts # Servicio de notificaciones internas
└── notificationService.ts        # Servicio de notificaciones (externas e internas)
```

## 🔧 Configuración Principal

### 1. Archivo de Configuración (`src/constants.ts`)

La configuración centralizada se encuentra en `src/constants.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030",
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"),
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },
  ENDPOINTS: {
    // Rifas
    RIFAS: "/rifas",
    RIFAS_ACTIVE: "/rifas/active",
    RIFA_BY_ID: (id: number) => `/rifas/${id}`,
    
    // Tickets
    TICKETS: "/tickets",
    TICKETS_BY_STATE: (state: string) => `/tickets/state/${state}`,
    
    // Clientes
    CLIENTS: "/clients",
    CLIENT_BY_CEDULA: (cedula: string) => `/clients/cedula/${cedula}`,
    
    // Autenticación
    AUTH_LOGIN: "/auth/login",
    AUTH_INFO: "/auth/info",
  },
};
```

## 📋 Servicios Detallados

### 1. `api.ts` - Servicio Principal de API

**Propósito**: Servicio principal que maneja todas las operaciones CRUD usando fetch nativo.

**Características**:
- Usa patrón Singleton
- Autenticación automática con Bearer Token
- Manejo centralizado de errores
- Tipado TypeScript completo

**Estructura básica**:
```typescript
class ApiService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }
  
  // Método privado para peticiones HTTP
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Configuración de headers con token
    const token = localStorage.getItem("accessToken");
    
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };
    
    // Manejo de errores y respuesta
    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    // ...
  }
  
  // Métodos de ejemplo
  async getRifas(): Promise<Rifa[]> {
    const response = await this.request<Rifa[]>("/rifas");
    return response.data;
  }
  
  async createRifa(rifaData: CreateRifaRequest): Promise<Rifa> {
    const response = await this.request<Rifa>("/rifas", {
      method: "POST",
      body: JSON.stringify(rifaData),
    });
    return response.data;
  }
}

export const apiService = new ApiService();
```

**Métodos principales disponibles**:
- **Rifas**: `getRifas()`, `getRifaById()`, `createRifa()`, `updateRifa()`, `deleteRifa()`, `finishRifa()`, `generateTickets()`
- **Tickets**: `getTickets()`, `getTicketsByRifa()`, `reserveTicket()`, `sellTicket()`, `validatePayment()`
- **Clientes**: `getClients()`, `getClientByCedula()`, `createClientWithTickets()`, `updateClient()`
- **Autenticación**: `loginAdmin()`, `getAuthInfo()`

### 2. `authApi.ts` - Servicio de Autenticación con Axios

**Propósito**: Manejo específico de autenticación usando Axios con interceptores.

**Características**:
- Configuración de Axios con interceptores
- Manejo automático de token expirado
- Redirección automática al login
- Gestión de localStorage

**Estructura básica**:
```typescript
const authApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

// Interceptor para agregar token
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores 401
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.accessToken);
      window.location.href = "/authentication/login";
    }
    return Promise.reject(error);
  }
);

class AuthService {
  async login(credentials: LoginCredentials): Promise<{ status: boolean; message: string }> {
    // Lógica de login
  }
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem(LOCAL_STORAGE_KEYS.accessToken);
  }
  
  logout(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.accessToken);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.user);
  }
}
```

### 3. `internalNotificationService.ts` - Notificaciones Internas

**Propósito**: Sistema de notificaciones locales usando localStorage.

**Características**:
- Almacenamiento en localStorage
- Tipos de notificaciones: `ticket_purchase`, `ticket_validation`, `rifa_finished`, `general`
- Límite de 50 notificaciones
- Estados: leído/no leído

**Estructura básica**:
```typescript
export interface InternalNotification {
  id: string;
  type: "ticket_purchase" | "ticket_validation" | "rifa_finished" | "general";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: {
    client?: Client;
    tickets?: Ticket[];
    rifa?: Rifa;
    totalAmount?: number;
  };
}

class InternalNotificationService {
  private readonly STORAGE_KEY = "rifas_notifications";
  
  addNotification(notification: Omit<InternalNotification, "id" | "timestamp" | "read">): void {
    // Crear y guardar notificación
  }
  
  getAllNotifications(): InternalNotification[] {
    // Obtener todas las notificaciones
  }
  
  getUnreadNotifications(): InternalNotification[] {
    // Filtrar no leídas
  }
  
  markAsRead(notificationId: string): void {
    // Marcar como leída
  }
}
```

### 4. `notificationService.ts` - Servicio de Notificaciones

**Propósito**: Orquestador de notificaciones (internas y externas).

**Características**:
- Integra notificaciones internas
- Preparado para WhatsApp y Email (actualmente comentado)
- Sistema de plantillas para mensajes

**Estructura básica**:
```typescript
class NotificationService {
  async notifyTicketPurchase(notificationData: TicketPurchaseNotification): Promise<void> {
    // Crear notificación interna
    internalNotificationService.createTicketPurchaseNotification({
      client: notificationData.client,
      tickets: notificationData.tickets,
      rifa: notificationData.rifa,
      totalAmount: notificationData.totalAmount,
      paymentReference: notificationData.paymentReference,
    });
    
    // En el futuro: enviar WhatsApp y Email
  }
}
```

## 🏗️ Patrones de Diseño Utilizados

### 1. Singleton Pattern
Todos los servicios exportan una instancia única:
```typescript
export const apiService = new ApiService();
export const authService = new AuthService();
export const internalNotificationService = new InternalNotificationService();
export const notificationService = new NotificationService();
```

### 2. Repository Pattern
Los servicios abstraen la comunicación con la API:
```typescript
// En lugar de hacer fetch directamente
const data = await apiService.getRifas();

// El servicio maneja la configuración, headers, errores, etc.
```

### 3. Type Safety
Uso extensivo de TypeScript para tipado:
```typescript
interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
  errors?: Record<string, string>;
}
```

## 🔐 Manejo de Autenticación

### Token Management
```typescript
// Los servicios manejan automáticamente el token
const token = localStorage.getItem("accessToken");
if (token) {
  headers["Authorization"] = `Bearer ${token}`;
}
```

### Error Handling
```typescript
// Manejo automático de 401
if (error.response?.status === 401) {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.accessToken);
  window.location.href = "/authentication/login";
}
```

## 📦 Estructura de Datos

### Tipos Principales
```typescript
// Entidades principales
interface Rifa {
  id: number;
  title: string;
  description: string;
  price: number;
  maxTickets: number;
  state: "active" | "finished";
}

interface Ticket {
  id: number;
  value: number;
  state: "enable" | "pending" | "sold";
  clientId?: number;
  rifaId: number;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  cedula: string;
  phone: string;
  email: string;
}
```

## 🚀 Cómo Implementar en Otro Proyecto

### 1. Estructura Base
```
src/
├── services/
│   ├── api.ts
│   ├── authApi.ts
│   └── [otros servicios]
├── constants.ts
└── types/
    ├── api.ts
    └── auth.ts
```

### 2. Configuración Inicial
```typescript
// constants.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030",
  TIMEOUT: 10000,
  ENDPOINTS: {
    // Define tus endpoints aquí
  },
};
```

### 3. Servicio Base
```typescript
// api.ts
class ApiService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Implementación base
  }
  
  // Tus métodos específicos
  async getEntities(): Promise<Entity[]> {
    // Implementación
  }
}

export const apiService = new ApiService();
```

### 4. Variables de Entorno
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3030
NEXT_PUBLIC_API_TIMEOUT=10000
```

## 🎯 Mejores Prácticas

1. **Centralizar configuración** en `constants.ts`
2. **Usar Tipos TypeScript** para todas las respuestas
3. **Manejar errores** centralizadamente
4. **Implementar autenticación** automática
5. **Usar patrones Singleton** para servicios
6. **Separar responsabilidades** (API, Auth, Notificaciones)
7. **Documentar endpoints** y tipos de datos

## 🔍 Ejemplo de Uso Completo

```typescript
// En un componente o hook
import { apiService } from '../services/api';

const loadRifas = async () => {
  try {
    const rifas = await apiService.getRifas();
    setRifas(rifas);
  } catch (error) {
    console.error('Error cargando rifas:', error);
  }
};

const createNewRifa = async (rifaData: CreateRifaRequest) => {
  try {
    const newRifa = await apiService.createRifa(rifaData);
    console.log('Rifa creada:', newRifa);
  } catch (error) {
    console.error('Error creando rifa:', error);
  }
};
```

Esta estructura proporciona una base sólida y escalable para manejar APIs REST en aplicaciones TypeScript/React con autenticación y notificaciones integradas.
