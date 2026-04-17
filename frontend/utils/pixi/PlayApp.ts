import { PUB } from "../assetPaths";
import { App } from "./App";
import { Player } from "./Player/Player";
import { Point, RealmData, SpriteMap, TilePoint } from "./types";
import * as PIXI from "pixi.js";
import { server } from "../backend/server";
import { defaultSkin } from "./Player/skins";
import signal from "../signal";
import { createClient } from "../auth/client";
import { gsap } from "gsap";
import { collabCampusZones, companyOfficeZones, getZoneAt } from "../zones";
import { videoChat } from "../video-chat/video-chat";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const OVERVIEW_THRESHOLD = 0.55;

export class PlayApp extends App {
  private scale: number = 1.5;
  public player: Player;
  public blocked: Set<TilePoint> = new Set();
  public keysDown: string[] = [];
  private teleportLocation: Point | null = null;
  private fadeOverlay: PIXI.Graphics = new PIXI.Graphics();
  private fadeDuration: number = 0.5;
  public uid: string = "";
  public realmId: string = "";
  public players: { [key: string]: Player } = {};
  private disableInput: boolean = false;

  private kicked: boolean = false;
  private syncPlayersRunId = 0;
  private hasLoggedSyncNotReady = false;

  private fadeTiles: SpriteMap = {};
  private fadeTileContainer: PIXI.Container = new PIXI.Container();
  private fadeAnimation: gsap.core.Tween | null = null;
  private currentPrivateAreaTiles: TilePoint[] = [];
  public proximityId: string | null = null;
  private avatarConfig?: Record<string, string>;

  public savedPosition: { x: number; y: number; room: number } | null = null;

  constructor(
    uid: string,
    realmId: string,
    realmData: RealmData,
    username: string,
    skin: string = defaultSkin,
    avatarConfig?: Record<string, string>,
  ) {
    super(realmData);
    this.uid = uid;
    this.realmId = realmId;
    this.avatarConfig = avatarConfig;
    this.player = new Player(skin, this, username, true, this.avatarConfig);
  }

  override async loadRoom(index: number) {
    this.players = {};
    await super.loadRoom(index);
    this.setUpBlockedTiles();
    this.setUpFadeTiles();
    this.spawnLocalPlayer();
    await this.syncOtherPlayers();
    this.displayInitialChatMessage();
  }

  private setUpFadeTiles = () => {
    this.fadeTiles = {};
    this.fadeTileContainer.removeChildren();

    for (const [key] of Object.entries(
      this.realmData.rooms[this.currentRoomIndex].tilemap,
    )) {
      const [x, y] = key.split(",").map(Number);
      const screenCoordinates = this.convertTileToScreenCoordinates(x, y);
      const tile: PIXI.Sprite = new PIXI.Sprite(
        PIXI.Assets.get(`${PUB.sprites}/faded-tile.png`),
      );
      tile.x = screenCoordinates.x;
      tile.y = screenCoordinates.y;
      this.fadeTileContainer.addChild(tile);
      this.fadeTiles[key as TilePoint] = tile;
    }
  };

  public fadeInTiles = (privateAreaId: string) => {
    // Stop any ongoing fade animation
    if (this.fadeAnimation) {
      this.fadeAnimation.kill();
    }

    this.currentPrivateAreaTiles = [];
    // get all tiles with privateAreaId
    const tiles = Object.entries(
      this.realmData.rooms[this.currentRoomIndex].tilemap,
    ).filter(([key, value]) => value.privateAreaId === privateAreaId);
    for (const [key] of tiles) {
      const tile = this.fadeTiles[key as TilePoint];
      tile.alpha = 0;
      this.currentPrivateAreaTiles.push(key as TilePoint);
    }

    this.fadeAnimation = gsap.to(this.fadeTileContainer, {
      alpha: 1,
      duration: 0.25,
      ease: "power2.out",
      onComplete: () => {
        this.fadeAnimation = null;
      },
    });
  };

  public fadeOutTiles = () => {
    // Stop any ongoing fade animation
    if (this.fadeAnimation) {
      this.fadeAnimation.kill();
    }

    this.fadeAnimation = gsap.to(this.fadeTileContainer, {
      alpha: 0,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        for (const key of this.currentPrivateAreaTiles) {
          const tile = this.fadeTiles[key];
          tile.alpha = 1;
        }
        this.fadeAnimation = null;
      },
    });
  };

  private async loadAssets() {
    await Promise.all([
      PIXI.Assets.load(`${PUB.fonts}/silkscreen.ttf`),
      PIXI.Assets.load(`${PUB.fonts}/nunito.ttf`),
      PIXI.Assets.load(`${PUB.sprites}/faded-tile.png`),
    ]);
  }

  private async syncOtherPlayers() {
    const runId = ++this.syncPlayersRunId;

    // Debounce rapid room transitions: only the latest sync call proceeds.
    await new Promise((resolve) => setTimeout(resolve, 120));
    if (runId !== this.syncPlayersRunId) return;

    let result = await server.getPlayersInRoom(this.currentRoomIndex);

    const initialStatus = (result.error as { status?: number } | null)?.status;
    const initialMessage = (result.error as { message?: string } | null)?.message;
    const shouldRetryOnce =
      !result.data &&
      (initialStatus === 401 ||
        initialStatus === 404 ||
        initialMessage === "No session provided");

    if (shouldRetryOnce) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (runId !== this.syncPlayersRunId) return;
      result = await server.getPlayersInRoom(this.currentRoomIndex);
    }

    const { data, error } = result;
    if (error || !data) {
      const status = (error as { status?: number } | null)?.status;
      const message = (error as { message?: string } | null)?.message;
      const expectedStartupError =
        status === 401 || status === 404 || message === "No session provided";

      if (expectedStartupError) {
        if (!this.hasLoggedSyncNotReady) {
          console.info(
            "Skipping initial player sync until session/room is ready.",
          );
          this.hasLoggedSyncNotReady = true;
        }
      } else {
        console.error("Failed to get player positions in room:", error);
      }
      return;
    }

    if (runId !== this.syncPlayersRunId) return;

    for (const player of data.players) {
      if (player.uid === this.uid) continue;
      this.updatePlayer(player.uid, player);
    }

    this.sortObjectsByY();
    this.emitPlayersInRoom();
  }

  private emitPlayersInRoom = () => {
    const online = [
      { uid: this.uid, username: this.player.username },
      ...Object.entries(this.players).map(([uid, p]) => ({
        uid,
        username: p.username,
      })),
    ];
    signal.emit("playersInRoom", { online });
  };

  private async updatePlayer(uid: string, player: any) {
    if (uid in this.players) {
      if (this.players[uid].skin !== player.skin) {
        await this.players[uid].changeSkin(player.skin);
      }
      if (
        this.players[uid].currentTilePosition.x !== player.x ||
        this.players[uid].currentTilePosition.y !== player.y
      ) {
        this.players[uid].setPosition(player.x, player.y);
      }
    } else {
      await this.spawnPlayer(
        player.uid,
        player.skin,
        player.username,
        player.x,
        player.y,
        player.avatarConfig,
      );
    }
  }

  private async spawnPlayer(
    uid: string,
    skin: string,
    username: string,
    x: number,
    y: number,
    avatarConfig?: Record<string, string> | null,
  ) {
    const otherPlayer = new Player(
      skin,
      this,
      username,
      false,
      avatarConfig || undefined,
    );
    await otherPlayer.init();
    otherPlayer.setPosition(x, y);
    this.layers.object.addChild(otherPlayer.parent);
    this.players[uid] = otherPlayer;
    this.sortObjectsByY();
    this.emitPlayersInRoom();
  }

  private zoneLabelsContainer: PIXI.Container = new PIXI.Container();

  private createZoneLabels = () => {
    this.zoneLabelsContainer.removeChildren();
    const zones = this.realmData.rooms[0].name === "Collab Campus" 
      ? collabCampusZones 
      : companyOfficeZones;

    for (const zone of zones) {
      // Only show labels for the current floor if roomIndex is specified
      if (zone.roomIndex !== undefined && zone.roomIndex !== this.currentRoomIndex) {
        continue;
      }

      const centerX = ((zone.bounds.x1 + zone.bounds.x2) / 2) * 32;
      const centerY = ((zone.bounds.y1 + zone.bounds.y2) / 2) * 32;

      const label = new PIXI.Text({
        text: `${zone.icon} ${zone.name}`,
        style: {
          fontFamily: "Nunito, sans-serif",
          fontSize: 14,
          fill: 0xffffff,
          align: "center",
          stroke: { color: 0x000000, width: 3 },
        },
      });
      label.anchor.set(0.5);
      label.position.set(centerX, centerY);
      this.zoneLabelsContainer.addChild(label);
    }
    this.zoneLabelsContainer.alpha = 0;
  };

  private updateZoneLabelsVisibility = () => {
    const targetAlpha =
      this.scale <= 1.0 ? Math.min(1, (1.0 - this.scale) / 0.4) : 0;
    this.zoneLabelsContainer.alpha = targetAlpha;
  };

  public async init() {
    await super.init();
    await this.loadAssets();
    const startRoom =
      this.savedPosition?.room ?? this.realmData.spawnpoint.roomIndex;
    await this.loadRoom(startRoom);
    this.app.stage.eventMode = "static";
    this.setScale(this.scale);
    this.app.renderer.on("resize", this.resizeEvent);
    this.fadeTileContainer.alpha = 0;
    this.app.stage.addChild(this.fadeTileContainer);
    this.createZoneLabels();
    this.app.stage.addChild(this.zoneLabelsContainer);
    this.clickEvents();
    this.setUpKeyboardEvents();
    this.setUpFadeOverlay();
    this.setUpSignalListeners();
    this.setUpSocketEvents();
    this.setUpWheelZoom();

    this.fadeOut();
  }

  private wheelZoomCanvas: HTMLCanvasElement | null = null;

  private wheelZoomHandler = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const pinchDelta = -e.deltaY * 0.01;
      this.zoomTo(this.scale + pinchDelta);
    } else {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      this.zoomTo(this.scale + delta);
    }
  };

  private setUpWheelZoom = () => {
    const canvas = this.app.canvas;
    if (canvas) {
      this.wheelZoomCanvas = canvas;
      canvas.addEventListener("wheel", this.wheelZoomHandler, {
        passive: false,
      });
    }
  };

  private removeWheelZoom = () => {
    if (this.wheelZoomCanvas) {
      this.wheelZoomCanvas.removeEventListener("wheel", this.wheelZoomHandler);
      this.wheelZoomCanvas = null;
    }
  };

  private spawnLocalPlayer = async () => {
    await this.player.init();

    if (this.teleportLocation) {
      this.player.setPosition(this.teleportLocation.x, this.teleportLocation.y);
    } else if (
      this.savedPosition &&
      this.savedPosition.room === this.currentRoomIndex
    ) {
      this.player.setPosition(this.savedPosition.x, this.savedPosition.y);
      this.savedPosition = null;
    } else {
      this.player.setPosition(
        this.realmData.spawnpoint.x,
        this.realmData.spawnpoint.y,
      );
    }
    this.layers.object.addChild(this.player.parent);
    this.moveCameraToPlayer();
  };

  private isOverview = false;

  private setScale = (newScale: number) => {
    this.scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
    this.app.stage.scale.set(this.scale);

    const wasOverview = this.isOverview;
    this.isOverview = this.scale <= OVERVIEW_THRESHOLD;

    this.updateZoneLabelsVisibility();

    if (this.isOverview !== wasOverview || this.isOverview) {
      const bounds = this.getCurrentRoomBounds();
      signal.emit("zoomChanged", {
        zoom: this.scale,
        isOverview: this.isOverview,
        ...bounds,
        playerX: this.player?.currentTilePosition?.x ?? 0,
        playerY: this.player?.currentTilePosition?.y ?? 0,
      });
    }
  };

  public zoomIn = () => {
    this.setScale(this.scale + ZOOM_STEP);
    this.moveCameraToPlayer();
  };

  public zoomOut = () => {
    this.setScale(this.scale - ZOOM_STEP);
    this.moveCameraToPlayer();
  };

  public zoomTo = (newScale: number) => {
    this.setScale(newScale);
    this.moveCameraToPlayer();
  };

  private zoomByDelta = (delta: number) => {
    this.zoomTo(this.scale + delta);
  };

  private lastMinimapEmit = 0;
  private readonly MINIMAP_EMIT_INTERVAL_MS = 150;

  private lastZoneId: string | null = null;

  public moveCameraToPlayer = () => {
    let x: number, y: number;

    if (this.isOverview) {
      const bounds = this.getCurrentRoomBounds();
      const mapCenterX = ((bounds.minX + bounds.maxX + 1) / 2) * 32;
      const mapCenterY = ((bounds.minY + bounds.maxY + 1) / 2) * 32;
      x = mapCenterX - this.app.screen.width / 2 / this.scale;
      y = mapCenterY - this.app.screen.height / 2 / this.scale;
    } else {
      x = this.player.parent.x - this.app.screen.width / 2 / this.scale;
      y = this.player.parent.y - this.app.screen.height / 2 / this.scale;
    }

    this.app.stage.pivot.set(x, y);
    this.updateFadeOverlay(x, y);
    const now = Date.now();
    if (now - this.lastMinimapEmit >= this.MINIMAP_EMIT_INTERVAL_MS) {
      this.lastMinimapEmit = now;
      const bounds = this.getCurrentRoomBounds();
      signal.emit("minimapPosition", {
        x: this.player.currentTilePosition.x,
        y: this.player.currentTilePosition.y,
        roomIndex: this.currentRoomIndex,
        roomName: this.realmData.rooms[this.currentRoomIndex]?.name ?? "",
        ...bounds,
      });

      const zones = this.realmData.rooms[0].name === "Collab Campus" 
        ? collabCampusZones 
        : companyOfficeZones;

      const currentZone = getZoneAt(
        this.player.currentTilePosition.x,
        this.player.currentTilePosition.y,
        zones,
        this.currentRoomIndex
      );
      const zoneId = currentZone?.id ?? null;
      if (zoneId !== this.lastZoneId) {
        this.lastZoneId = zoneId;
        signal.emit("playerZoneChanged", currentZone);
      }
    }
  };

  private getCurrentRoomBounds = (): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } => {
    const keys = Object.keys(
      this.realmData.rooms[this.currentRoomIndex].tilemap,
    );
    let minX = 0,
      maxX = 0,
      minY = 0,
      maxY = 0;
    if (keys.length > 0) {
      const coords = keys.map(
        (k) => k.split(",").map(Number) as [number, number],
      );
      minX = Math.min(...coords.map(([x]) => x));
      maxX = Math.max(...coords.map(([x]) => x));
      minY = Math.min(...coords.map(([, y]) => y));
      maxY = Math.max(...coords.map(([, y]) => y));
    }
    return { minX, maxX, minY, maxY };
  };

  private updateFadeOverlay = (x: number, y: number) => {
    this.fadeOverlay.clear();
    this.fadeOverlay.rect(
      0,
      0,
      this.app.screen.width * (1 / this.scale),
      this.app.screen.height * (1 / this.scale),
    );
    this.fadeOverlay.fill(0x0f0f0f);
    this.fadeOverlay.pivot.set(-x, -y);
  };

  private resizeEvent = () => {
    this.moveCameraToPlayer();
  };

  private setUpFadeOverlay = () => {
    this.fadeOverlay.rect(
      0,
      0,
      this.app.screen.width * (1 / this.scale),
      this.app.screen.height * (1 / this.scale),
    );
    this.fadeOverlay.fill(0x0f0f0f);
    this.app.stage.addChild(this.fadeOverlay);
  };

  private setUpBlockedTiles = () => {
    this.blocked = new Set<TilePoint>();

    for (const [key, value] of Object.entries(
      this.realmData.rooms[this.currentRoomIndex].tilemap,
    )) {
      if (value.impassable) {
        this.blocked.add(key as TilePoint);
      }
    }

    for (const [key, value] of Object.entries(this.collidersFromSpritesMap)) {
      if (value) {
        this.blocked.add(key as TilePoint);
      }
    }
  };

  private clickEvents = () => {
    this.app.stage.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
      if (this.player.frozen || this.disableInput) return;

      const clickPosition = e.getLocalPosition(this.app.stage);
      const { x, y } = this.convertScreenToTileCoordinates(
        clickPosition.x,
        clickPosition.y,
      );
      this.player.moveToTile(x, y);
      this.player.setMovementMode("mouse");
    });
  };

  private setUpKeyboardEvents = () => {
    document.addEventListener("keydown", this.keydown);
    document.addEventListener("keyup", this.keyup);
  };

  private keydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === "e") {
      if (this.disableInput || this.isTypingTarget(event.target)) return;
      this.handleInteractKey();
      return;
    }
    if (this.keysDown.includes(event.key) || this.disableInput) return;
    this.player.keydown(event);
    this.keysDown.push(event.key);
  };

  private keyup = (event: KeyboardEvent) => {
    this.keysDown = this.keysDown.filter((key) => key !== event.key);
  };

  private isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return (
      target.isContentEditable || tag === "input" || tag === "textarea" || tag === "select"
    );
  };

  private handleInteractKey = () => {
    if (this.player.frozen) return;

    if (this.player.isSitting()) {
      this.player.standUp();
      return;
    }

    const { x, y } = this.player.currentTilePosition;
    const neighbors: Array<{ x: number; y: number }> = [
      { x, y: y - 1 },
      { x: x + 1, y },
      { x, y: y + 1 },
      { x: x - 1, y },
    ];
    const seatTile = neighbors.find((tile) => this.hasSeatAtTile(tile.x, tile.y));
    if (seatTile) {
      this.player.moveToTile(seatTile.x, seatTile.y);
      this.player.setMovementMode("keyboard");
      return;
    }

    const zones =
      this.realmData.rooms[0].name === "Collab Campus"
        ? collabCampusZones
        : companyOfficeZones;
    const zone = getZoneAt(x, y, zones, this.currentRoomIndex);
    if (zone) {
      signal.emit("zoneInteract", zone);
    }
  };

  public teleportIfOnTeleportSquare = (x: number, y: number) => {
    const tile = `${x}, ${y}` as TilePoint;
    const tileData = this.realmData.rooms[this.currentRoomIndex].tilemap[tile];

    if (tileData?.elevator) {
      signal.emit("openElevatorMenu", {
        roomIndex: this.currentRoomIndex,
        x,
        y,
      });
      return true;
    }

    const teleport = tileData?.teleporter;
    if (teleport) {
      this.teleport(teleport.roomIndex, teleport.x, teleport.y);
      return true;
    }
    return false;
  };

  public executeElevatorTeleport = async (
    roomIndex: number,
    x: number,
    y: number,
  ) => {
    await this.teleport(roomIndex, x, y);
  };

  private teleport = async (roomIndex: number, x: number, y: number) => {
    this.player.setFrozen(true);
    await this.fadeIn();
    if (this.currentRoomIndex === roomIndex) {
      this.player.setPosition(x, y);
      this.moveCameraToPlayer();
    } else {
      this.teleportLocation = { x, y };
      this.currentRoomIndex = roomIndex;
      this.player.changeAnimationState("idle_down");
      await this.loadRoom(roomIndex);
    }

    server.socket.emit("teleport", { x, y, roomIndex });

    this.player.setFrozen(false);
    this.fadeOut();
  };

  public hasTeleport = (x: number, y: number) => {
    const tile = `${x}, ${y}` as TilePoint;
    return this.realmData.rooms[this.currentRoomIndex].tilemap[tile]
      ?.teleporter;
  };

  /** Kiểm tra tile có phải ghế/bench/stool không (để hiệu ứng ngồi) */
  public hasSeatAtTile = (x: number, y: number) => {
    const tile = `${x}, ${y}` as TilePoint;
    const tileData = this.realmData.rooms[this.currentRoomIndex].tilemap[tile];
    if (!tileData) return false;
    const above = (tileData.above_floor || "").toLowerCase();
    const obj = (tileData.object || "").toLowerCase();
    const combined = above + " " + obj;
    return (
      combined.includes("chair") ||
      combined.includes("bench") ||
      combined.includes("stool")
    );
  };

  public getSeatClusterId = (startX: number, startY: number): string => {
    const CLUSTER_RANGE = 3;
    const visited = new Set<string>();
    const queue: [number, number][] = [[startX, startY]];
    visited.add(`${startX},${startY}`);
    let minX = startX,
      minY = startY;

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      if (cx < minX || (cx === minX && cy < minY)) {
        minX = cx;
        minY = cy;
      }

      for (let dx = -CLUSTER_RANGE; dx <= CLUSTER_RANGE; dx++) {
        for (let dy = -CLUSTER_RANGE; dy <= CLUSTER_RANGE; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx,
            ny = cy + dy;
          const key = `${nx},${ny}`;
          if (visited.has(key)) continue;
          if (this.hasSeatAtTile(nx, ny)) {
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
      }
    }

    return `cluster-${minX}-${minY}`;
  };

  private fadeIn = () => {
    PIXI.Ticker.shared.remove(this.fadeOutTicker);
    this.fadeOverlay.alpha = 0;
    return new Promise<void>((resolve) => {
      const fadeTicker = ({ deltaTime }: { deltaTime: number }) => {
        this.fadeOverlay.alpha += deltaTime / 60 / this.fadeDuration;
        if (this.fadeOverlay.alpha >= 1) {
          this.fadeOverlay.alpha = 1;
          PIXI.Ticker.shared.remove(fadeTicker);
          resolve();
        }
      };

      PIXI.Ticker.shared.add(fadeTicker);
    });
  };

  private fadeOut = () => {
    PIXI.Ticker.shared.add(this.fadeOutTicker);
  };

  private fadeOutTicker = ({ deltaTime }: { deltaTime: number }) => {
    this.fadeOverlay.alpha -= deltaTime / 60 / this.fadeDuration;
    if (this.fadeOverlay.alpha <= 0) {
      this.fadeOverlay.alpha = 0;
      PIXI.Ticker.shared.remove(this.fadeOutTicker);
    }
  };

  private destroyPlayers = () => {
    for (const player of Object.values(this.players)) {
      player.destroy();
    }
    this.player.destroy();
  };

  private onPlayerLeftRoom = (uid: string) => {
    if (this.players[uid]) {
      this.players[uid].destroy();
      this.layers.object.removeChild(this.players[uid].parent);
      delete this.players[uid];
      this.emitPlayersInRoom();
    }
  };

  private onPlayerJoinedRoom = (playerData: any) => {
    this.updatePlayer(playerData.uid, playerData).then(() =>
      this.emitPlayersInRoom(),
    );
  };

  private onPlayerMoved = (data: any) => {
    if (this.blocked.has(`${data.x}, ${data.y}`)) return;

    const player = this.players[data.uid];
    if (player) {
      player.moveToTile(data.x, data.y);
    }
  };

  private onPlayerTeleported = (data: any) => {
    const player = this.players[data.uid];
    if (player) {
      player.setPosition(data.x, data.y);
    }
  };

  private onPlayerChangedSkin = (data: any) => {
    const player = this.players[data.uid];
    if (player) {
      player.changeSkin(data.skin);
    }
    signal.emit("video-skin", {
      skin: data.skin,
      uid: data.uid,
    });
  };

  private navigateToTile = (data: { x: number; y: number }) => {
    this.setScale(1.5);
    this.player.moveToTile(data.x, data.y);
    this.player.setMovementMode("mouse");
    this.moveCameraToPlayer();
  };

  private localMicOn = false;
  private localCamOn = false;

  private onLocalMediaState = async (data: {
    micOn: boolean;
    camOn: boolean;
  }) => {
    server.socket.emit("mediaState", data);

    if (data.camOn !== this.localCamOn) {
      this.localCamOn = data.camOn;
      try {
        const mediaStreamTrack = await videoChat.toggleCamera();
        if (mediaStreamTrack && data.camOn) {
          this.player.showLocalCamera(mediaStreamTrack);
        }
      } catch (e) {
        console.warn("Failed to toggle Agora camera:", e);
      }
    }
    if (data.micOn !== this.localMicOn) {
      this.localMicOn = data.micOn;
      try {
        await videoChat.toggleMicrophone();
      } catch (e) {
        console.warn("Failed to toggle Agora mic:", e);
      }
    }

    this.player.setMediaState(data.micOn, data.camOn);
  };

  private onRemoteMediaState = (data: {
    uid: string;
    micOn: boolean;
    camOn: boolean;
  }) => {
    const player = this.players[data.uid];
    if (player) {
      player.setMediaState(data.micOn, data.camOn);
    }
  };

  private onViewModeChanged = (mode: string) => {
    if (mode === "simplified") {
      this.zoomTo(1.0);
      this.layers.above_floor.alpha = 0.3;
    } else if (mode === "immersive") {
      this.zoomTo(1.5);
      this.layers.above_floor.alpha = 1;
    } else {
      this.layers.above_floor.alpha = 1;
      this.zoomTo(1.5);
    }
  };

  private onSendEmoji = (emoji: string) => {
    this.player.setEmoji(emoji);
    server.socket.emit("sendMessage", emoji);
  };

  private onLocalStatusChanged = (status: any) => {
    this.player.setStatus(status);
    server.socket.emit("statusUpdate", { status });
  };

  private onFocusTimerActive = (active: boolean) => {
    this.player.setTimerStatus(active);
    server.socket.emit("timerStatusUpdate", { active });
  };

  private findPlayerByAgoraUid = (agoraUid: string): Player | null => {
    for (const [uid, player] of Object.entries(this.players)) {
      if (agoraUid === uid + player.username || agoraUid.startsWith(uid)) {
        return player;
      }
    }
    return null;
  };

  private onRemoteVideoPublished = (data: { agoraUid: string; track: any }) => {
    const player = this.findPlayerByAgoraUid(data.agoraUid);
    if (player) {
      player.setRemoteVideoFromTrack(data.track);
    }
  };

  private onRemoteVideoUnpublished = (data: { agoraUid: string }) => {
    const player = this.findPlayerByAgoraUid(data.agoraUid);
    if (player) {
      player.clearRemoteVideo();
    }
  };

  private setUpSignalListeners = () => {
    signal.on("requestSkin", this.onRequestSkin);
    signal.on("switchSkin", this.onSwitchSkin);
    signal.on("disableInput", this.onDisableInput);
    signal.on("message", this.onMessage);
    signal.on("getSkinForUid", this.getSkinForUid);
    signal.on("mapZoomIn", this.zoomIn);
    signal.on("mapZoomOut", this.zoomOut);
    signal.on("mapZoomDelta", this.zoomByDelta);
    signal.on("navigateToTile", this.navigateToTile);
    signal.on("localMediaState", this.onLocalMediaState);
    signal.on("viewModeChanged", this.onViewModeChanged);
    signal.on("sendEmoji", this.onSendEmoji);
    signal.on("localStatusChanged", this.onLocalStatusChanged);
    signal.on("focusTimerActive", this.onFocusTimerActive);
    signal.on("remoteVideoPublished", this.onRemoteVideoPublished);
    signal.on("remoteVideoUnpublished", this.onRemoteVideoUnpublished);
    signal.on("triggerElevatorTeleport", this.onTriggerElevatorTeleport);
  };

  private removeSignalListeners = () => {
    signal.off("requestSkin", this.onRequestSkin);
    signal.off("switchSkin", this.onSwitchSkin);
    signal.off("disableInput", this.onDisableInput);
    signal.off("message", this.onMessage);
    signal.off("getSkinForUid", this.getSkinForUid);
    signal.off("mapZoomIn", this.zoomIn);
    signal.off("mapZoomOut", this.zoomOut);
    signal.off("mapZoomDelta", this.zoomByDelta);
    signal.off("navigateToTile", this.navigateToTile);
    signal.off("localMediaState", this.onLocalMediaState);
    signal.off("viewModeChanged", this.onViewModeChanged);
    signal.off("sendEmoji", this.onSendEmoji);
    signal.off("localStatusChanged", this.onLocalStatusChanged);
    signal.off("focusTimerActive", this.onFocusTimerActive);
    signal.off("remoteVideoPublished", this.onRemoteVideoPublished);
    signal.off("remoteVideoUnpublished", this.onRemoteVideoUnpublished);
    signal.off("triggerElevatorTeleport", this.onTriggerElevatorTeleport);
  };

  private onTriggerElevatorTeleport = async (data: {
    roomIndex: number;
    x: number;
    y: number;
  }) => {
    await this.executeElevatorTeleport(data.roomIndex, data.x, data.y);
  };

  private onRequestSkin = () => {
    signal.emit("skin", this.player.skin);
  };

  private onSwitchSkin = (skin: string) => {
    this.player.changeSkin(skin);
    server.socket.emit("changedSkin", skin);
  };

  private getSkinForUid = (uid: string) => {
    const player = this.players[uid];
    if (!player) return;

    signal.emit("video-skin", {
      skin: player.skin,
      uid: uid,
    });
  };

  private onDisableInput = (disable: boolean) => {
    this.disableInput = disable;
    this.keysDown = [];
  };

  private onKicked = (message: string) => {
    this.kicked = true;
    this.removeEvents();
    signal.emit("showKickedModal", message);
  };

  private onDisconnect = () => {
    this.removeEvents();
    if (!this.kicked) {
      signal.emit("showDisconnectModal");
    }
  };

  private onMessage = (message: string) => {
    this.player.setMessage(message);
    server.socket.emit("sendMessage", message);
  };

  private onReceiveMessage = (data: any) => {
    const player = this.players[data.uid];
    if (player) {
      const isSingleEmoji =
        /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(
          data.message.trim(),
        ) && data.message.trim().length <= 4;
      if (isSingleEmoji) {
        player.setEmoji(data.message);
      } else {
        player.setMessage(data.message);
      }
    }
  };

  private onRemoteStatusUpdate = (data: { uid: string; status: any }) => {
    const player = this.players[data.uid];
    if (player) {
      player.setStatus(data.status);
    }
  };

  private onRemoteTimerStatusUpdate = (data: {
    uid: string;
    active: boolean;
  }) => {
    const player = this.players[data.uid];
    if (player) {
      player.setTimerStatus(data.active);
    }
  };

  private displayInitialChatMessage = async () => {
    const auth = createClient();
    const {
      data: { session },
    } = await auth.auth.getSession();
    if (!session) return;
    let channelName = "";

    signal.emit("newRoomChat", {
      name: this.realmData.rooms[this.currentRoomIndex].name,
      channelId: channelName,
    });
  };

  private onProximityUpdate = (data: any) => {
    const prevId = this.proximityId;
    this.proximityId = data.proximityId;
    if (this.proximityId) {
      this.player.checkIfShouldJoinChannel(this.player.currentTilePosition);
    }
    if (this.proximityId && this.proximityId !== prevId) {
      signal.emit("proximityDetected", { proximityId: this.proximityId });
    } else if (!this.proximityId && prevId) {
      signal.emit("proximityLost", {});
    }
  };

  private setUpSocketEvents = () => {
    server.socket.on("playerLeftRoom", this.onPlayerLeftRoom);
    server.socket.on("playerJoinedRoom", this.onPlayerJoinedRoom);
    server.socket.on("playerMoved", this.onPlayerMoved);
    server.socket.on("playerTeleported", this.onPlayerTeleported);
    server.socket.on("playerChangedSkin", this.onPlayerChangedSkin);
    server.socket.on("receiveMessage", this.onReceiveMessage);
    server.socket.on("disconnect", this.onDisconnect);
    server.socket.on("kicked", this.onKicked);
    server.socket.on("proximityUpdate", this.onProximityUpdate);
    server.socket.on("remoteMediaState", this.onRemoteMediaState);
    server.socket.on("callRequest", this.onCallRequest);
    server.socket.on("callAccepted", this.onCallAccepted);
    server.socket.on("callRejected", this.onCallRejected);
    server.socket.on("remoteStatusUpdate", this.onRemoteStatusUpdate);
    server.socket.on("remoteTimerStatusUpdate", this.onRemoteTimerStatusUpdate);
  };

  private removeSocketEvents = () => {
    server.socket.off("playerLeftRoom", this.onPlayerLeftRoom);
    server.socket.off("playerJoinedRoom", this.onPlayerJoinedRoom);
    server.socket.off("playerMoved", this.onPlayerMoved);
    server.socket.off("playerTeleported", this.onPlayerTeleported);
    server.socket.off("playerChangedSkin", this.onPlayerChangedSkin);
    server.socket.off("receiveMessage", this.onReceiveMessage);
    server.socket.off("disconnect", this.onDisconnect);
    server.socket.off("kicked", this.onKicked);
    server.socket.off("proximityUpdate", this.onProximityUpdate);
    server.socket.off("remoteMediaState", this.onRemoteMediaState);
    server.socket.off("callRequest", this.onCallRequest);
    server.socket.off("callAccepted", this.onCallAccepted);
    server.socket.off("callRejected", this.onCallRejected);
  };

  private onCallRequest = (data: {
    fromUid: string;
    fromUsername: string;
    proximityId: string;
  }) => {
    signal.emit("incomingCall", data);
  };

  private onCallAccepted = (data: { proximityId: string; byUid: string }) => {
    signal.emit("callAccepted", data);
  };

  private onCallRejected = (data: { byUid: string }) => {
    signal.emit("callRejected", data);
  };

  private removeEvents = () => {
    this.removeWheelZoom();
    this.removeSocketEvents();
    this.destroyPlayers();
    server.disconnect();

    PIXI.Ticker.shared.destroy();

    this.removeSignalListeners();
    document.removeEventListener("keydown", this.keydown);
    document.removeEventListener("keyup", this.keyup);
  };

  public destroy() {
    this.removeEvents();
    super.destroy();
  }
}
