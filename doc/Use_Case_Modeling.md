# Use Case Modeling
> Applied Functional Analysis for The Gathering Project

## 1. Purpose
The **Use Case Modeling** technique is utilized during the Requirements Engineering phase to:
- Identify the Actors interacting with The Gathering virtual space system.
- Define and scope the core functionalities (Use Cases) the system must provide for each user group.
- Establish the basic Flow of Events so Developers and Testers clearly understand software behavior.

## 2. Identifying Actors
For The Gathering, the system clearly divides operational permissions into 3 independent groups:

1. **User (Guest / Student / Employee):** General users who can register an account, join the system, control a 2D avatar, and communicate.
2. **Realm Owner (Host / Event Manager):** Room-level administrators. They have permission to configure the physical structure of the spatial map and schedule events (e.g., a Lecturer opening a thesis defense room).
3. **System Admin:** The overarching Super Admin who monitors network bandwidth, manages total accounts, and oversees all active rooms running on the server.

## 3. High-level Use Case Diagram

The diagram below illustrates the core interactions of the 3 Actor groups with The Gathering ecosystem:

```mermaid
flowchart TB
  %% Define Actors
  User((User))
  Owner((Realm Owner))
  SAdmin((System Admin))

  %% System Boundary
  subgraph TheGathering[The Gathering Ecosystem]
    UC1[Register & Login Auth]
    UC2[Customize Avatar & Profile]
    UC3[Navigate 2D Grid Map]
    UC4[Video/Audio Call (Proximity)]
    UC5[Channel & Bubble Chat]
    UC6[Manage Event Calendar]
    UC7[Update Resource Library]
    UC8[Use Map Editor]
    UC9[Monitor Server Metrics / Block User]
  end

  %% User Interactions
  User --> UC1
  User --> UC2
  User --> UC3
  User --> UC4
  User --> UC5

  %% Realm Owner Interactions (Extends User)
  Owner -.-|extend| User
  Owner --> UC6
  Owner --> UC7
  Owner --> UC8

  %% System Admin Interactions
  SAdmin -->|Access Dashboard Only| UC9
```

## 4. Core Use Case Specification

To effectively serve as an implementation document, a core project Use Case (e.g., Spatial Video Calling) is detailed with the following flow:

---

### Use Case: Trigger Proximity Video Call

* **Primary Actor:** User / Realm Owner
* **Brief Description:** The system automatically triggers the video/audio exchange feature using Agora SFU technology when two or more characters (Avatars) stand within a distance of less than 3 grid tiles on the screen.
* **Pre-conditions:**
  * At least 2 Users have successfully logged in.
  * Both are accessing the same 2D Realm map.
  * The browser has granted Microphone & Camera access permissions.
* **Main Flow of Events:**
  1. User A controls their character to move using arrow keys.
  2. The system (Backend Socket.IO) continuously calculates the Euclidean distance between User A and User B.
  3. Upon detecting the distance between two characters is < 3 tiles, the Backend emits a `proximityUpdate` Event to both Client streams.
  4. User A presses the `E` key (Call Request) to send a conversation invitation.
  5. User B receives a Video Invitation Pop-up and clicks "Accept".
  6. The Frontend Client connects to the Agora Cloud Server using a custom-defined room ID `proximityId`.
  7. Floating Video streams (Camera Bubbles) appear above both 2D characters.
* **Exceptions:**
  * (E1) User B clicks "Reject" -> The system sends a `callRejected` flag back to User A and cancels the Agora connection.
  * (E2) User A loses network connection mid-call -> The Socket Engine detects a Heartbeat Timeout and automatically kicks User A from the Agora Sub-channel.
* **Post-conditions:**
  * When Avatars move more than 3 blocks apart, the Video Stream automatically disconnects.
