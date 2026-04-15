# USE CASE DIAGRAMS

**Project:** The Gathering — Virtual Co-Working Platform
**Document Type:** Software Requirements Specification — Use Case Diagrams
**Notation:** UML 2.x (Mermaid)
**Version:** 1.0
**Date:** 2026-03-11

---

## TABLE OF CONTENTS

| #      | Diagram                   | Scope                            |
| :----- | :------------------------ | :------------------------------- |
| UC-D0  | System Overview           | Entire platform                  |
| UC-D1  | Authentication Management | Register, Login, Logout          |
| UC-D2  | Profile Management        | View, Edit, Avatar               |
| UC-D3  | Realm Management          | Create, Edit, Delete, Share      |
| UC-D4  | Real-time Interaction     | Move, Teleport, Room transitions |
| UC-D5  | Chat System               | Channels, DMs, Messages          |
| UC-D6  | Calling System            | Video call signaling             |
| UC-D7  | Event Management          | Calendar, RSVP                   |
| UC-D8  | Resource Library          | Upload, Browse, Search           |
| UC-D9  | Forum                     | Threads, Posts                   |
| UC-D10 | Admin Console             | Dashboard, User/Realm management |

---

## UML NOTATION LEGEND

| Mermaid Syntax     | UML Element               | Description                                                         |
| :----------------- | :------------------------ | :------------------------------------------------------------------ | -------------- | ------------------------------------------------------------ |
| `Actor((Name))`    | Actor                     | Circle — a person or external system that interacts with the system |
| `UC([Name])`       | Use Case                  | Stadium shape (rounded ellipse) — a system function                 |
| `subgraph "Title"` | System Boundary           | Rectangle enclosing all use cases in scope                          |
| `Actor --> UC`     | Association               | Solid arrow — actor participates in use case                        |
| `UC1 -.->          | "&lt;&lt;include&gt;&gt;" | UC2`                                                                | Include        | Dashed arrow — base **always** invokes the included use case |
| `UC1 -.->          | "&lt;&lt;extend&gt;&gt;"  | UC2`                                                                | Extend         | Dashed arrow — optional extension of the base use case       |
| `Child ---         | "generalizes"             | Parent`                                                             | Generalization | Solid line — child inherits parent actor's role              |
| `Node:::ext`       | External Actor            | Yellow fill — actor/system outside the project scope                |

---

## UC-D0 — SYSTEM OVERVIEW DIAGRAM

> High-level Use Case Diagram showing all actors and primary use cases across the entire platform.

```mermaid
graph LR
    %% ── Primary Actors ──────────────────────────────────────────
    Guest((Guest))
    User((Registered\nUser))
    ROwner((Realm\nOwner))
    Admin((Administrator))

    %% ── Actor Generalizations ────────────────────────────────────
    User ---|"generalizes"| Guest
    ROwner ---|"generalizes"| User
    Admin ---|"generalizes"| User

    %% ── External Actors ──────────────────────────────────────────
    GoogleSvc(["Google OAuth"]):::ext
    VideoSvc(["Video Call\nService"]):::ext
    EmailSvc(["Email\nService"]):::ext

    %% ── System Boundary ──────────────────────────────────────────
    subgraph SYS["The Gathering – Virtual Co-Working Platform"]
        direction TB
        Register([Register])
        Login([Login])
        LoginGoogle([Login via Google])
        Logout([Logout])

        UpdateProfile([Update Profile])
        CustomizeAvatar([Customize Avatar])

        CreateRealm([Create Realm])
        JoinRealm([Join Realm])
        ManageRealm([Manage Realm\nSettings])
        DeleteRealm([Delete Realm])
        EditMap([Edit Map])

        MoveAvatar([Move Avatar])
        Teleport([Teleport])

        ChatUsers([Chat with Users])
        StartCall([Start Video Call])

        CreateEvent([Create Event])
        JoinEvent([Join Event / RSVP])
        ManageResources([Manage Resources])
        CreateThread([Create Forum Thread])
        ReplyThread([Reply to Thread])

        ManageUsersUC([Manage Users])
        ManageRealmsUC([Manage Realms])
        ViewDashboard([View Dashboard])
        ModerateContent([Moderate Content])
    end

    %% ── Actor → Use Case Associations ────────────────────────────
    Guest --> Register
    Guest --> Login
    User --> Login
    User --> Logout
    User --> UpdateProfile
    User --> CustomizeAvatar
    User --> JoinRealm
    User --> MoveAvatar
    User --> ChatUsers
    User --> StartCall
    User --> JoinEvent
    User --> ManageResources
    User --> CreateThread
    User --> ReplyThread
    ROwner --> CreateRealm
    ROwner --> ManageRealm
    ROwner --> DeleteRealm
    ROwner --> EditMap
    ROwner --> CreateEvent
    Admin --> ManageUsersUC
    Admin --> ManageRealmsUC
    Admin --> ViewDashboard
    Admin --> ModerateContent

    %% ── External Actor Associations ──────────────────────────────
    GoogleSvc --> LoginGoogle
    VideoSvc --> StartCall
    EmailSvc --> Register

    %% ── Include / Extend ─────────────────────────────────────────
    Login -.->|"&lt;&lt;extend&gt;&gt;"| LoginGoogle
    Teleport -.->|"&lt;&lt;extend&gt;&gt;"| MoveAvatar

    classDef ext fill:#fffde7,stroke:#f0c040,stroke-dasharray:5 5
```

---

## UC-D1 — AUTHENTICATION MANAGEMENT

> Covers all mechanisms by which a user gains or loses access to the platform: OTP registration, email/password login, and Google OAuth.

```mermaid
graph LR
    %% ── Actors ───────────────────────────────────────────────────
    Guest((Guest))
    User((Registered\nUser))
    EmailSvc(["Email Service\nNodemailer"]):::ext
    GoogleSvc(["Google OAuth\nIdentity Platform"]):::ext

    User ---|"generalizes"| Guest

    subgraph AUTH["Authentication Management"]
        direction TB
        RegOTP([Register via OTP])
        SendOTP([Send OTP Email])
        VerifyOTP([Verify OTP Code])
        RegPass([Register via\nEmail & Password])
        LoginPass([Login via\nEmail & Password])
        LoginGoogle([Login via\nGoogle OAuth])
        AuthGoogle([Authenticate\nwith Google])
        Logout([Logout])
        ValidateJWT([Validate JWT Token])
    end

    %% ── Associations ─────────────────────────────────────────────
    Guest --> RegOTP
    Guest --> RegPass
    Guest --> LoginPass
    Guest --> LoginGoogle
    User --> Logout
    EmailSvc --> SendOTP
    GoogleSvc --> AuthGoogle

    %% ── Include / Extend ─────────────────────────────────────────
    RegOTP -.->|"&lt;&lt;include&gt;&gt;"| SendOTP
    RegOTP -.->|"&lt;&lt;include&gt;&gt;"| VerifyOTP
    LoginPass -.->|"&lt;&lt;include&gt;&gt;"| ValidateJWT
    LoginGoogle -.->|"&lt;&lt;include&gt;&gt;"| AuthGoogle
    LoginGoogle -.->|"&lt;&lt;extend&gt;&gt;"| RegOTP

    classDef ext fill:#fffde7,stroke:#f0c040,stroke-dasharray:5 5
```

---

## UC-D2 — PROFILE MANAGEMENT

> Covers how a registered user views and modifies their personal profile and in-game avatar configuration.

```mermaid
graph LR
    %% ── Actor ────────────────────────────────────────────────────
    User((Registered\nUser))

    subgraph PROF["Profile Management"]
        direction TB
        ViewProfile([View Profile])
        EditProfile([Edit Profile])
        UpdateName([Update Display Name])
        UpdateBio([Update Bio])
        UpdateAvatar([Update Avatar Image])
        CustomizeSkin([Customize Avatar\nSkin & Parts])
        ValidateFields([Validate Field Lengths])
    end

    %% ── Associations ─────────────────────────────────────────────
    User --> ViewProfile
    User --> EditProfile
    User --> CustomizeSkin

    %% ── Include / Extend ─────────────────────────────────────────
    EditProfile -.->|"&lt;&lt;include&gt;&gt;"| ViewProfile
    EditProfile -.->|"&lt;&lt;include&gt;&gt;"| ValidateFields
    CustomizeSkin -.->|"&lt;&lt;include&gt;&gt;"| ViewProfile
    UpdateName -.->|"&lt;&lt;extend&gt;&gt;"| EditProfile
    UpdateBio -.->|"&lt;&lt;extend&gt;&gt;"| EditProfile
    UpdateAvatar -.->|"&lt;&lt;extend&gt;&gt;"| EditProfile
```

---

## UC-D3 — REALM MANAGEMENT

> Covers the full lifecycle of a virtual workspace: creation, configuration, privacy control, and deletion with cascade.

```mermaid
graph LR
    %% ── Actors ───────────────────────────────────────────────────
    User((Registered\nUser))
    Owner((Realm\nOwner))

    Owner ---|"generalizes"| User

    subgraph RM["Realm Management"]
        direction TB
        ViewRealms([View My Realms])
        CreateRealm([Create Realm])
        ChooseTemplate([Choose Map Template])
        EditRealm([Edit Realm Settings])
        RenameRealm([Rename Realm])
        TogglePrivacy([Toggle Privacy Mode])
        RegenShare([Regenerate Share Link])
        DeleteRealm([Delete Realm])
        ConfirmDelete([Confirm Deletion])
        CascadeDelete([Cascade Delete\nAssociated Data])
        EditMap([Edit Realm Map])
        VerifyOwner([Verify Ownership])
    end

    %% ── Associations ─────────────────────────────────────────────
    User --> ViewRealms
    Owner --> CreateRealm
    Owner --> EditRealm
    Owner --> DeleteRealm
    Owner --> EditMap

    %% ── Include / Extend ─────────────────────────────────────────
    CreateRealm -.->|"&lt;&lt;extend&gt;&gt;"| ChooseTemplate
    EditRealm -.->|"&lt;&lt;include&gt;&gt;"| VerifyOwner
    EditRealm -.->|"&lt;&lt;extend&gt;&gt;"| RenameRealm
    EditRealm -.->|"&lt;&lt;extend&gt;&gt;"| TogglePrivacy
    EditRealm -.->|"&lt;&lt;extend&gt;&gt;"| RegenShare
    DeleteRealm -.->|"&lt;&lt;include&gt;&gt;"| VerifyOwner
    DeleteRealm -.->|"&lt;&lt;include&gt;&gt;"| ConfirmDelete
    DeleteRealm -.->|"&lt;&lt;include&gt;&gt;"| CascadeDelete
    EditMap -.->|"&lt;&lt;include&gt;&gt;"| VerifyOwner
```

---

## UC-D4 — REAL-TIME INTERACTION

> Covers avatar mechanics inside an active realm session: joining, movement, teleportation, and disconnecting with position saving.

```mermaid
graph LR
    %% ── Actor ────────────────────────────────────────────────────
    User((Registered\nUser))

    subgraph RT["Real-time Interaction"]
        direction TB
        JoinRealm([Join Realm])
        AuthWS([Authenticate\nWebSocket])
        ValidateShare([Validate Share Link])
        CheckCapacity([Check Realm Capacity])
        RestorePos([Restore Saved Position])
        MoveAvatar([Move Avatar])
        BroadcastPos([Broadcast Position])
        RecalcProximity([Recalculate\nProximity Zones])
        Teleport([Teleport to Room])
        ChangeSkin([Change Avatar Skin])
        LeaveRealm([Leave Realm])
        SavePos([Save Last Position])
    end

    %% ── Associations ─────────────────────────────────────────────
    User --> JoinRealm
    User --> MoveAvatar
    User --> Teleport
    User --> ChangeSkin
    User --> LeaveRealm

    %% ── Include / Extend ─────────────────────────────────────────
    JoinRealm -.->|"&lt;&lt;include&gt;&gt;"| AuthWS
    JoinRealm -.->|"&lt;&lt;include&gt;&gt;"| ValidateShare
    JoinRealm -.->|"&lt;&lt;include&gt;&gt;"| CheckCapacity
    JoinRealm -.->|"&lt;&lt;extend&gt;&gt;"| RestorePos
    MoveAvatar -.->|"&lt;&lt;include&gt;&gt;"| BroadcastPos
    MoveAvatar -.->|"&lt;&lt;include&gt;&gt;"| RecalcProximity
    Teleport -.->|"&lt;&lt;extend&gt;&gt;"| MoveAvatar
    Teleport -.->|"&lt;&lt;include&gt;&gt;"| BroadcastPos
    Teleport -.->|"&lt;&lt;include&gt;&gt;"| RecalcProximity
    LeaveRealm -.->|"&lt;&lt;include&gt;&gt;"| SavePos
```

---

## UC-D5 — CHAT SYSTEM

> Covers ephemeral proximity chat (in-realm, not persisted) and persistent channel / direct-message communication.

```mermaid
graph LR
    %% ── Actor ────────────────────────────────────────────────────
    User((Registered\nUser))

    subgraph CHAT["Chat System"]
        direction TB
        SendProx([Send Proximity\nChat Message])
        RecvProx([Receive Proximity\nChat Message])
        ValidateMsg([Validate Message\nContent])
        ViewChannels([View Channel List])
        JoinChannel([Join Channel])
        SendChannel([Send Channel Message])
        ViewHistory([View Message History])
        CreateChannel([Create Custom Channel])
        DeleteChannel([Delete Channel])
        OpenDM([Open Direct Message])
        SendDM([Send Direct Message])
    end

    %% ── Associations ─────────────────────────────────────────────
    User --> SendProx
    User --> ViewChannels
    User --> JoinChannel
    User --> SendChannel
    User --> OpenDM
    User --> CreateChannel

    %% ── Include / Extend ─────────────────────────────────────────
    SendProx -.->|"&lt;&lt;include&gt;&gt;"| ValidateMsg
    SendProx -.->|"&lt;&lt;include&gt;&gt;"| RecvProx
    SendChannel -.->|"&lt;&lt;include&gt;&gt;"| JoinChannel
    SendChannel -.->|"&lt;&lt;include&gt;&gt;"| ValidateMsg
    ViewHistory -.->|"&lt;&lt;include&gt;&gt;"| JoinChannel
    OpenDM -.->|"&lt;&lt;include&gt;&gt;"| JoinChannel
    SendDM -.->|"&lt;&lt;include&gt;&gt;"| OpenDM
    SendDM -.->|"&lt;&lt;extend&gt;&gt;"| SendChannel
    CreateChannel -.->|"&lt;&lt;extend&gt;&gt;"| ViewChannels
    DeleteChannel -.->|"&lt;&lt;extend&gt;&gt;"| JoinChannel
```

---

## UC-D6 — CALLING SYSTEM

> Covers the WebSocket-based video call signaling flow between two realm participants, with Jitsi for actual media streaming.

```mermaid
graph LR
    %% ── Actors ───────────────────────────────────────────────────
    Caller((Caller\nRegistered User))
    Callee((Callee\nRegistered User))
    JitsiSvc(["Video Call Service\nJitsi"]):::ext

    subgraph CALL["Calling System"]
        direction TB
        InitCall([Initiate Call Request])
        CheckSession([Verify Active Session])
        RecvCall([Receive Call Request])
        AcceptCall([Accept Call])
        RejectCall([Reject Call])
        JoinVideo([Join Video Room])
        ResolveProxID([Resolve Proximity ID])
        EndCall([End Call])
        ToggleMic([Toggle Microphone])
        ToggleCam([Toggle Camera])
        BroadcastMedia([Broadcast Media State])
    end

    %% ── Associations ─────────────────────────────────────────────
    Caller --> InitCall
    Caller --> EndCall
    Caller --> ToggleMic
    Caller --> ToggleCam
    Callee --> RecvCall
    Callee --> AcceptCall
    Callee --> RejectCall
    Callee --> ToggleMic
    Callee --> ToggleCam
    JitsiSvc --> JoinVideo

    %% ── Include / Extend ─────────────────────────────────────────
    InitCall -.->|"&lt;&lt;include&gt;&gt;"| CheckSession
    InitCall -.->|"&lt;&lt;include&gt;&gt;"| RecvCall
    AcceptCall -.->|"&lt;&lt;include&gt;&gt;"| ResolveProxID
    AcceptCall -.->|"&lt;&lt;include&gt;&gt;"| JoinVideo
    AcceptCall -.->|"&lt;&lt;extend&gt;&gt;"| RecvCall
    RejectCall -.->|"&lt;&lt;extend&gt;&gt;"| RecvCall
    ToggleMic -.->|"&lt;&lt;include&gt;&gt;"| BroadcastMedia
    ToggleCam -.->|"&lt;&lt;include&gt;&gt;"| BroadcastMedia

    classDef ext fill:#fffde7,stroke:#f0c040,stroke-dasharray:5 5
```

---

## UC-D7 — EVENT MANAGEMENT

> Covers creation, editing, deletion, and RSVP management for calendar events within a realm.

```mermaid
graph LR
    %% ── Actors ───────────────────────────────────────────────────
    User((Registered\nUser))
    Organizer((Event\nOrganizer))

    Organizer ---|"generalizes"| User

    subgraph EVT["Event Management"]
        direction TB
        BrowseEvents([Browse Event Calendar])
        FilterMonth([Filter Events by Month])
        ViewEvent([View Event Details])
        CreateEvent([Create Event])
        SetDateTime([Set Date and Time])
        ValidateDate([Validate Date Range])
        SetCapacity([Set Capacity Limit])
        EditEvent([Edit Event])
        DeleteEvent([Delete Event])
        VerifyOwner([Verify Event Ownership])
        RSVP([RSVP to Event])
        UpdateRSVP([Update RSVP Status])
        CheckCap([Check Capacity\nBefore Going RSVP])
        CancelRSVP([Cancel RSVP])
    end

    %% ── Associations ─────────────────────────────────────────────
    User --> BrowseEvents
    User --> ViewEvent
    User --> RSVP
    User --> CancelRSVP
    Organizer --> CreateEvent
    Organizer --> EditEvent
    Organizer --> DeleteEvent

    %% ── Include / Extend ─────────────────────────────────────────
    BrowseEvents -.->|"&lt;&lt;extend&gt;&gt;"| FilterMonth
    ViewEvent -.->|"&lt;&lt;include&gt;&gt;"| BrowseEvents
    CreateEvent -.->|"&lt;&lt;include&gt;&gt;"| SetDateTime
    CreateEvent -.->|"&lt;&lt;include&gt;&gt;"| ValidateDate
    CreateEvent -.->|"&lt;&lt;extend&gt;&gt;"| SetCapacity
    EditEvent -.->|"&lt;&lt;include&gt;&gt;"| VerifyOwner
    EditEvent -.->|"&lt;&lt;include&gt;&gt;"| ValidateDate
    DeleteEvent -.->|"&lt;&lt;include&gt;&gt;"| VerifyOwner
    RSVP -.->|"&lt;&lt;include&gt;&gt;"| ViewEvent
    RSVP -.->|"&lt;&lt;extend&gt;&gt;"| CheckCap
    UpdateRSVP -.->|"&lt;&lt;extend&gt;&gt;"| RSVP
    CancelRSVP -.->|"&lt;&lt;extend&gt;&gt;"| RSVP
```

---

## UC-D8 — RESOURCE LIBRARY

> Covers uploading, browsing, searching, and deleting shared resource links within a realm.

```mermaid
graph LR
    %% ── Actors ───────────────────────────────────────────────────
    Guest((Guest\nRead Only))
    User((Registered\nUser))

    User ---|"generalizes"| Guest

    subgraph RES["Resource Library"]
        direction TB
        BrowseRes([Browse Resources])
        FilterType([Filter by Content Type])
        SearchRes([Search Resources])
        ViewRes([View Resource Details])
        UploadRes([Upload Resource])
        ValidateFields([Validate\nRequired Fields])
        SubmitMetadata([Submit Resource\nMetadata])
        DeleteRes([Delete Resource])
        VerifyOwner([Verify Resource\nOwnership])
    end

    %% ── Associations ─────────────────────────────────────────────
    Guest --> BrowseRes
    Guest --> SearchRes
    Guest --> ViewRes
    User --> UploadRes
    User --> DeleteRes

    %% ── Include / Extend ─────────────────────────────────────────
    BrowseRes -.->|"&lt;&lt;extend&gt;&gt;"| FilterType
    BrowseRes -.->|"&lt;&lt;extend&gt;&gt;"| SearchRes
    ViewRes -.->|"&lt;&lt;include&gt;&gt;"| BrowseRes
    UploadRes -.->|"&lt;&lt;include&gt;&gt;"| ValidateFields
    UploadRes -.->|"&lt;&lt;include&gt;&gt;"| SubmitMetadata
    DeleteRes -.->|"&lt;&lt;include&gt;&gt;"| VerifyOwner
```

---

## UC-D9 — FORUM

> Covers creating discussion threads, replying with posts, and deleting content within a realm forum.

```mermaid
graph LR
    %% ── Actors ───────────────────────────────────────────────────
    Guest((Guest\nRead Only))
    User((Registered\nUser))

    User ---|"generalizes"| Guest

    subgraph FORUM["Forum"]
        direction TB
        ViewList([View Thread List])
        ViewThread([View Thread & Posts])
        CreateThread([Create Thread])
        ValidateThread([Validate Thread\nContent])
        ReplyThread([Reply to Thread])
        ValidatePost([Validate Post\nContent])
        DeleteThread([Delete Thread])
        DeletePost([Delete Post])
        VerifyAuthor([Verify Authorship])
        CascadePosts([Cascade Delete Posts])
        UpdateActivity([Update Thread Activity])
    end

    %% ── Associations ─────────────────────────────────────────────
    Guest --> ViewList
    Guest --> ViewThread
    User --> CreateThread
    User --> ReplyThread
    User --> DeleteThread
    User --> DeletePost

    %% ── Include / Extend ─────────────────────────────────────────
    ViewThread -.->|"&lt;&lt;include&gt;&gt;"| ViewList
    CreateThread -.->|"&lt;&lt;include&gt;&gt;"| ValidateThread
    ReplyThread -.->|"&lt;&lt;include&gt;&gt;"| ViewThread
    ReplyThread -.->|"&lt;&lt;include&gt;&gt;"| ValidatePost
    ReplyThread -.->|"&lt;&lt;include&gt;&gt;"| UpdateActivity
    DeleteThread -.->|"&lt;&lt;include&gt;&gt;"| VerifyAuthor
    DeleteThread -.->|"&lt;&lt;include&gt;&gt;"| CascadePosts
    DeletePost -.->|"&lt;&lt;include&gt;&gt;"| VerifyAuthor
    DeletePost -.->|"&lt;&lt;include&gt;&gt;"| UpdateActivity
```

---

## UC-D10 — ADMIN CONSOLE

> Covers the administrator-exclusive panel for user management, realm oversight, content moderation, and analytics.

```mermaid
graph LR
    %% ── Actor ────────────────────────────────────────────────────
    Admin((Administrator))

    subgraph ADMIN["Admin Console"]
        direction TB
        AdminAuth([Authenticate as Admin])
        ViewDash([View Dashboard])
        ViewStats([View Platform Statistics])
        UserTrend([View User Growth Trend\n— 12 months])
        ResDist([View Resource Distribution])
        TopOwners([View Top Realm Owners])
        ForumAct([View Forum Activity\n— 30 days])
        ManageUsers([Manage Users])
        SearchUsers([Search Users])
        ChangeRole([Change User Role])
        DeleteUser([Delete User Account])
        CascadeUser([Cascade Delete\nUser Data])
        ManageRealms([Manage Realms])
        ViewRealms([View All Realms])
        ForceDelete([Force Delete Realm])
    end

    %% ── Associations ─────────────────────────────────────────────
    Admin --> ViewDash
    Admin --> ManageUsers
    Admin --> ManageRealms

    %% ── Include / Extend ─────────────────────────────────────────
    ViewDash -.->|"&lt;&lt;include&gt;&gt;"| AdminAuth
    ManageUsers -.->|"&lt;&lt;include&gt;&gt;"| AdminAuth
    ManageRealms -.->|"&lt;&lt;include&gt;&gt;"| AdminAuth
    ViewDash -.->|"&lt;&lt;include&gt;&gt;"| ViewStats
    ViewStats -.->|"&lt;&lt;include&gt;&gt;"| UserTrend
    ViewStats -.->|"&lt;&lt;include&gt;&gt;"| ResDist
    ViewStats -.->|"&lt;&lt;include&gt;&gt;"| TopOwners
    ViewStats -.->|"&lt;&lt;include&gt;&gt;"| ForumAct
    ManageUsers -.->|"&lt;&lt;extend&gt;&gt;"| SearchUsers
    ChangeRole -.->|"&lt;&lt;extend&gt;&gt;"| ManageUsers
    DeleteUser -.->|"&lt;&lt;extend&gt;&gt;"| ManageUsers
    DeleteUser -.->|"&lt;&lt;include&gt;&gt;"| CascadeUser
    ManageRealms -.->|"&lt;&lt;include&gt;&gt;"| ViewRealms
    ForceDelete -.->|"&lt;&lt;extend&gt;&gt;"| ManageRealms
```

---

## ACTOR GENERALIZATION HIERARCHY

> Shows the inheritance relationships between all system actors. Each child actor inherits all capabilities of the actor above it.

```mermaid
graph TD
    Guest((Guest))
    User((Registered\nUser))
    ROwner((Realm\nOwner))
    Admin((Administrator))

    User ---|"generalizes"| Guest
    ROwner ---|"generalizes"| User
    Admin ---|"generalizes"| User

    noteGuest["Can: browse landing page,\nregister, log in,\nread public forum & resources"]
    noteUser["Can: all Guest actions +\njoin realms, chat, call,\ncreate events, post in forum,\nupload resources"]
    noteOwner["Can: all User actions +\ncreate / edit / delete own realm,\nedit map, manage privacy"]
    noteAdmin["Can: all User actions +\naccess admin panel,\nmanage users and realms,\nview analytics dashboard"]

    Guest -.- noteGuest
    User -.- noteUser
    ROwner -.- noteOwner
    Admin -.- noteAdmin
```

---

## RELATIONSHIP TYPES REFERENCE

| Relationship   | Mermaid Syntax      | Meaning                                      |
| :------------- | :------------------ | :------------------------------------------- | --------- | --------------------------------------------- |
| Association    | `Actor --> UseCase` | Solid arrow — actor participates in use case |
| Include        | `Base -.->          | "&lt;&lt;include&gt;&gt;"                    | Included` | Base **always** calls the included use case   |
| Extend         | `Extending -.->     | "&lt;&lt;extend&gt;&gt;"                     | Base`     | Extending **optionally** augments the base    |
| Generalization | `Child ---          | "generalizes"                                | Parent`   | Child inherits parent's role and capabilities |

### Key Design Decisions

1. **`<<include>>` is used when** a sub-behaviour is _mandatory_ and reusable across multiple base use cases (e.g., every write operation includes `Verify Ownership`; every socket event includes `Validate JWT`).

2. **`<<extend>>` is used when** the extended behaviour is _conditional or optional_ (e.g., `Toggle Privacy Mode` only sometimes applies within `Edit Realm Settings`; `Filter by Month` is optional when browsing events).

3. **Generalization between actors** reflects the actual codebase role model: `role: "user"` vs `role: "admin"`, and the `owner_id` ownership check enforced in realm routes.
