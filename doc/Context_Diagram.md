# Context Diagram
> Defining the scope and external interactions of The Gathering system

## 1. Purpose
The **Context Diagram (Level 0 DFD)** is a simple yet incredibly powerful visualization technique in Requirements Engineering. This diagram helps to:
- Place The Gathering software project at the center of its environment.
- Clearly delineate the System Boundaries – identifying what the project must code and resolve vs. what lies outside its control (External Entities).
- Provide a high-level overview for non-technical Stakeholders (Clients, Sponsors) regarding Internet connectivity flows.

## 2. Identifying External Entities
The Gathering does not exist in isolation on a Local Cloud but integrates tightly with colossal third-party digital platforms, including:
1. **Cloud Streaming Infrastructure (Agora SFU):** Resolves the issue of routing massive Video/Audio traffic, bypassing personal bandwidth limitations.
2. **Google Identity Provider (OAuth 2.0):** Authenticates cross-system identities without needing to build an expensive, proprietary password security protocol.
3. **Gmail SMTP Server (Nodemailer API):** The physical mail-routing platform used via postal protocols to send one-time configuration flags (OTP Auth).
4. **User Input Devices:** Browser Hardware (Microphone, Virtual Camera).

## 3. Design Boundary Diagram (Context Diagram)

```mermaid
flowchart TD
    %% Deterministic User Actors
    USERS[Client Browser (Student, Speaker, Admin)]

    %% Core System in the Middle (Project Scope)
    subgraph SystemBoundary ["The Gathering System (Coding Responsibility Zone)"]
        SYS((The Gathering<br/>Platform))
    end

    %% Software Blocks outside the Ecosystem
    AGORA[Agora Cloud SFU Telecom Server]
    OAUTH[Google Auth Server (OAuth)]
    SMTP[SMTP Mail System (Nodemailer)]

    %% Interaction Data Flows
    USERS <-->|#1: Web Actions, Avatar Movement (HTTP/WebSocket)| SYS
    USERS <-->|#2: Direct Video/Audio Track Transfer (Bypass Backend)| AGORA
    
    SYS -->|#3: Delegate WebRTC Token Certification| AGORA
    SYS <-->|#4: Redirect, Request User Email Info| OAUTH
    SYS -->|#5: Generate Code, Emit Send OTP Mail Command| SMTP
    
    %% Diagram CSS Formatting
    classDef C_Main fill:#e1f5fe,stroke:#0288d1,stroke-width:3px;
    classDef C_Ext fill:#fff3e0,stroke:#f57c00,stroke-width:2px,stroke-dasharray: 4 4;
    classDef C_User fill:#f1f8e9,stroke:#689f38,stroke-width:2px;
    
    class SYS C_Main;
    class AGORA,OAUTH,SMTP C_Ext;
    class USERS C_User;
```

## 4. Decoding Communication Flows (DFD Data Flows)

Explaining each connection line on the diagram to understand project "Contracts":
- **Flow #1:** Operates by merging two protocols: HTTPS for standard REST API routes (reading avatar images, posting on forums), and bidirectional Socket.IO for maintaining continuous connection states (Pushing Avatar movement events).
- **Flow #2 (Special):** The presence of a direct WebRTC shortcut from the User's Browser to the Agora Server indicates that The Gathering system only acts to "Trigger" the connection. All risks related to video lag, dropped packets, or server crashes are completely *Bypassed (delegated)* from the System to the External Agora Network. Thus, The Gathering's Node.js Server is preserved to handle 2D Socket logic.
- **Flow #3 & #4 & #5:** Transmission channels for secure Tokenizer string keys.
