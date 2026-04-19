import type { AiMapManifestEntry } from "@/utils/maps/aiMapManifest";
import { designedMapBuilders } from "@/utils/maps/builders";
import { parseManifestMap } from "@/utils/maps/parsers";

type RealmMapData = Record<string, unknown>;

export async function buildRealmMapFromRegistry(
  mapId: string,
  entry: AiMapManifestEntry | null | undefined,
): Promise<RealmMapData | null> {
  const directBuilder = designedMapBuilders[mapId];
  if (directBuilder) {
    return directBuilder();
  }

  if (!entry) {
    return null;
  }

  try {
    return await parseManifestMap(entry);
  } catch {
    return null;
  }
}
