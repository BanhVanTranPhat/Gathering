import { buildCompanyRealmFromTmj } from "@/utils/maps/buildCompanyRealmFromTmj";
import { buildSchoolRealmFromTmx } from "@/utils/maps/buildSchoolRealmFromTmx";
import type { AiMapManifestEntry } from "@/utils/maps/aiMapManifest";

type RealmMapData = Record<string, unknown>;

export async function parseManifestMap(entry: AiMapManifestEntry): Promise<RealmMapData | null> {
  if (entry.parser === "tmj-office") {
    return (await buildCompanyRealmFromTmj(entry)) as RealmMapData;
  }
  if (entry.parser === "tmx-campus") {
    return (await buildSchoolRealmFromTmx(entry)) as RealmMapData;
  }
  return null;
}
