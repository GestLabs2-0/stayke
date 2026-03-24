# 🏠 Stayke

> Plataforma de alquileres a corto plazo sobre Solana — donde la reputación es on-chain y la confianza no es negociable.

---

## ¿Qué es Stayke?

Stayke es una plataforma descentralizada de alquileres a corto plazo construida sobre Solana que utiliza primitivos de blockchain para resolver el problema de confianza en el corazón de cualquier marketplace de hosting. Huéspedes y anfitriones interactúan a través de una arquitectura híbrida: los contratos inteligentes (Anchor) se encargan de garantías, escrow, reputación y bloqueos, mientras que un backend tradicional gestiona los listados de propiedades y la búsqueda. Un frontend en Next.js une ambas capas usando la clave pública del usuario como foreign key universal.

---

## Visión General de la Arquitectura

```
┌──────────────────────────────────────────────────────┐
│               Frontend en Next.js                    │
│   (Wallet Connect → clave pública como FK universal) │
└────────────────────┬─────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
   ┌──────▼──────┐      ┌───────▼───────┐
   │   Backend   │      │  Contratos    │
   │ Tradicional │      │  Anchor       │
   │ (listados,  │      │  (on-chain:   │
   │  búsqueda)  │      │  garantías,   │
   └─────────────┘      │  escrow,      │
                        │  reputación,  │
                        │  bloqueos)    │
                        └───────────────┘
```

**Decisión de diseño clave:** La cédula de identidad nacional se usa como seed del PDA para garantizar unicidad de usuario a nivel de protocolo, previniendo ataques sybil en el sistema de reputación.

---

## ✅ Lo que está construido

### Contratos Inteligentes (Anchor)
- **Registro de usuarios** — PDA inicializado con la cédula como seed para garantías de unicidad
- **Sistema de escrow** — Los fondos se retienen durante una reserva y se liberan al completarse exitosamente
- **Cuentas de reputación** — Estado de reputación on-chain por usuario, actualizado por reviews verificadas
- **Programa de bloqueos** — Anfitriones o huéspedes con violaciones graves pueden ser marcados y bloqueados a nivel de protocolo
- **Depósitos de garantía** — Los anfitriones depositan SOL como colateral, alineando incentivos en torno al cuidado de la propiedad

### Frontend
- Integración de wallet (Phantom / wallets estándar de Solana)
- Flujo de reserva conectado al escrow on-chain
- Visualización básica de listados desde el backend tradicional

### Backend
- Gestión de datos de propiedades (off-chain por eficiencia de costos)
- Clave pública como FK que enlaza la identidad on-chain con los listados off-chain

---

## 🚧 Roadmap e Ideas por Desarrollar

### 🎟️ Tokens de Descuento
Emisión de tokens SPL que otorgan descuentos en reservas a sus poseedores. Los tokens pueden distribuirse como recompensas para usuarios tempranos, referidos o campañas promocionales. Al ser tokens SPL, son transferibles, componibles y visibles en cualquier wallet de Solana — sin jardines cerrados.

### 👥 Pool de Reviewers
Un pool curado de reviewers verificados que ganan recompensas por dejar reseñas de calidad y a tiempo. Los reviewers depositan una pequeña cantidad para unirse al pool, creando incentivos reales contra el spam o las reseñas deshonestas. El peso de cada review varía según el historial del reviewer — alguien con un largo track record de evaluaciones precisas tiene más señal de reputación que un recién llegado.

### 🔷 Inversión en Nodos Validadores de Solana
Una parte de las comisiones de la plataforma se destina a hacer staking con nodos validadores de Solana. Esto cumple dos objetivos:
1. Genera rendimiento que puede financiar el desarrollo del protocolo y recompensas a la comunidad
2. Fortalece la red de Solana aumentando su descentralización — la comunidad de Stayke participa directamente en la salud de la cadena sobre la que opera

### ⚖️ Sistema de Confianza para Anfitriones
Un trust score compuesto que combina:
- **Historial de reviews** — promedio ponderado proveniente del pool de reviewers
- **Monto del depósito** — anfitriones con depósitos mayores señalan un compromiso más fuerte con la calidad
- **Registro de incidentes** — flags de bloqueo on-chain e historial de disputas

El mecanismo de severidad es el diferenciador clave: un solo incidente grave (daño a la propiedad, no presentarse, fraude) tiene un peso desproporcionado frente a las reseñas positivas acumuladas. La confianza es difícil de construir y fácil de perder — por diseño. Los huéspedes pueden filtrar listados por trust score mínimo antes de reservar.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Contratos Inteligentes | Rust, Anchor Framework |
| Blockchain | Solana (Devnet → Mainnet) |
| Frontend | Next.js, TypeScript |
| Backend | Node.js / Rust |
| Serialización | Borsh (vía Anchor) |

---

## Equipo

Construido durante el Hackathon de Solana (marzo de 2025) por:

- **Gabriel** — Arquitectura de contratos inteligentes y desarrollo Anchor
- **José Medina** — Frontend e integraciones
- **Raúl González** — Backend e integraciones

---

> ⚠️ Trabajo en progreso. Sin auditoría. No usar en producción.

---

## Licencia

MIT