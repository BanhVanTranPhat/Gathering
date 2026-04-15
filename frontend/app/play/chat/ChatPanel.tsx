"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { server } from "@/utils/backend/server";
import { api } from "@/utils/backendApi";
import ChannelList from "./ChannelList";
import DirectMessageList from "./DirectMessageList";
import MessageView from "./MessageView";
import MessageComposer from "./MessageComposer";
import ChatHeader from "./ChatHeader";

export type ChatChannelData = {
  _id: string;
  realmId: string;
  name: string;
  type: "channel" | "dm";
  members: string[];
  createdBy: string;
};

export type ChatMessageData = {
  _id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
};

type ChatPanelProps = {
  realmId: string;
  uid: string;
  username: string;
};

const ChatPanel: React.FC<ChatPanelProps> = ({ realmId, uid, username }) => {
  const [channels, setChannels] = useState<ChatChannelData[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannelData | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevChannelRef = useRef<string | null>(null);

  const fetchChannels = useCallback(async () => {
    try {
      const data = await api.get<{ channels?: ChatChannelData[] }>(
        `/chat/channels/${realmId}`,
      );
      if (data.channels) {
        setChannels(data.channels);
        if (!activeChannel && data.channels.length > 0) {
          setActiveChannel(data.channels[0]);
        }
      }
      setErrorMessage(null);
    } catch (e) {
      console.error("Failed to fetch channels:", e);
      setErrorMessage("Khong tai duoc danh sach kenh. Vui long thu lai.");
    } finally {
      setLoading(false);
    }
  }, [realmId, activeChannel]);

  const fetchMessages = useCallback(async (channelId: string) => {
    try {
      const data = await api.get<{ messages?: ChatMessageData[] }>(
        `/chat/messages/${channelId}?limit=50`,
      );
      if (data.messages) setMessages(data.messages);
      setErrorMessage(null);
    } catch (e) {
      console.error("Failed to fetch messages:", e);
      setErrorMessage("Khong tai duoc tin nhan. Vui long thu lai.");
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (!activeChannel) return;

    if (prevChannelRef.current) {
      server.socket.emit("leaveChatChannel", prevChannelRef.current);
    }
    server.socket.emit("joinChatChannel", activeChannel._id);
    prevChannelRef.current = activeChannel._id;
    fetchMessages(activeChannel._id);
    setTypingUser(null);
  }, [activeChannel?._id, fetchMessages]);

  useEffect(() => {
    const onMessage = (msg: ChatMessageData) => {
      if (msg.channelId === activeChannel?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const onTyping = (data: { channelId: string; username: string }) => {
      if (data.channelId === activeChannel?._id && data.username !== username) {
        setTypingUser(data.username);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
      }
    };

    server.socket.on("chatMessageReceived", onMessage);
    server.socket.on("chatUserTyping", onTyping);
    return () => {
      server.socket.off("chatMessageReceived", onMessage);
      server.socket.off("chatUserTyping", onTyping);
    };
  }, [activeChannel?._id, username]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeChannel || !content.trim()) return;
      server.socket.emit("chatMessage", {
        channelId: activeChannel._id,
        content: content.trim(),
        senderName: username,
      });
    },
    [activeChannel, username],
  );

  const handleTyping = useCallback(() => {
    if (!activeChannel) return;
    server.socket.emit("chatTyping", {
      channelId: activeChannel._id,
      username,
    });
  }, [activeChannel, username]);

  const createChannel = useCallback(
    async (name: string) => {
      if (!name.trim()) return;
      try {
        const data = await api.post<{ channel?: ChatChannelData }>(
          "/chat/channels",
          {
            realmId,
            name: name.trim(),
            type: "channel",
          },
        );
        const createdChannel = data.channel;
        if (!createdChannel) return;
        setChannels((prev) => [...prev, createdChannel]);
        setActiveChannel(createdChannel);
        setErrorMessage(null);
      } catch (e) {
        console.error("Failed to create channel:", e);
        setErrorMessage("Khong tao duoc kenh moi. Vui long thu lai.");
      }
    },
    [realmId],
  );

  const createDM = useCallback(
    async (targetUid: string, targetName: string) => {
      try {
        const data = await api.post<{ channel?: ChatChannelData }>(
          "/chat/channels",
          {
            realmId,
            name: targetName,
            type: "dm",
            members: [uid, targetUid],
          },
        );
        const dmChannel = data.channel;
        if (!dmChannel) return;
        setChannels((prev) => {
          const exists = prev.find((c) => c._id === dmChannel._id);
          return exists ? prev : [...prev, dmChannel];
        });
        setActiveChannel(dmChannel);
        setErrorMessage(null);
      } catch (e) {
        console.error("Failed to create DM:", e);
        setErrorMessage("Khong tao duoc tin nhan rieng. Vui long thu lai.");
      }
    },
    [realmId, uid],
  );

  const channelsList = channels.filter((c) => c.type === "channel");
  const dmList = channels.filter((c) => c.type === "dm");

  if (loading) {
    return (
      <div className="absolute inset-0 z-20 bg-[#1a1d2e]/95 backdrop-blur flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex bg-[#1a1d2e]/95 backdrop-blur-sm">
      <div className="w-56 border-r border-white/10 flex flex-col shrink-0">
        <div className="px-3 py-3 border-b border-white/10">
          <h2 className="text-white font-bold text-sm">Chat</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChannelList
            channels={channelsList}
            activeId={activeChannel?._id ?? null}
            onSelect={setActiveChannel}
            onCreate={createChannel}
          />
          <DirectMessageList
            dms={dmList}
            activeId={activeChannel?._id ?? null}
            onSelect={setActiveChannel}
            uid={uid}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {errorMessage && (
          <div className="mx-3 mt-3 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs text-red-100">
            {errorMessage}
          </div>
        )}
        {activeChannel ? (
          <>
            <ChatHeader channel={activeChannel} uid={uid} />
            <MessageView
              messages={messages}
              uid={uid}
              typingUser={typingUser}
            />
            <MessageComposer
              onSend={sendMessage}
              onTyping={handleTyping}
              channelName={activeChannel.name}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
            Select a channel to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
