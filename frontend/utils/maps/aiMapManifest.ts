export type AiMapManifestEntry = {
  id: string;
  label: string;
  engine: string;
  editor: string;
  parser?: "tmj-office" | "tmx-campus" | "realm-template";
  files: string[];
  tilesetsDir?: string;
  charactersDir?: string;
  defaultCharacterSprite?: string;
  sourceCharacterSprite?: string;
  spawnpoint?: { roomIndex: number; x: number; y: number };
  floors?: { label: string; roomIndex: number }[];
  elevator?: {
    cabinRoomIndex: number;
    cabinEntry: { x: number; y: number };
    defaultExit: { x: number; y: number };
  };
  roomTags?: Record<string, string>;
};

type AiMapManifest = {
  maps: AiMapManifestEntry[];
};

let manifestPromise: Promise<AiMapManifestEntry[]> | null = null;

export async function loadAiMapManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch("/assets/maps/index.json", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return [];
        const manifest = (await response.json()) as AiMapManifest;
        return Array.isArray(manifest.maps) ? manifest.maps : [];
      })
      .catch(() => []);
  }

  return manifestPromise;
}

export async function getAiMapManifestEntry(mapId: string) {
  const maps = await loadAiMapManifest();
  return maps.find((map) => map.id === mapId) || null;
}
