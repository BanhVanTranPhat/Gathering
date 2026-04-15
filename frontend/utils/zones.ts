export type ZoneType = "team" | "meeting" | "focus" | "github" | "common" | "forum" | "events" | "library";

export interface ZoneBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  bounds: ZoneBounds;
  color: string;
  icon: string;
  description: string;
  enterTile: { x: number; y: number };
  callEnabled?: boolean;
  roomIndex?: number; // Optional: specify which floor/room this zone belongs to
}

export interface DoorMarker {
  x: number;
  y: number;
  direction: "horizontal" | "vertical";
  connectsZones: [string, string];
}

export const OVERVIEW_ZOOM_THRESHOLD = 0.6;

export const collabCampusZones: Zone[] = [
  {
    id: "lobby",
    name: "Main Lobby",
    type: "common",
    bounds: { x1: 17, y1: 10, x2: 33, y2: 22 },
    color: "#6366f1",
    icon: "🏢",
    description: "Central gathering area & social hub",
    enterTile: { x: 24, y: 16 },
    callEnabled: true,
  },
  {
    id: "team-alpha",
    name: "Team Alpha",
    type: "team",
    bounds: { x1: 2, y1: 10, x2: 16, y2: 22 },
    color: "#3b82f6",
    icon: "👥",
    description: "Collaborative team workspace",
    enterTile: { x: 9, y: 16 },
    callEnabled: true,
  },
  {
    id: "team-beta",
    name: "Team Beta",
    type: "team",
    bounds: { x1: 34, y1: 10, x2: 47, y2: 22 },
    color: "#8b5cf6",
    icon: "👥",
    description: "Collaborative team workspace",
    enterTile: { x: 40, y: 16 },
    callEnabled: true,
  },
  {
    id: "meeting",
    name: "Meeting Room",
    type: "meeting",
    bounds: { x1: 2, y1: 24, x2: 17, y2: 37 },
    color: "#ec4899",
    icon: "📋",
    description: "Private meeting & conference room",
    enterTile: { x: 9, y: 30 },
    callEnabled: true,
  },
  {
    id: "courtyard",
    name: "Courtyard",
    type: "common",
    bounds: { x1: 18, y1: 24, x2: 33, y2: 37 },
    color: "#22c55e",
    icon: "🌿",
    description: "Outdoor garden & break area",
    enterTile: { x: 25, y: 30 },
  },
  {
    id: "focus",
    name: "Focus Room",
    type: "focus",
    bounds: { x1: 34, y1: 24, x2: 47, y2: 30 },
    color: "#f59e0b",
    icon: "🎧",
    description: "Deep work zone with ambient music",
    enterTile: { x: 40, y: 27 },
  },
  {
    id: "github",
    name: "GitHub Hub",
    type: "github",
    bounds: { x1: 34, y1: 31, x2: 47, y2: 37 },
    color: "#10b981",
    icon: "💻",
    description: "Code collaboration & GitHub activity",
    enterTile: { x: 40, y: 34 },
  },
  {
    id: "forum-board",
    name: "Discussion Board",
    type: "forum",
    bounds: { x1: 27, y1: 11, x2: 31, y2: 15 },
    color: "#fb923c",
    icon: "💬",
    description: "Campus forum and message board",
    enterTile: { x: 29, y: 13 },
  },
  {
    id: "events-board",
    name: "Events Box",
    type: "events",
    bounds: { x1: 19, y1: 11, x2: 23, y2: 15 },
    color: "#a78bfa",
    icon: "📅",
    description: "Upcoming events & calendar schedule",
    enterTile: { x: 21, y: 13 },
  },
  {
    id: "tech-library",
    name: "Tech Library",
    type: "library",
    bounds: { x1: 40, y1: 11, x2: 46, y2: 15 },
    color: "#f43f5e",
    icon: "📚",
    description: "Knowledge resources & books",
    enterTile: { x: 43, y: 13 },
  },
];

export const companyOfficeZones: Zone[] = [
  // Floor 0 (Lobby)
  {
    id: "company-events",
    name: "Notice Board",
    type: "events",
    bounds: { x1: 18, y1: 13, x2: 22, y2: 17 },
    color: "#a78bfa",
    icon: "📅",
    description: "Company news and events",
    enterTile: { x: 20, y: 15 },
    roomIndex: 0,
  },
  {
    id: "company-forum",
    name: "Announcements",
    type: "forum",
    bounds: { x1: 23, y1: 13, x2: 27, y2: 17 },
    color: "#fb923c",
    icon: "💬",
    description: "Important company announcements",
    enterTile: { x: 25, y: 15 },
    roomIndex: 0,
  },
  // Floor 1 (Engineering)
  {
    id: "eng-library",
    name: "Engineering Docs",
    type: "library",
    bounds: { x1: 4, y1: 4, x2: 10, y2: 8 },
    color: "#f43f5e",
    icon: "📚",
    description: "Technical documentation & guides",
    enterTile: { x: 7, y: 6 },
    roomIndex: 1,
  },
  // Floor 2 (Marketing)
  {
    id: "mkt-library",
    name: "Brand assets",
    type: "library",
    bounds: { x1: 4, y1: 4, x2: 10, y2: 8 },
    color: "#3b82f6",
    icon: "🎨",
    description: "Brand guidelines and marketing materials",
    enterTile: { x: 7, y: 6 },
    roomIndex: 2,
  },
];

export const collabCampusDoors: DoorMarker[] = [
  {
    x: 17,
    y: 16,
    direction: "vertical",
    connectsZones: ["team-alpha", "lobby"],
  },
  {
    x: 33,
    y: 16,
    direction: "vertical",
    connectsZones: ["lobby", "team-beta"],
  },
  {
    x: 9,
    y: 23,
    direction: "horizontal",
    connectsZones: ["team-alpha", "meeting"],
  },
  {
    x: 24,
    y: 23,
    direction: "horizontal",
    connectsZones: ["lobby", "courtyard"],
  },
  {
    x: 40,
    y: 23,
    direction: "horizontal",
    connectsZones: ["team-beta", "focus"],
  },
  {
    x: 17,
    y: 30,
    direction: "vertical",
    connectsZones: ["meeting", "courtyard"],
  },
  { x: 40, y: 30, direction: "horizontal", connectsZones: ["focus", "github"] },
];

export function getZoneAt(
  x: number,
  y: number,
  zones: Zone[],
  roomIndex?: number,
): Zone | null {
  for (const zone of zones) {
    // If zone specifies a room, player must be in that room
    if (
      roomIndex !== undefined &&
      zone.roomIndex !== undefined &&
      zone.roomIndex !== roomIndex
    ) {
      continue;
    }

    const b = zone.bounds;
    if (x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2) {
      return zone;
    }
  }
  return null;
}

// Backwards-compatible aliases for previously named office exports.
export const officeZones = collabCampusZones;
export const officeDoors = collabCampusDoors;

export function getZoneCenter(zone: Zone): { x: number; y: number } {
  return {
    x: Math.floor((zone.bounds.x1 + zone.bounds.x2) / 2),
    y: Math.floor((zone.bounds.y1 + zone.bounds.y2) / 2),
  };
}
