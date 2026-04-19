import collabCampusMap from "@/utils/collabcampusmap.json";
import defaultMap from "@/utils/defaultmap.json";
import { getAiMapManifestEntry } from "@/utils/maps/aiMapManifest";
import { buildRealmMapFromRegistry } from "@/utils/maps/registry/aiMapRegistry";

export const AI_MAP_PREFIX = "aiMap:";

type RealmMapData = Record<string, unknown>;

export function isAiMapTemplate(template: string) {
  return template.startsWith(AI_MAP_PREFIX);
}

export function getAiMapId(template: string) {
  return template.slice(AI_MAP_PREFIX.length);
}

export async function resolveAiMapTemplate(
  template: string,
): Promise<RealmMapData> {
  if (!isAiMapTemplate(template)) {
    return defaultMap as RealmMapData;
  }

  const mapId = getAiMapId(template);
  const mapEntry = await getAiMapManifestEntry(mapId);

  const built = await buildRealmMapFromRegistry(mapId, mapEntry);
  if (built) {
    return built;
  }

  if (mapEntry?.parser === "tmx-campus") {
    return collabCampusMap as RealmMapData;
  }
  return defaultMap as RealmMapData;
}
