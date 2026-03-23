# Stayke System Flowchart

Este documento contiene diagramas que ilustran la arquitectura y los flujos principales del ecosistema Stayke.

## 1. Arquitectura General y Roles

Este diagrama muestra cómo interactúan los diferentes participantes (Huésped, Anfitrión y Administrador) con los distintos componentes y bóvedas del protocolo.

```mermaid
graph TD
    %% Participantes
    Guest((👤 Huésped))
    Host((🏠 Anfitrión))
    Admin((🛡️ Administrador))

    %% Bóvedas / PDAs
    Treasury[(💰 Bóveda de Garantías\nTreasury)]
    PlatformVault[(🏦 Platform Vault\nGanancias Stayke)]
    Escrow[(🔒 Escrow de Reserva\nTemporal)]

    %% Perfil y Registro
    Guest -- "1. register_user()" --> Profile[Perfil de Usuario]
    Host -- "1. register_user()" --> Profile
    Profile -- "2. deposit_funds()" --> Treasury

    %% Hosting
    Profile -- "3. set_host_status()" --> HostAcc[Cuenta de Anfitrión\nHost Profile]
    HostAcc -- "4. register_property()" --> Property[Cuenta de Propiedad]

    %% Flujo de Reserva
    Guest -- "create_booking()" --> Booking[Cuenta de Reserva]
    Booking -. Relacionado con .-> Property
    
    %% Escrow
    Booking -- "accept_reserve()" --> Escrow
    
    %% Moderación
    Admin -- "verify_identity()" --> Profile
    Admin -- "penalize_user()" --> Treasury
    Admin -- "penalize_user()" --> Infractions[Historial de Infracciones]

    %% Disputas
    Admin -- "resolve_dispute()" --> Escrow
    
    %% Trazos y Transferencias de Fondos (Success)
    Escrow -. "Flujo de Completado" .-> Host
    Escrow -. "Fee de Plataforma" .-> PlatformVault
```

## 2. Ciclo de Vida de la Reserva (Booking Lifecycle)

El siguiente modelo de estados (State Machine) representa todas las fases por las que pasa una reserva y bajo qué instrucción (método) ocurre la transición.

```mermaid
stateDiagram-v2
    [*] --> Pending: create_booking() (Huésped)
    
    Pending --> HostAccepted: host_pending_accept()
    Pending --> Cancelled: host_pending_reject()
    
    HostAccepted --> Cancelled: client_reject_reserve()
    HostAccepted --> Active: accept_reserve() (Huésped deposita renta al Escrow)
    
    Active --> Completed: complete_stay() / close_booking()
    Completed --> [*]
    
    Active --> Disputed: open_dispute() (Huésped o Anfitrión)
    
    Disputed --> DisputeResolved: resolve_dispute() (Admin)
    Disputed --> DisputeRejected: resolve_dispute() (Admin reject)
    
    DisputeResolved --> Closed: close_dispute() (Admin)
    DisputeRejected --> Closed: close_dispute() (Admin)
    
    Closed --> [*]
    Cancelled --> [*]
```

## 3. Sistema de Garantías y Penalizaciones (Trust & Safety)

Diagrama detallado sobre qué ocurre con el depósito de capital en forma de garantía.

```mermaid
flowchart LR
    Start([Inicio]) --> Register[register_user]
    Register --> Deposit[deposit_funds en USDC]
    Deposit --> Safe{Fondo en Treasury}
    
    Safe -->|Sin reservas activas| Withdraw[withdraw_guarantee]
    Withdraw --> End([Fin])
    
    Safe -->|Comete Infracción| Penalize[penalize_user por Admin]
    Penalize --> Threshold{Suma de Infracciones}
    
    Threshold -->|Excede Límite| Ban[Usuario Baneado]
    Ban --> CannotUse[No puede reservar ni hospedar]
    
    Threshold -->|Dentro de Límite| Safe
    
    Penalize -. Resta USDC .-> EscrowTreasury[Treasury transfiere a Billetera Afectada]
```
