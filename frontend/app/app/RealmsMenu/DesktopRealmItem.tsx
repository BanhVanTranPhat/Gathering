import {
  DotsThreeVertical,
  Link as LinkIcon,
  PencilSimple,
  SignIn,
} from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/hooks/useModal";
import Link from "next/link";
import { toast } from "react-toastify";
import Image from "next/image";
import { PUB } from "@/utils/assetPaths";

type DesktopRealmItemProps = {
  name: string;
  id: string;
  shareId: string;
  shared?: boolean;
  playerCount?: number;
  mapTemplate?: string;
  imagePriority?: boolean;
};

const TEMPLATE_STYLES: Record<string, { bg: string; icon: string }> = {
  home: { bg: "from-emerald-100 to-green-200", icon: "🏡" },
  collabCampus: { bg: "from-blue-100 to-indigo-200", icon: "🏢" },
  company: { bg: "from-amber-100 to-yellow-200", icon: "🛗" },
  starMaps: { bg: "from-teal-100 to-emerald-200", icon: "🌿" },
  workadventureStarter: { bg: "from-sky-100 to-cyan-200", icon: "🗺️" },
  blank: { bg: "from-violet-100 to-purple-200", icon: "📋" },
};

const TEMPLATE_IMAGES: Record<string, string | null> = {
  home: `${PUB.ui}/home_background.png`,
  collabCampus: `${PUB.ui}/office_background.png`,
  company: null,
  starMaps: null,
  workadventureStarter: null,
  blank: null,
};

const DesktopRealmItem: React.FC<DesktopRealmItemProps> = ({
  name,
  id,
  shareId,
  shared,
  playerCount,
  mapTemplate,
  imagePriority = false,
}) => {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const { setRealmToDelete, setModal } = useModal();

  let templateKey = mapTemplate === "office" ? "collabCampus" : mapTemplate;
  if (!templateKey) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("home")) {
      templateKey = "home";
    } else if (
      lowerName.includes("collab") ||
      lowerName.includes("campus") ||
      lowerName.includes("office")
    ) {
      templateKey = "collabCampus";
    } else if (lowerName.includes("company")) {
      templateKey = "company";
    } else {
      templateKey = "collabCampus";
    }
  }
  const tmpl = TEMPLATE_STYLES[templateKey] || TEMPLATE_STYLES.collabCampus;
  const templateImage = TEMPLATE_IMAGES[templateKey] ?? null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        dotsRef.current &&
        !dotsRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getLink() {
    return shared ? `/play/${id}?shareId=${shareId}` : `/play/${id}`;
  }

  function copyShareLink() {
    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_BASE_URL}/play/${id}?shareId=${shareId}`,
    );
    toast.success("Link copied!");
  }

  return (
    <div className="relative select-none group/card">
      <Link href={getLink()}>
        <div className="w-full aspect-[16/9] relative rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer">
          {/* Background image or gradient fallback */}
          {templateImage ? (
            <>
              <Image
                src={templateImage}
                alt={`${templateKey} background`}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                priority={imagePriority}
              />
              {/* Subtle dark overlay for text/overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20" />
            </>
          ) : (
            <>
              <div
                className={`absolute inset-0 bg-gradient-to-br ${tmpl.bg}`}
              />
              <div className="absolute inset-0 opacity-[0.15] realm-template-grid" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl opacity-30 group-hover/card:opacity-50 group-hover/card:scale-110 transform transition-all duration-300">
                  {tmpl.icon}
                </span>
              </div>
            </>
          )}

          {/* Player count */}
          {playerCount != null && (
            <div className="absolute top-2.5 left-2.5 rounded-full px-2 py-0.5 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm shadow-sm z-10">
              <div className="bg-green-500 w-2 h-2 rounded-full" />
              <p className="text-xs font-medium text-gray-700">{playerCount}</p>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md">
              <SignIn className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        </div>
      </Link>

      {/* Bottom info */}
      <div className="mt-2 flex items-center justify-between px-0.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        </div>
        {!shared && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => router.push(`/editor/${id}`)}
              className="h-7 px-2 rounded-md flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Edit map"
              aria-label="Edit map"
            >
              <PencilSimple className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={copyShareLink}
              className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Copy link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <div ref={dotsRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Open realm actions"
                aria-label="Open realm actions"
              >
                <DotsThreeVertical weight="bold" className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          className="absolute w-40 rounded-xl bg-white border border-gray-200 right-0 top-full mt-1 flex flex-col z-20 shadow-xl overflow-hidden"
          ref={menuRef}
        >
          <button
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => router.push(`/editor/${id}`)}
          >
            Edit Map
          </button>
          <button
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => router.push(`/manage/${id}`)}
          >
            Manage
          </button>
          <div className="mx-3 h-px bg-gray-100" />
          <button
            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => {
              setRealmToDelete({ name, id });
              setModal("Delete Realm");
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default DesktopRealmItem;
