"use client";

import React, { useState, useEffect } from "react";
import {
  MagnifyingGlass,
  Copy,
  ChatCircle,
  CalendarBlank,
  Gear,
  Users,
  SignOut,
  BookOpen,
  CaretDoubleLeft,
  CaretDoubleRight,
} from "@phosphor-icons/react";
import signal from "@/utils/signal";
import InviteModal from "@/components/InviteModal";
import { api } from "@/utils/backendApi";

export type PlayerInRoom = { uid: string; username: string };
type RealmMember = { uid: string; displayName: string };

type ActivePanel =
  | "people"
  | "chat"
  | "calendar"
  | "library"
  | "forum"
  | "services"
  | null;

type PlaySidebarProps = {
  username: string;
  currentUid: string;
  ownerId: string;
  roomName: string;
  realmId: string;
  inviteUrl: string;
  avatarConfig?: Record<string, string> | null;
  showChatPanel: boolean;
  onToggleChatPanel: () => void;
  showCalendarPanel: boolean;
  onToggleCalendarPanel: (show: boolean) => void;
  showLibraryPanel: boolean;
  onToggleLibraryPanel: (show: boolean) => void;
  showForumPanel: boolean;
  onToggleForumPanel: (show: boolean) => void;
  showServicesPanel: boolean;
  onToggleServicesPanel: (show: boolean) => void;
  className?: string;
};

const PlaySidebar: React.FC<PlaySidebarProps> = ({
  username,
  currentUid,
  ownerId,
  roomName,
  realmId,
  inviteUrl,
  avatarConfig,
  showChatPanel,
  onToggleChatPanel,
  showCalendarPanel,
  onToggleCalendarPanel,
  showLibraryPanel,
  onToggleLibraryPanel,
  showForumPanel,
  onToggleForumPanel,
  showServicesPanel,
  onToggleServicesPanel,
  className = "",
}) => {
  const [online, setOnline] = useState<PlayerInRoom[]>([]);
  const [allMembers, setAllMembers] = useState<RealmMember[]>([]);
  const [search, setSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>("people");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onPlayersInRoom = (payload: { online: PlayerInRoom[] }) => {
      setOnline(payload.online || []);
    };
    signal.on("playersInRoom", onPlayersInRoom);
    return () => signal.off("playersInRoom", onPlayersInRoom);
  }, []);

  useEffect(() => {
    api
      .get<{ members: RealmMember[] }>(`/realms/${realmId}/members`)
      .then((data) => setAllMembers(data.members || []))
      .catch(() => {});
  }, [realmId]);

  const closeOverlays = () => {
    if (showChatPanel) onToggleChatPanel();
    if (showCalendarPanel) onToggleCalendarPanel(false);
    if (showLibraryPanel) onToggleLibraryPanel(false);
    if (showForumPanel) onToggleForumPanel(false);
    if (showServicesPanel) onToggleServicesPanel(false);
  };

  const togglePanel = (panel: ActivePanel) => {
    if (panel === "chat") {
      const wasOpen = showChatPanel;
      closeOverlays();
      if (!wasOpen) onToggleChatPanel();
      setActivePanel(wasOpen ? null : panel);
      if (collapsed) setCollapsed(false);
      return;
    }
    if (
      panel === "calendar" ||
      panel === "library" ||
      panel === "forum" ||
      panel === "services"
    ) {
      const togglers: Record<string, [(show: boolean) => void, boolean]> = {
        calendar: [onToggleCalendarPanel, showCalendarPanel],
        library: [onToggleLibraryPanel, showLibraryPanel],
        forum: [onToggleForumPanel, showForumPanel],
        services: [onToggleServicesPanel, showServicesPanel],
      };
      const [toggler, wasOpen] = togglers[panel];
      closeOverlays();
      if (!wasOpen) toggler(true);
      setActivePanel(wasOpen ? null : panel);
      if (collapsed) setCollapsed(false);
      return;
    }
    if (collapsed && panel === "people") {
      setCollapsed(false);
      setActivePanel("people");
      return;
    }
    closeOverlays();
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const closeAll = () => {
    setActivePanel(null);
    closeOverlays();
  };

  const handleCollapse = () => {
    if (collapsed) {
      setCollapsed(false);
      setActivePanel("people");
    } else {
      setCollapsed(true);
      setActivePanel(null);
      closeOverlays();
    }
  };

  const onlineUids = new Set(online.map((p) => p.uid));
  const offlineMembers = allMembers.filter((m) => !onlineUids.has(m.uid));

  const searchLower = search.trim().toLowerCase();
  const filteredOnline = searchLower
    ? online.filter(
        (p) =>
          p.username.toLowerCase().includes(searchLower) ||
          p.uid.toLowerCase().includes(searchLower),
      )
    : online;
  const filteredOffline = searchLower
    ? offlineMembers.filter(
        (m) =>
          m.displayName.toLowerCase().includes(searchLower) ||
          m.uid.toLowerCase().includes(searchLower),
      )
    : offlineMembers;

  type SidebarButton = {
    id: string;
    icon: React.ReactNode;
    label: string;
    panel?: ActivePanel;
    action?: () => void;
    shortcut?: string;
  };
  const iconButtons: SidebarButton[] = [
    {
      id: "people",
      icon: <Users className="w-5 h-5" />,
      label: "People",
      panel: "people",
    },
    {
      id: "chat",
      icon: (
        <ChatCircle
          className="w-5 h-5"
          weight={showChatPanel ? "fill" : "regular"}
        />
      ),
      label: "Chat",
      panel: "chat",
    },
    {
      id: "calendar",
      icon: <CalendarBlank className="w-5 h-5" />,
      label: "Calendar",
      panel: "calendar" as ActivePanel,
    },
    {
      id: "library",
      icon: (
        <BookOpen
          className="w-5 h-5"
          weight={showLibraryPanel ? "fill" : "regular"}
        />
      ),
      label: "Library",
      panel: "library" as ActivePanel,
    },
  ];

  const showExpandedPanel = !collapsed && activePanel === "people";

  return (
    <>
      <InviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteUrl={inviteUrl}
        roomName={roomName}
      />

      <div className={`flex-shrink-0 flex h-full ${className}`}>
        {/* Slim icon bar - always visible */}
        <div className="w-12 flex-shrink-0 flex flex-col items-center bg-[#1E2035] border-r border-[#2D3054] py-3 gap-0.5 z-10">
          {/* Room logo */}
          <button
            type="button"
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setActivePanel("people");
              } else {
                togglePanel("people");
              }
            }}
            className="w-9 h-9 rounded-xl bg-[#6C72CB] flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity mb-0.5"
            title={roomName}
          >
            {roomName.charAt(0).toUpperCase()}
          </button>

          {/* Collapse/Expand toggle */}
          <button
            type="button"
            onClick={handleCollapse}
            className="w-9 h-5 rounded-md flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/5 transition-all duration-150 mb-1 group relative"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <CaretDoubleRight className="w-3.5 h-3.5" />
            ) : (
              <CaretDoubleLeft className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="w-6 h-px bg-[#2D3054] mb-1" />

          {iconButtons.map((btn) => {
            const overlayPanels: Record<string, boolean> = {
              chat: showChatPanel,
              calendar: showCalendarPanel,
              library: showLibraryPanel,
              forum: showForumPanel,
              services: showServicesPanel,
            };
            const isActive =
              btn.panel && btn.panel in overlayPanels
                ? overlayPanels[btn.panel]
                : activePanel === btn.panel;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() =>
                  btn.action
                    ? btn.action()
                    : btn.panel
                      ? togglePanel(btn.panel)
                      : undefined
                }
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 relative group ${
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-[#8B8FA3] hover:text-white hover:bg-white/5"
                }`}
                title={btn.label}
              >
                {btn.icon}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[#1a1b2e] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg border border-[#3F4776]/40 z-50">
                    {btn.label}
                    {btn.shortcut && (
                      <span className="ml-2 text-[#6B7280]">
                        {btn.shortcut}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}

          <div className="flex-1" />

          <a
            href="/app"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/5 transition-all duration-150"
            title="Back to Spaces"
          >
            <SignOut className="w-5 h-5 -scale-x-100" />
          </a>
          <a
            href="/profile"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/5 transition-all duration-150"
            title="Settings"
          >
            <Gear className="w-5 h-5" />
          </a>
        </div>

        {/* Expandable panel */}
        {showExpandedPanel && (
          <div className="w-[220px] flex-shrink-0 flex flex-col bg-[#252840] border-r border-[#2D3054] sidebar-slide-in overflow-hidden">
            {/* Room header */}
            <div className="p-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white font-semibold text-sm truncate flex-1">
                  {roomName}
                </h2>
                {/* Collapse button (replaces copy-link) */}
                <button
                  type="button"
                  onClick={handleCollapse}
                  className="p-1 rounded hover:bg-white/10 text-[#8B8FA3] hover:text-white transition-colors"
                  title="Collapse sidebar"
                >
                  <CaretDoubleLeft className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-[#8B8FA3] mb-3">
                Experience Gathering together
              </p>
              <p className="text-[10px] text-[#6B7280] mb-2">
                Invite your closest collaborators.
              </p>

              {/* Member avatars row */}
              <div className="flex items-center gap-1 mb-3">
                {online.slice(0, 5).map((p) => (
                  <div
                    key={p.uid}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${stringToColorClass(p.username)}`}
                    title={p.username}
                  >
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                ))}
                {online.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-[#3F4776] flex items-center justify-center text-[10px] text-[#8B8FA3]">
                    +{online.length - 5}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="w-7 h-7 rounded-full border-2 border-dashed border-[#3F4776] flex items-center justify-center text-[#8B8FA3] hover:border-white/30 hover:text-white transition-colors"
                  title="Invite someone"
                >
                  <span className="text-sm leading-none">+</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-xs font-medium transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Invite
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1E2035] border border-[#2D3054]">
                <MagnifyingGlass className="w-3.5 h-3.5 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search people."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder-[#6B7280] outline-none"
                />
                <span className="text-[10px] text-[#6B7280] flex-shrink-0">
                  K F
                </span>
              </div>
            </div>

            {/* Player list */}
            <div className="flex-1 overflow-y-auto min-h-0 px-1">
              {/* Online */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-[#8B8FA3] hover:text-white transition-colors"
              >
                <span>Online ({filteredOnline.length})</span>
                <span className="text-[9px]">▾</span>
              </button>
              <ul className="space-y-px">
                {filteredOnline.map((p) => {
                  const isOwner = p.uid === ownerId;
                  const isYou = p.uid === currentUid;
                  return (
                    <li
                      key={p.uid}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors mx-1"
                    >
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isOwner ? "ring-2 ring-amber-400" : ""} ${stringToColorClass(p.username)}`}
                        >
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#252840]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-medium text-white truncate">
                            {p.username}
                          </p>
                          {isOwner && (
                            <span className="flex-shrink-0 text-[8px] font-bold px-1 py-px rounded bg-amber-500/20 text-amber-400 uppercase">
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#6B7280]">
                          {isYou ? "You" : "Active"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Offline */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-[#8B8FA3] hover:text-white transition-colors mt-1"
              >
                <span>Offline ({filteredOffline.length})</span>
                <span className="text-[9px]">▾</span>
              </button>
              {filteredOffline.length === 0 ? (
                <p className="text-[10px] text-[#4B5060] px-3 py-1.5">
                  No offline members.
                </p>
              ) : (
                <ul className="space-y-px">
                  {filteredOffline.map((m) => {
                    const isOwner = m.uid === ownerId;
                    return (
                      <li
                        key={m.uid}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors mx-1 opacity-50"
                      >
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isOwner ? "ring-2 ring-amber-400" : ""} ${stringToColorClass(m.displayName)}`}
                          >
                            {m.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gray-500 border-2 border-[#252840]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-medium text-white/60 truncate">
                              {m.displayName}
                            </p>
                            {isOwner && (
                              <span className="flex-shrink-0 text-[8px] font-bold px-1 py-px rounded bg-amber-500/20 text-amber-400 uppercase">
                                Owner
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#4B5060]">Offline</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

function stringToColorClass(str: string): string {
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-teal-500",
    "bg-blue-500",
    "bg-purple-700",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default PlaySidebar;
