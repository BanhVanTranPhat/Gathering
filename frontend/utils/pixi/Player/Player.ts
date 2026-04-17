import * as PIXI from "pixi.js";
import playerSpriteSheetData from "./PlayerSpriteSheetData";
import { lpcPlayerSpriteSheetData } from "./LPCPlayerSpriteSheetData";
import { Point, Coordinate, AnimationState, Direction } from "../types";
import { PlayApp } from "../PlayApp";
import { bfs } from "../pathfinding";
import { server } from "../../backend/server";
import { defaultSkin, skins } from "./skins";
import signal from "@/utils/signal";
import { videoChat } from "@/utils/video-chat/video-chat";
import { collabCampusZones, getZoneAt } from "@/utils/zones";
import { composeAvatarSpriteSheetCanvas } from "@/utils/avatarComposer";
import { DEFAULT_AVATAR_CONFIG } from "@/utils/avatarAssets";
import { gsap } from "gsap";
function formatText(message: string, maxLength: number): string {
  message = message.trim();
  const words = message.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (word.length > maxLength) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
      for (let i = 0; i < word.length; i += maxLength) {
        lines.push(word.substring(i, i + maxLength));
      }
    } else if (currentLine.length + word.length + 1 > maxLength) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  const text = lines.join("\n");

  return text;
}

export class Player {
  public skin: string = defaultSkin;
  public username: string = "";
  public parent: PIXI.Container = new PIXI.Container();
  private textMessage: PIXI.Text = new PIXI.Text({});
  private emojiSprite: PIXI.Text | null = null;
  private textTimeout: NodeJS.Timeout | null = null;
  private emojiTimeout: NodeJS.Timeout | null = null;

  private animationState: AnimationState = "idle_down";
  private direction: Direction = "down";
  private animationSpeed: number = 0.1;
  private movementSpeed: number = 3.5;
  public currentTilePosition: Point = { x: 0, y: 0 };
  private isLocal: boolean = false;
  private playApp: PlayApp;
  private targetPosition: { x: number; y: number } | null = null;
  private path: Coordinate[] = [];
  private pathIndex: number = 0;
  private sheet: any = null;
  private movementMode: "keyboard" | "mouse" = "mouse";
  public frozen: boolean = false;
  private initialized: boolean = false;
  private strikes: number = 0;
  private avatarConfig?: Record<string, string>;

  private currentChannel: string = "local";
  private mediaContainer: PIXI.Container = new PIXI.Container();
  public micOn: boolean = false;
  public camOn: boolean = false;
  public status: "active" | "busy" | "away" = "active";

  private videoBubble: PIXI.Container | null = null;
  private videoSprite: PIXI.Sprite | null = null;
  private videoSource: any = null;
  private videoCanvas: HTMLCanvasElement | null = null;
  private videoUpdateTimer: ReturnType<typeof setInterval> | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private hasRemoteVideoTrack: boolean = false;
  private timerBubble: PIXI.Container | null = null;

  constructor(
    skin: string,
    playApp: PlayApp,
    username: string,
    isLocal: boolean = false,
    avatarConfig?: Record<string, string>,
  ) {
    this.skin = skin || defaultSkin;
    this.playApp = playApp;
    this.username = username;
    this.isLocal = isLocal;
    this.avatarConfig = avatarConfig;
  }

  private async loadAnimations() {
    let spriteSheetTexture: PIXI.Texture | null = null;
    let useLpc = false;

    const configToUse =
      this.avatarConfig && Object.keys(this.avatarConfig).length > 0
        ? this.avatarConfig
        : DEFAULT_AVATAR_CONFIG;

    const tryCompose = async (cfg: Record<string, string>) => {
      try {
        const canvas = await composeAvatarSpriteSheetCanvas({
          avatarConfig: cfg,
        });
        if (canvas) {
          spriteSheetTexture = PIXI.Texture.from(canvas);
          useLpc = true;
        }
      } catch (e) {
        console.warn("Failed to compose avatar spritesheet.", e);
      }
    };

    await tryCompose(configToUse);

    if (!spriteSheetTexture) {
      await tryCompose(DEFAULT_AVATAR_CONFIG);
    }

    if (!spriteSheetTexture) {
      // Fallback: simple placeholder texture so avatar is still visible
      spriteSheetTexture = PIXI.Texture.WHITE;
      useLpc = true;
    }

    const spriteSheetData = useLpc
      ? JSON.parse(JSON.stringify(lpcPlayerSpriteSheetData))
      : JSON.parse(JSON.stringify(playerSpriteSheetData));

    this.sheet = new PIXI.Spritesheet(spriteSheetTexture, spriteSheetData);
    await this.sheet.parse();

    const animatedSprite = new PIXI.AnimatedSprite(
      this.sheet.animations["idle_down"],
    );
    animatedSprite.animationSpeed = this.animationSpeed;
    animatedSprite.play();
    if (useLpc) {
      animatedSprite.scale.set(0.75);
    }

    if (!this.initialized) {
      this.parent.addChild(animatedSprite);
    }
  }

  public changeSkin = async (skin: string) => {
    if (!skins.includes(skin)) return;

    this.skin = skin;
    await this.loadAnimations();
    // refresh animations
    this.changeAnimationState(this.animationState, true);
  };

  private addUsername() {
    const text = new PIXI.Text({
      text: this.username,
      style: {
        fontFamily: "silkscreen",
        fontSize: 128,
        fill: 0xffffff,
      },
    });
    text.anchor.set(0.5);
    text.scale.set(0.07);
    text.y = 8;
    this.parent.addChild(text);
  }

  public setTimerStatus(active: boolean) {
    if (!active) {
      if (this.timerBubble) {
        this.parent.removeChild(this.timerBubble);
        this.timerBubble.destroy();
        this.timerBubble = null;
      }
      return;
    }

    if (this.timerBubble) return;

    const container = new PIXI.Container();
    container.y = -45;

    const bg = new PIXI.Graphics();
    bg.roundRect(-12, -6, 24, 12, 4);
    bg.fill(0xf59e0b);
    bg.stroke({ color: 0xffffff, width: 1 });
    container.addChild(bg);

    const icon = new PIXI.Text({
      text: "⏳",
      style: { fontSize: 100 },
    });
    icon.anchor.set(0.5);
    icon.scale.set(0.08);
    container.addChild(icon);

    this.parent.addChild(container);
    this.timerBubble = container;

    // Gentle bounce animation
    gsap.to(container, {
      y: -48,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  public setMessage(message: string) {
    if (this.textTimeout) {
      clearTimeout(this.textTimeout);
    }

    if (this.textMessage) {
      this.parent.removeChild(this.textMessage);
    }

    message = formatText(message, 40);

    const text = new PIXI.Text({
      text: message,
      style: {
        fontFamily: "silkscreen",
        fontSize: 128,
        fill: 0xffffff,
        align: "center",
      },
    });
    text.anchor.x = 0.5;
    text.anchor.y = 0;
    text.scale.set(0.07);
    text.y = -text.height - 42;
    this.parent.addChild(text);
    this.textMessage = text;

    signal.emit("newMessage", {
      content: message,
      username: this.username,
    });

    this.textTimeout = setTimeout(() => {
      if (this.textMessage) {
        this.parent.removeChild(this.textMessage);
      }
    }, 10000);
  }

  public setEmoji(emoji: string) {
    if (this.emojiTimeout) clearTimeout(this.emojiTimeout);
    if (this.emojiSprite) {
      this.parent.removeChild(this.emojiSprite);
      this.emojiSprite.destroy();
    }

    const text = new PIXI.Text({
      text: emoji,
      style: {
        fontSize: 128,
        align: "center",
      },
    });
    text.anchor.set(0.5);
    text.scale.set(0.2);
    text.y = -60;

    // Floating animation
    gsap.fromTo(
      text,
      { y: -50, alpha: 0 },
      { y: -80, alpha: 1, duration: 0.5, ease: "back.out(1.7)" },
    );

    this.parent.addChild(text);
    this.emojiSprite = text;

    this.emojiTimeout = setTimeout(() => {
      gsap.to(text, {
        alpha: 0,
        y: -100,
        duration: 0.5,
        onComplete: () => {
          if (this.emojiSprite === text) {
            this.parent.removeChild(text);
            text.destroy();
            this.emojiSprite = null;
          }
        },
      });
    }, 3000);
  }

  public async init() {
    if (this.initialized) return;
    await this.loadAnimations();
    this.addUsername();
    this.mediaContainer.y = -38;
    this.parent.addChild(this.mediaContainer);
    this.initialized = true;
  }

  public setMediaState(micOn: boolean, camOn: boolean) {
    this.micOn = micOn;
    this.camOn = camOn;
    this.mediaContainer.removeChildren();

    if (micOn && !camOn) {
      const g = new PIXI.Graphics();
      g.roundRect(-4, -4, 8, 8, 2);
      g.fill(0x22c55e);
      g.circle(0, -1, 2);
      g.fill(0xffffff);
      g.rect(-0.5, 1, 1, 2);
      g.fill(0xffffff);
      this.mediaContainer.addChild(g);
    }

    // Status dot
    const statusG = new PIXI.Graphics();
    const statusColor =
      this.status === "busy"
        ? 0xef4444
        : this.status === "away"
          ? 0xeab308
          : 0x22c55e;
    statusG.circle(6, 4, 3);
    statusG.fill(statusColor);
    statusG.stroke({ color: 0xffffff, width: 1 });
    this.mediaContainer.addChild(statusG);

    if (camOn && this.isLocal) {
      // Local camera bubble is created by PlayApp via showLocalCamera()
    } else if (!camOn && this.isLocal) {
      this.stopCamera();
    } else if (camOn && !this.isLocal) {
      if (!this.hasRemoteVideoTrack && !this.videoBubble) {
        this.showRemoteCamBubble();
      }
    } else if (!camOn && !this.isLocal) {
      this.hasRemoteVideoTrack = false;
      this.stopCamera();
    }
  }

  public setStatus(status: "active" | "busy" | "away") {
    this.status = status;
    this.setMediaState(this.micOn, this.camOn);
  }

  private static readonly BUBBLE_R = 18;
  private static readonly BUBBLE_Y = -56;

  private showRemoteCamBubble() {
    if (this.videoBubble) return;
    const R = Player.BUBBLE_R;
    const bubble = new PIXI.Container();
    bubble.y = Player.BUBBLE_Y;

    const border = new PIXI.Graphics();
    border.circle(0, 0, R + 1.5);
    border.fill(0x3b82f6);
    bubble.addChild(border);

    const bg = new PIXI.Graphics();
    bg.circle(0, 0, R);
    bg.fill(0x1e2035);
    bubble.addChild(bg);

    const initial = new PIXI.Text({
      text: this.username.charAt(0).toUpperCase(),
      style: { fontFamily: "silkscreen", fontSize: 128, fill: 0xffffff },
    });
    initial.anchor.set(0.5);
    initial.scale.set(0.12);
    initial.y = -2;
    bubble.addChild(initial);

    this.parent.addChild(bubble);
    this.videoBubble = bubble;
  }

  public showLocalCamera(mediaStreamTrack: MediaStreamTrack) {
    if (this.videoBubble) return;
    try {
      const stream = new MediaStream([mediaStreamTrack]);
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.width = 128;
      video.height = 128;
      video.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(video);
      video.play().catch(() => {});
      this.videoElement = video;

      this.buildVideoBubble(video, 0x6c72cb);
    } catch (e) {
      console.warn("showLocalCamera failed, falling back to getUserMedia:", e);
      this.startCamera();
    }
  }

  public setRemoteVideoFromTrack(track: any) {
    try {
      const mediaTrack: MediaStreamTrack = track.getMediaStreamTrack();
      if (!mediaTrack) return;
      const stream = new MediaStream([mediaTrack]);

      this.stopCamera();
      this.hasRemoteVideoTrack = true;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.width = 128;
      video.height = 128;
      video.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(video);
      video.play().catch(() => {});
      this.videoElement = video;

      this.buildVideoBubble(video, 0x3b82f6);
    } catch (e) {
      console.warn("Failed to set remote video track:", e);
    }
  }

  public clearRemoteVideo() {
    this.hasRemoteVideoTrack = false;
    this.stopCamera();
  }

  private async startCamera() {
    if (this.videoBubble) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 128, height: 128, facingMode: "user" },
        audio: false,
      });
      this.mediaStream = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.width = 128;
      video.height = 128;
      video.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(video);
      await video.play();
      this.videoElement = video;

      this.buildVideoBubble(video, 0x6c72cb);
    } catch (e) {
      console.warn("Failed to start camera:", e);
    }
  }

  private buildVideoBubble(video: HTMLVideoElement, borderColor: number) {
    const R = Player.BUBBLE_R;
    const bubble = new PIXI.Container();
    bubble.y = Player.BUBBLE_Y;

    const shadow = new PIXI.Graphics();
    shadow.circle(0, 2, R + 3);
    shadow.fill(0x000000);
    shadow.alpha = 0.35;
    bubble.addChild(shadow);

    const border = new PIXI.Graphics();
    border.circle(0, 0, R + 2);
    border.fill(borderColor);
    bubble.addChild(border);

    const maskGfx = new PIXI.Graphics();
    maskGfx.circle(0, 0, R);
    maskGfx.fill(0xffffff);
    bubble.addChild(maskGfx);

    const dim = R * 4;
    const canvas = document.createElement("canvas");
    canvas.width = dim;
    canvas.height = dim;
    const ctx = canvas.getContext("2d")!;
    this.videoCanvas = canvas;

    const source = PIXI.Texture.from(canvas).source;
    this.videoSource = source;
    const tex = new PIXI.Texture({ source });
    const sprite = new PIXI.Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.width = R * 2;
    sprite.height = R * 2;
    sprite.mask = maskGfx;
    sprite.y = 0;
    bubble.addChild(sprite);
    this.videoSprite = sprite;

    this.videoUpdateTimer = setInterval(() => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        const vw = video.videoWidth || video.width;
        const vh = video.videoHeight || video.height;
        if (vw && vh) {
          const srcSize = Math.min(vw, vh);
          const sx = (vw - srcSize) / 2;
          const sy = (vh - srcSize) / 2.2;
          ctx.clearRect(0, 0, dim, dim);
          ctx.drawImage(video, sx, sy, srcSize, srcSize, 0, 0, dim, dim);
        }
        source.update();
      }
    }, 1000 / 15);

    this.parent.addChild(bubble);
    this.videoBubble = bubble;
  }

  private stopCamera() {
    if (this.videoUpdateTimer) {
      clearInterval(this.videoUpdateTimer);
      this.videoUpdateTimer = null;
    }
    if (this.videoBubble) {
      this.parent.removeChild(this.videoBubble);
      this.videoBubble.destroy({ children: true });
      this.videoBubble = null;
      this.videoSprite = null;
    }
    if (this.videoSource) {
      this.videoSource.destroy();
      this.videoSource = null;
    }
    if (this.videoCanvas) {
      this.videoCanvas = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.remove();
      this.videoElement = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }

  public setPosition(x: number, y: number) {
    const pos = this.convertTilePosToPlayerPos(x, y);
    this.parent.x = pos.x;
    this.parent.y = pos.y;
    this.currentTilePosition = { x, y };
  }

  private convertTilePosToPlayerPos = (x: number, y: number) => {
    return {
      x: x * 32 + 16,
      y: y * 32 + 24,
    };
  };

  private convertPlayerPosToTilePos = (x: number, y: number) => {
    return {
      x: Math.floor(x / 32),
      y: Math.floor(y / 32),
    };
  };

  public moveToTile = (x: number, y: number) => {
    if (this.strikes > 25) return;

    if (this.isLocal) {
      signal.emit("playerSitting", false);
      signal.emit("leaveGroupCall");
    }

    const start: Coordinate = [
      this.currentTilePosition.x,
      this.currentTilePosition.y,
    ];
    const end: Coordinate = [x, y];

    const path: Coordinate[] | null = bfs(start, end, this.playApp.blocked);
    if (!path || path.length === 0) {
      if (!path && !this.isLocal) {
        this.strikes++;
      }
      return;
    }

    PIXI.Ticker.shared.remove(this.move);

    this.path = path;
    this.pathIndex = 0;
    this.targetPosition = this.convertTilePosToPlayerPos(
      this.path[this.pathIndex][0],
      this.path[this.pathIndex][1],
    );
    PIXI.Ticker.shared.add(this.move);

    if (this.isLocal) {
      server.socket.emit("movePlayer", { x, y });
    }
  };

  private move = ({ deltaTime }: { deltaTime: number }) => {
    if (!this.targetPosition) return;

    const currentPos = this.convertPlayerPosToTilePos(
      this.parent.x,
      this.parent.y,
    );
    this.checkIfShouldJoinChannel(currentPos);

    this.currentTilePosition = {
      x: this.path[this.pathIndex][0],
      y: this.path[this.pathIndex][1],
    };

    if (
      this.isLocal &&
      this.playApp.hasTeleport(
        this.currentTilePosition.x,
        this.currentTilePosition.y,
      ) &&
      this.movementMode === "keyboard"
    ) {
      this.setFrozen(true);
    }

    const speed = this.movementSpeed * deltaTime;

    const dx = this.targetPosition.x - this.parent.x;
    const dy = this.targetPosition.y - this.parent.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < speed) {
      this.parent.x = this.targetPosition.x;
      this.parent.y = this.targetPosition.y;

      this.pathIndex++;
      if (this.pathIndex < this.path.length) {
        this.targetPosition = this.convertTilePosToPlayerPos(
          this.path[this.pathIndex][0],
          this.path[this.pathIndex][1],
        );
      } else {
        const movementInput = this.getMovementInput();
        const newTilePosition = {
          x: this.currentTilePosition.x + movementInput.x,
          y: this.currentTilePosition.y + movementInput.y,
        };

        // Teleport
        const teleported = this.teleportIfOnTeleporter("keyboard");
        if (teleported) {
          this.stop();
          return;
        }

        if (
          (movementInput.x !== 0 || movementInput.y !== 0) &&
          !this.playApp.blocked.has(
            `${newTilePosition.x}, ${newTilePosition.y}`,
          )
        ) {
          this.moveToTile(newTilePosition.x, newTilePosition.y);
        } else {
          this.stop();

          // Teleport
          const teleported = this.teleportIfOnTeleporter("mouse");
          if (teleported) return;
        }
      }
    } else {
      const angle = Math.atan2(dy, dx);
      this.parent.x += Math.cos(angle) * speed;
      this.parent.y += Math.sin(angle) * speed;

      // set direction
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          this.direction = "right";
        } else {
          this.direction = "left";
        }
      } else {
        if (dy > 0) {
          this.direction = "down";
        } else {
          this.direction = "up";
        }
      }

      this.changeAnimationState(`walk_${this.direction}` as AnimationState);
    }

    this.playApp.sortObjectsByY();

    if (this.isLocal) {
      this.playApp.moveCameraToPlayer();
    }
  };

  public checkIfShouldJoinChannel = (newTilePosition: Point) => {
    if (!this.isLocal) return;

    const tile =
      this.playApp.realmData.rooms[this.playApp.currentRoomIndex].tilemap[
        `${newTilePosition.x}, ${newTilePosition.y}`
      ];
    if (tile && tile.privateAreaId) {
      if (tile.privateAreaId !== this.currentChannel) {
        this.currentChannel = tile.privateAreaId;
        videoChat.joinChannel(
          tile.privateAreaId,
          this.playApp.uid + this.username,
          this.playApp.realmId,
        );
        this.playApp.fadeInTiles(tile.privateAreaId);
      }
    } else {
      if (this.playApp.proximityId) {
        if (this.playApp.proximityId !== this.currentChannel) {
          this.currentChannel = this.playApp.proximityId;
          videoChat.joinChannel(
            this.playApp.proximityId,
            this.playApp.uid + this.username,
            this.playApp.realmId,
          );
          this.playApp.fadeOutTiles();
        }
      } else if (this.currentChannel !== "local") {
        this.currentChannel = "local";
        videoChat.leaveChannel();
        this.playApp.fadeOutTiles();
      }
    }
  };

  private stop = () => {
    PIXI.Ticker.shared.remove(this.move);
    this.targetPosition = null;

    if (this.isLocal) {
      const onSeat = this.playApp.hasSeatAtTile(
        this.currentTilePosition.x,
        this.currentTilePosition.y,
      );
      if (onSeat && this.sheet.animations?.["sit_down"]) {
        this.changeAnimationState("sit_down");
        signal.emit("playerSitting", true);
        const zone = getZoneAt(
          this.currentTilePosition.x,
          this.currentTilePosition.y,
          collabCampusZones,
        );
        if (zone?.callEnabled) {
          const clusterId = this.playApp.getSeatClusterId(
            this.currentTilePosition.x,
            this.currentTilePosition.y,
          );
          signal.emit("joinGroupCall", {
            zoneId: `${zone.id}-${clusterId}`,
            zoneName: zone.name,
            realmId: this.playApp.realmId,
          });
        }
      } else {
        this.changeAnimationState(`idle_${this.direction}` as AnimationState);
      }
    } else {
      // if player doesnt move for x secs, do idle animation
      setTimeout(() => {
        if (!this.targetPosition) {
          this.changeAnimationState(`idle_${this.direction}` as AnimationState);
        }
      }, 100);
    }
  };

  private teleportIfOnTeleporter = (movementMode: "keyboard" | "mouse") => {
    if (this.isLocal && this.movementMode === movementMode) {
      const teleported = this.playApp.teleportIfOnTeleportSquare(
        this.currentTilePosition.x,
        this.currentTilePosition.y,
      );
      return teleported;
    }
    return false;
  };

  public changeAnimationState = (
    state: AnimationState,
    force: boolean = false,
  ) => {
    if (this.animationState === state && !force) return;

    this.animationState = state;
    const animatedSprite = this.parent.children[0] as PIXI.AnimatedSprite;
    animatedSprite.textures = this.sheet.animations[state];
    animatedSprite.play();
  };

  public keydown = (event: KeyboardEvent) => {
    if (this.frozen) return;

    this.setMovementMode("keyboard");
    const movementInput = { x: 0, y: 0 };
    if (event.key === "ArrowUp" || event.key === "w") {
      movementInput.y -= 1;
    } else if (event.key === "ArrowDown" || event.key === "s") {
      movementInput.y += 1;
    } else if (event.key === "ArrowLeft" || event.key === "a") {
      movementInput.x -= 1;
    } else if (event.key === "ArrowRight" || event.key === "d") {
      movementInput.x += 1;
    }

    this.moveToTile(
      this.currentTilePosition.x + movementInput.x,
      this.currentTilePosition.y + movementInput.y,
    );
  };

  public isSitting = () => this.animationState === "sit_down";

  public standUp = () => {
    if (!this.isLocal) return;
    signal.emit("playerSitting", false);
    signal.emit("leaveGroupCall");
    this.changeAnimationState(`idle_${this.direction}` as AnimationState);
  };

  public setMovementMode = (mode: "keyboard" | "mouse") => {
    this.movementMode = mode;
  };

  private getMovementInput = () => {
    const movementInput = { x: 0, y: 0 };
    const latestKey = this.playApp.keysDown[this.playApp.keysDown.length - 1];
    if (latestKey === "ArrowUp" || latestKey === "w") {
      movementInput.y -= 1;
    } else if (latestKey === "ArrowDown" || latestKey === "s") {
      movementInput.y += 1;
    } else if (latestKey === "ArrowLeft" || latestKey === "a") {
      movementInput.x -= 1;
    } else if (latestKey === "ArrowRight" || latestKey === "d") {
      movementInput.x += 1;
    }

    return movementInput;
  };

  public setFrozen = (frozen: boolean) => {
    this.frozen = frozen;
  };

  public destroy() {
    PIXI.Ticker.shared.remove(this.move);
    this.stopCamera();
  }
}
