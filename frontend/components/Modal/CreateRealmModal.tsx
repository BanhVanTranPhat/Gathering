"use client";
import React, { useState } from "react";
import Modal from "./Modal";
import { useModal } from "@/app/hooks/useModal";
import BasicButton from "../BasicButton";
import BasicInput from "../BasicInput";
import { createClient } from "@/utils/auth/client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import revalidate from "@/utils/revalidate";
import { removeExtraSpaces } from "@/utils/removeExtraSpaces";
import defaultMap from "@/utils/defaultmap.json";
import collabCampusMap from "@/utils/collabcampusmap.json";
import companyMap from "@/utils/companymap.json";
import starMapsMap from "@/utils/starmapsmap.json";
import workadventureStarterMap from "@/utils/workadventureStarterMap.json";
import { buildOfficeMapTemplate } from "@/utils/convertOfficeMapTemplate";

type MapTemplate =
  | "home"
  | "collabCampus"
  | "company"
  | "starMaps"
  | "workadventureStarter"
  | "theGathering03Office"
  | "blank";

const MAP_TEMPLATES: {
  value: MapTemplate;
  label: string;
  description: string;
  color: string;
  icon: string;
  iconBgClass: string;
}[] = [
  {
    value: "home",
    label: "Home",
    description: "Outdoor park with trees & paths",
    color: "#22c55e",
    icon: "🏡",
    iconBgClass: "bg-green-500/20",
  },
  {
    value: "collabCampus",
    label: "Collab Campus",
    description: "Collaborative campus with meeting hubs",
    color: "#3b82f6",
    icon: "🏢",
    iconBgClass: "bg-blue-500/20",
  },
  {
    value: "company",
    label: "Company (Multi-floor)",
    description: "Multi-floor building with elevator",
    color: "#f59e0b",
    icon: "🛗",
    iconBgClass: "bg-amber-500/20",
  },
  {
    value: "starMaps",
    label: "Star maps (3 rooms)",
    description: "Kashyyyk → Paris → Tatooine, walk-through portals (50×30)",
    color: "#10b981",
    icon: "🌿",
    iconBgClass: "bg-emerald-500/20",
  },
  {
    value: "workadventureStarter",
    label: "WA Starter (2 rooms)",
    description: "Office 31×21 & conference 24×14, portals (WorkAdventure kit layout)",
    color: "#0ea5e9",
    icon: "🗺️",
    iconBgClass: "bg-sky-500/20",
  },
  {
    value: "theGathering03Office",
    label: "The Gathering 03 Office",
    description: "Imported office layout from the-gathering-03 (single room)",
    color: "#14b8a6",
    icon: "📚",
    iconBgClass: "bg-teal-500/20",
  },
  {
    value: "blank",
    label: "Blank",
    description: "Empty map, build from zero",
    color: "#8b5cf6",
    icon: "📋",
    iconBgClass: "bg-violet-500/20",
  },
];

const CreateRealmModal: React.FC = () => {
  // FORCE RELOAD

  const { modal, setModal } = useModal();
  const [realmName, setRealmName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [template, setTemplate] = useState<MapTemplate>("collabCampus");

  const router = useRouter();

  async function createRealm() {
    const auth = createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();

    if (!user) {
      return;
    }

    const uid = user.id;

    setLoading(true);

    const realmData: any = {
      owner_id: uid,
      name: realmName,
      mapTemplate: template,
    };
    if (template === "home") {
      realmData.map_data = defaultMap;
    } else if (template === "collabCampus") {
      realmData.map_data = collabCampusMap;
    } else if (template === "company") {
      realmData.map_data = companyMap;
    } else if (template === "starMaps") {
      realmData.map_data = starMapsMap;
    } else if (template === "workadventureStarter") {
      realmData.map_data = workadventureStarterMap;
    } else if (template === "theGathering03Office") {
      realmData.map_data = buildOfficeMapTemplate();
    }

    const { data, error } = await auth
      .from("realms")
      .insert(realmData)
      .select();

    if (error) {
      toast.error(error?.message);
    }

    if (data) {
      setRealmName("");
      revalidate("/app");
      setModal("None");
      toast.success("Your space has been created!");
      router.push(`/editor/${data[0].id}`);
    }

    setLoading(false);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = removeExtraSpaces(e.target.value);
    setRealmName(value);
  }

  return (
    <Modal open={modal === "Create Realm"} closeOnOutsideClick>
      <div className="flex flex-col p-6 gap-5">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Create a Space</h1>
          <p className="text-sm text-gray-400 mt-1">
            Choose a template and give it a name
          </p>
        </div>

        <BasicInput
          label={"Space Name"}
          className="w-full"
          value={realmName}
          onChange={onChange}
          maxLength={32}
        />

        <div>
          <p className="text-sm text-gray-400 mb-2">Map Template</p>
          <div className="flex flex-col gap-2">
            {MAP_TEMPLATES.map((t) => (
              <label
                key={t.value}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all ${
                  template === t.value
                    ? "border-blue-500 bg-blue-500/10 shadow-sm shadow-blue-500/20"
                    : "border-gray-600/50 hover:border-gray-400 hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  name="mapTemplate"
                  value={t.value}
                  checked={template === t.value}
                  onChange={() => setTemplate(t.value)}
                  className="accent-blue-500 hidden"
                />
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${t.iconBgClass}`}
                >
                  {t.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    template === t.value ? "border-blue-500" : "border-gray-500"
                  }`}
                >
                  {template === t.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setModal("None")}
            className="flex-1 py-2.5 rounded-lg border border-gray-600 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <BasicButton
            disabled={realmName.length <= 0 || loading}
            onClick={createRealm}
            className="flex-1 !py-2.5 text-sm font-medium"
          >
            {loading ? "Creating..." : "Create Space"}
          </BasicButton>
        </div>
      </div>
    </Modal>
  );
};

export default CreateRealmModal;
