"use client";
import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { useModal } from "@/app/hooks/useModal";
import BasicButton from "../BasicButton";
import BasicInput from "../BasicInput";
import { createClient } from "@/utils/auth/client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import revalidate from "@/utils/revalidate";
import { removeExtraSpaces } from "@/utils/removeExtraSpaces";
import {
  AI_MAP_PREFIX,
  resolveAiMapTemplate,
} from "@/utils/maps/resolveAiMapTemplate";
import { loadAiMapManifest } from "@/utils/maps/aiMapManifest";

type MapTemplate = string;
const AI_MAP_COLORS = ["#06b6d4", "#22c55e", "#f59e0b", "#8b5cf6"];
const AI_MAP_ICONS = ["🧠", "🏫", "🏢", "🗺️"];
const BLANK_MAP = {
  spawnpoint: { roomIndex: 0, x: 2, y: 2 },
  rooms: [{ name: "Room 1", tilemap: {} }],
};

const MAP_TEMPLATES: {
  value: MapTemplate;
  label: string;
  description: string;
  color: string;
  icon: string;
  iconBgClass: string;
}[] = [
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
  const [template, setTemplate] = useState<MapTemplate>("aiMap:university");
  const [aiMapTemplates, setAiMapTemplates] = useState<
    {
      value: MapTemplate;
      label: string;
      description: string;
      color: string;
      icon: string;
      iconBgClass: string;
    }[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function loadManifestTemplates() {
      try {
        const maps = await loadAiMapManifest();
        if (!Array.isArray(maps)) return;

        const generatedTemplates = maps.slice(0, 4).map((map, index) => ({
          value: `${AI_MAP_PREFIX}${map.id}`,
          label: `AI Map: ${map.label}`,
          description: `From assets/maps (${map.files.length} file${map.files.length > 1 ? "s" : ""})`,
          color: AI_MAP_COLORS[index % AI_MAP_COLORS.length],
          icon: AI_MAP_ICONS[index % AI_MAP_ICONS.length],
          iconBgClass: "bg-cyan-500/20",
        }));

        if (!cancelled) {
          setAiMapTemplates(generatedTemplates);
        }
      } catch {
        // Keep legacy templates available even when map manifest is unavailable.
      }
    }

    loadManifestTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const allTemplates = useMemo(
    () => [...aiMapTemplates, ...MAP_TEMPLATES],
    [aiMapTemplates],
  );

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
    if (template.startsWith(AI_MAP_PREFIX)) {
      realmData.map_data = await resolveAiMapTemplate(template);
    } else if (template === "blank") {
      realmData.map_data = BLANK_MAP;
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
            {allTemplates.map((t) => (
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
