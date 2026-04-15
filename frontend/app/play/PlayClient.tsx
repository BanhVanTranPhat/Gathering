"use client";
import React, { useEffect, useState } from "react";
import PixiApp from "./PixiApp";
import { RealmData } from "@/utils/pixi/types";
import PlayNavbar from "./PlayNavbar";
import PlaySidebar from "./PlaySidebar";
import ChatPanel from "./chat/ChatPanel";
import CalendarPanel from "./CalendarPanel";
import LibraryPanel from "./LibraryPanel";
import ForumPanel from "./ForumPanel";
import ServicesPanel from "./ServicesPanel";
import MapZoomControls from "./MapZoomControls";
import MiniMap from "./MiniMap";
import OverviewMap from "./OverviewMap";
import ViewSelector from "./ViewSelector";
import ProximityCallPrompt from "./ProximityCallPrompt";
import FocusRoomPanel from "./FocusRoomPanel";
import GitHubPanel from "./GitHubPanel";
import GroupCallPanel from "./GroupCallPanel";
import { useRouter } from "next/navigation";
import { useModal } from "../hooks/useModal";
import signal from "@/utils/signal";
import IntroScreen from "./IntroScreen";
import ElevatorMenu from "./ElevatorMenu";

type PlayClientProps = {
  mapData: RealmData;
  username: string;
  access_token: string;
  realmId: string;
  uid: string;
  ownerId: string;
  shareId: string;
  initialSkin: string;
  name: string;
  avatarConfig?: Record<string, string> | null;
};

const PlayClient: React.FC<PlayClientProps> = ({
  mapData,
  username: initialUsername,
  access_token,
  realmId,
  uid,
  ownerId,
  shareId,
  initialSkin,
  name,
  avatarConfig,
}) => {
  const router = useRouter();
  const { setErrorModal, setDisconnectedMessage } = useModal();
  const [showIntroScreen, setShowIntroScreen] = useState(true);
  const [username, setUsername] = useState(initialUsername);
  const [skin, setSkin] = useState(initialSkin || "009");
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);
  const [showLibraryPanel, setShowLibraryPanel] = useState(false);
  const [showForumPanel, setShowForumPanel] = useState(false);
  const [showServicesPanel, setShowServicesPanel] = useState(false);
  const [libraryType, setLibraryType] = useState("all");
  const [lastAutoOpened, setLastAutoOpened] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [isAuthRedirecting, setIsAuthRedirecting] = useState(false);

  useEffect(() => {
    setUsername(initialUsername);
  }, [initialUsername]);

  useEffect(() => {
    setInviteUrl(
      `${window.location.origin}/play/${realmId}${shareId ? `?shareId=${shareId}` : ""}`,
    );
  }, [realmId, shareId]);

  useEffect(() => {
    const onShowKickedModal = (message: string) => {
      setErrorModal("Disconnected");
      setDisconnectedMessage(message);
    };
    const onShowDisconnectModal = () => {
      setErrorModal("Disconnected");
      setDisconnectedMessage("You have been disconnected from the server.");
    };
    const onSwitchSkin = (skin: string) => setSkin(skin);

    const onZoneChanged = (zone: any) => {
      if (!zone) {
        // If we previously auto-opened a panel, close it when leaving the zone
        if (lastAutoOpened === "forum") setShowForumPanel(false);
        if (lastAutoOpened === "library") setShowLibraryPanel(false);
        if (lastAutoOpened === "events") setShowCalendarPanel(false);
        setLastAutoOpened(null);
        return;
      }

      if (zone.type === "forum") {
        setShowForumPanel(true);
        setLastAutoOpened("forum");
      }
      if (zone.type === "library") {
        setLibraryType(zone.id.includes("tech") ? "guide" : "all"); // Example logic
        setShowLibraryPanel(true);
        setLastAutoOpened("library");
      }
      if (zone.type === "events") {
        setShowCalendarPanel(true);
        setLastAutoOpened("events");
      }
    };

    signal.on("showKickedModal", onShowKickedModal);
    signal.on("showDisconnectModal", onShowDisconnectModal);
    signal.on("switchSkin", onSwitchSkin);
    signal.on("playerZoneChanged", onZoneChanged);
    return () => {
      signal.off("showKickedModal", onShowKickedModal);
      signal.off("showDisconnectModal", onShowDisconnectModal);
      signal.off("switchSkin", onSwitchSkin);
      signal.off("playerZoneChanged", onZoneChanged);
    };
  }, []);

  useEffect(() => {
    const onAuthExpired = () => {
      if (isAuthRedirecting) return;
      setIsAuthRedirecting(true);
      setErrorModal("Disconnected");
      setDisconnectedMessage("Your session has expired. Please sign in again.");
      router.replace("/signin?reason=session-expired");
    };

    window.addEventListener("gathering:auth-expired", onAuthExpired);
    return () => {
      window.removeEventListener("gathering:auth-expired", onAuthExpired);
    };
  }, [isAuthRedirecting, router, setDisconnectedMessage, setErrorModal]);

  return (
    <>
      {!showIntroScreen && (
        <div className="flex h-screen w-screen overflow-hidden bg-primary">
          <PlaySidebar
            username={username}
            currentUid={uid}
            ownerId={ownerId}
            roomName={name}
            realmId={realmId}
            inviteUrl={inviteUrl}
            avatarConfig={avatarConfig}
            showChatPanel={showChatPanel}
            onToggleChatPanel={() => setShowChatPanel((v) => !v)}
            showCalendarPanel={showCalendarPanel}
            onToggleCalendarPanel={(v) => setShowCalendarPanel(v)}
            showLibraryPanel={showLibraryPanel}
            onToggleLibraryPanel={(v) => setShowLibraryPanel(v)}
            showForumPanel={showForumPanel}
            onToggleForumPanel={(v) => setShowForumPanel(v)}
            showServicesPanel={showServicesPanel}
            onToggleServicesPanel={(v) => setShowServicesPanel(v)}
          />
          <div className="flex-1 min-w-0 h-full relative overflow-hidden">
            <MapZoomControls />
            <MiniMap />
            <OverviewMap />
            <FocusRoomPanel />
            <GitHubPanel />
            <GroupCallPanel username={username} realmId={realmId} />
            <PixiApp
              mapData={mapData}
              className="w-full h-full"
              username={username}
              access_token={access_token}
              realmId={realmId}
              uid={uid}
              shareId={shareId}
              initialSkin={skin}
              avatarConfig={avatarConfig || undefined}
            />
            <ElevatorMenu mapData={mapData} />
            {showChatPanel && (
              <ChatPanel realmId={realmId} uid={uid} username={username} />
            )}
            {showCalendarPanel && (
              <CalendarPanel realmId={realmId} uid={uid} username={username} />
            )}
            {showLibraryPanel && (
              <LibraryPanel realmId={realmId} uid={uid} username={username} initialType={libraryType} />
            )}
            {showForumPanel && (
              <ForumPanel realmId={realmId} uid={uid} username={username} />
            )}
            {showServicesPanel && (
              <ServicesPanel realmId={realmId} uid={uid} username={username} />
            )}
            <ProximityCallPrompt uid={uid} username={username} />
            <PlayNavbar
              username={username}
              skin={skin}
              realmId={realmId}
              shareId={shareId}
              avatarConfig={avatarConfig || undefined}
              uid={uid}
            />
            <ViewSelector />
          </div>
        </div>
      )}
      {showIntroScreen && (
        <IntroScreen
          realmName={name}
          username={username}
          setUsername={setUsername}
          setShowIntroScreen={setShowIntroScreen}
          avatarConfig={avatarConfig || undefined}
        />
      )}
    </>
  );
};
export default PlayClient;
