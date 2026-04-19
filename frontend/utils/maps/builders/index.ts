import { buildDesignedOffice2FloorRealm, buildDesignedUniversityRealm } from "@/utils/maps/buildDesignedRealms";

type RealmMapData = Record<string, unknown>;

export const designedMapBuilders: Record<string, () => RealmMapData> = {
  office: () => buildDesignedOffice2FloorRealm() as unknown as RealmMapData,
  university: () => buildDesignedUniversityRealm() as unknown as RealmMapData,
};
