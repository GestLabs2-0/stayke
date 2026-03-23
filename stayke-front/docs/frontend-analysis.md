# Análisis del Frontend de Stayke

## 📱 **Estructura General**

- **Framework**: Next.js 16 con TypeScript
- **Estilos**: Tailwind CSS v4
- **Integración Solana**: @solana/react-hooks v1.1.5
- **Arquitectura**: Client-side rendering con React Context para estado global

## 🔗 **Conexión y Desconexión de Wallet**

### **Conexión**
- **Componente principal**: `PhantomModal.tsx`
- **Flujo**:
  1. Usuario hace clic en "Connect Wallet" → abre modal
  2. Detecta si Phantom está instalado
  3. Intenta conexión con timeout de 10 segundos
  4. Al conectar, verifica si la wallet está registrada
  5. Si no está registrada → redirige a `/register`
  6. Si está registrada → login directo

### **Desconexión**
- **Métodos disponibles**:
  - Desde `UserMenu` en navbar: "Disconnect"
  - Desde `WalletButton`: dropdown con opción "Disconnect"
  - Automática: si la wallet se desconecta, el AuthContext limpia el usuario

### **Gestión de Estado**
- **AuthProvider**: Maneja estado de autenticación global
- **useWalletConnection**: Hook de Solana para conexión de wallet
- **Efecto automático**: `useEffect` que limpia sesión si wallet se desconecta

## 🏗️ **Estructura de Views**

### **Páginas Principales**
```
src/app/
├── page.tsx (Home)
├── register/page.tsx (Registro multi-step)
├── profile/page.tsx (Perfil de usuario)
├── bookings/ (Reservas)
├── listPropertys/ (Listar propiedades)
└── listing/ (Detalle de propiedad)
```

### **Componentes Layout**
- **Navbar**: Condicional entre `WalletButton` y `UserMenu`
- **Footer**: Enlaces estáticos
- **Providers**: SolanaProvider + AuthProvider

## 🎭 **Renderizado Condicional**

### **Navbar Principal**
```typescript
{isRegistered ? <UserMenu /> : <WalletButton />}
```

### **UserMenu (conectado)**
- Muestra nombre, balance SOL, reputación
- Opciones: Profile, Bookings, Add Property (solo hosts)
- Dropdown con información de wallet

### **WalletButton (no conectado)**
- Botón "Connect Wallet" que abre modal
- Si ya hay wallet conectada pero no registrado: muestra dropdown con opciones

### **Perfil de Usuario**
- **Protegido**: `useEffect` redirige a home si no está registrado
- **Condicional Host**: Muestra badge "Host" y opción "Add Property" solo para usuarios `isHost`

## 📋 **Formularios y Validaciones**

### **Formulario de Registro (Multi-step)**
**3 pasos con validación progresiva:**

#### **Step 1 - Personal Info** (`StepPersonal.tsx`)
- **Campos**: First Name, Last Name, DNI/ID, Profile Picture
- **Validaciones**: 
  - Imagen: acepta cualquier formato de imagen
  - Campos de texto: sin validaciones específicas (solo required implícito)

#### **Step 2 - Contact** (`StepContact.tsx`)
- **Campos**: Email, Phone, Address
- **Validaciones**:
  - Email: `type="email"` (validación nativa del browser)
  - Phone: `type="tel"` (formato telefónico)
  - Address: texto libre

#### **Step 3 - Role** (`StepRole.tsx`)
- **Campo**: isHost (boolean)
- **Validación**: Selección obligatoria entre "Host" o "Client"

### **Componente Field Genérico**
```typescript
<Field 
  label="Email"
  type="email"
  value={form.email}
  onChange={(v) => onChange("email", v)}
  placeholder="john@example.com"
/>
```

### **Validaciones Identificadas**
- **Cliente-side**: Solo validaciones nativas HTML5
- **No hay validaciones personalizadas** para:
  - Longitud mínima de campos
  - Formato de DNI
  - Formato de teléfono específico
  - Campos requeridos (depende del browser)

## 🔐 **Flujo de Autenticación**

### **Mock System (Actual)**
- `mockLogin`: Simula verificación de usuario
- `mockRegister`: Simula registro exitoso
- TODO: Comentarios indicando donde irían llamadas reales a `/api/auth/verify` y `/api/auth/register`

### **Estados de Autenticación**
- `user`: Datos del usuario logueado
- `isLoading`: Estado de carga
- `isRegistered`: Boolean basado en existencia de user

## 📊 **Gestión de Datos**

### **Hooks Personalizados**
- `useSolBalance`: Obtiene balance SOL de una dirección
- `useAuth`: Acceso al contexto de autenticación

### **Tipos de Datos**
- **User**: id, firstName, lastName, email, phone?, wallet, isHost, image?, reputation, reviews?
- **RegisterFormData**: Datos del formulario de registro
- **RegisterPayload**: Datos enviados al backend

## 🚨 **Observaciones y Mejoras Potenciales**

1. **Validaciones débiles**: Solo validaciones HTML5, sin validaciones personalizadas
2. **Sin manejo de errores**: Los formularios no muestran errores específicos
3. **Mock system**: Toda la autenticación es simulada
4. **Sin loading states**: Algunas operaciones no muestran estado de carga
5. **Accesibilidad**: Faltan atributos ARIA en algunos componentes

## 📁 **Estructura de Archivos Clave**

```
src/
├── Context/AuthContext.tsx          # Gestión de autenticación
├── components/
│   ├── Layout/
│   │   ├── Navbar.tsx              # Navegación principal
│   │   └── Modal/PhantomModal.tsx  # Modal de conexión
│   ├── WalletButton.tsx            # Botón de wallet
│   ├── RegisterForms/              # Formularios de registro
│   └── shared/FieldInput/          # Componentes de formulario
├── app/                            # Páginas de Next.js
├── types/                          # Definiciones TypeScript
└── constants.ts                    # Datos estáticos y configuración
```

El frontend está bien estructurado con una separación clara de responsabilidades, pero las validaciones y manejo de errores podrían reforzarse para una mejor experiencia de usuario.
