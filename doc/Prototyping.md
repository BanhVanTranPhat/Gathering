# Prototyping
> Validating Design and System Feasibility for The Gathering Project

## 1. Purpose
**Prototyping** is the technique of building and reviewing scaled-down versions of a system before officially coding the entire implementation. For The Gathering, this technique is divided into two approaches serving two vital purposes:
1. **Low-Fidelity Prototype (Paper/Figma Wireframes):** Validating UX/UI to observe how users locate features like Chat and User Lists without occupying too much of the game viewport.
2. **Proof of Concept (PoC) Prototype (In-depth Tech Validation):** Crucial for verifying technical risks (Technology Risk Validation). Testing whether the architectural foundation (Tech Stack) is viable for solving the complex problems presented in the Tech Brief.

---

## 2. Practical Prototyping Process in The Gathering

### 2.1. UI Validation (Mockup/Wireframes)
To avoid out-of-control React coding and constant CSS refactoring:

* **Approach & Tool:** The team used **Figma** to sketch the structural layout of the UI.
* **Validation Feedback:** Initially, the team designed the member list and chat panel as a Fixed Block permanently pinned to the right of the screen. However, when the PixiJS game map was integrated, the map only retained 60% of the screen area, creating a claustrophobic gaming experience on a 14-inch laptop.
* **SRS Adjustment:** Derived new requirements **NFR-U1** and **NFR-U3**: The Chat Sidebar strictly "must be Collapsible/Expandable" as a Floating Drawer over the Game Canvas. The Video frame must also support "Draggable" functionality so users can actively adjust their line of sight.

---

### 2.2. Multimedia Load Capacity Validation (Proof of Concept - PoC)
This was a decisive Prototype experiment determining The Gathering's network architecture. During the Requirement phase, a problem emerged: a massive number of live Video streams would be forced into a single Room.

Problem: WebRTC architecture is typically P2P (Mesh Network).
* **Prototype Test #1 (WebRTC Mesh Option):** The team custom-wrote a Signaling Server (Node.js) merging 5 laptops with open webcams.
* **Prototype 1 Result (Failure):** As soon as the 5th user joined, each laptop had to Upload 4 outbound video streams and Download 4 incoming video streams ($N^2$ architecture). Desktop cooling fans roared, and the frame rate dropped below 5 FPS due to severe local bandwidth bottlenecks on Client Wi-Fi.

* **Prototype Test #2 (Cloud SFU Architecture):** The team discarded WebRTC Mesh and proceeded with a rapid integration of the Agora Cloud SDK module (Selective Forwarding Unit standard).
* **Prototype 2 Result (Success):** The Client machine only sends a single Upload Video stream to the Agora Cloud. The Agora Server (equipped with massive telecommunication bandwidth) splits and optimizes resolution to send 4 streams back to the other Clients.
* **Finalizing Document (SDLC):** Affirmed the correctness of stating in the formal SRS: *"The non-functional network requirement (NFR-SCA) mandates the system handle heavy-load network streaming via the Agora Cloud SFU rather than self-resolving P2P."*

---

### 2.3 Web Graphics Performance Validation (Render PoC)
* **Initial Intent:** Directly overlay `<video>` HTML tags onto the coordinates of the Game characters.
* **Running the Prototype:** Having multiple floating Video Overlay tags in an Absolute Position dragging jerkily across the character Camera forced the browser DOM to constantly Repaint the HTML page, causing severe Lag Spikes on weaker browsers.
* **Applying the New Prototype Solution:** Completely abandoned the DOM overlay approach. Pivoted to extracting the hidden Video image frames into a Pixel Array (Off-screen Frame Extraction) and forcing it into a `PIXI.Texture` deeply embedded in the WebGL Core layer. This thoroughly resolved the HTML Layout "Spike" illness.

## 3. Conclusion 
By executing the Prototyping methodology (Tech PoC testing), the team established a 100% logical and evidence-based foundation to defend the hardware technology choices and Framework library selections documented in the official software specification (Tech Stack Blueprint).
