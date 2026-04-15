"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChatCircleDots,
  Plus,
  X,
  PaperPlaneRight,
  Trash,
  ArrowLeft,
  Clock,
  User,
} from "@phosphor-icons/react";
import { api } from "@/utils/backendApi";

type Thread = {
  _id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  realmId: string;
  postCount: number;
  lastPostAt?: string;
  createdAt?: string;
  canDelete?: boolean;
};

type Post = {
  _id: string;
  threadId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt?: string;
  canDelete?: boolean;
};

type ForumPanelProps = {
  realmId: string;
  uid: string;
  username: string;
};

const ForumPanel: React.FC<ForumPanelProps> = ({ realmId, uid, username }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLoading, setPostLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);

  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchThreads = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const data = await api.get<{ threads: Thread[]; pagination: any; isAdmin?: boolean }>(
          `/forum/threads?realmId=${realmId}&page=${p}`,
        );
        setThreads(data.threads || []);
        setIsAdmin(Boolean(data.isAdmin));
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        setPage(data.pagination?.page || 1);
        setError("");
      } catch (e: any) {
        setError(e?.message || "Failed to load threads");
      }
      setLoading(false);
    },
    [realmId],
  );

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const openThread = async (thread: Thread) => {
    setSelectedThread(thread);
    setPostLoading(true);
    try {
      const data = await api.get<{ thread: Thread; posts: Post[]; isAdmin?: boolean }>(
        `/forum/threads/${thread._id}`,
      );
      setSelectedThread(data.thread || thread);
      setPosts(data.posts || []);
      setIsAdmin(Boolean(data.isAdmin));
    } catch (e: any) {
      setError(e?.message || "Failed to load thread");
    }
    setPostLoading(false);
  };

  const handleCreateThread = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api.post("/forum/threads", {
        realmId,
        title: newTitle,
        body: newBody,
        authorName: username,
      });
      setShowCreate(false);
      setNewTitle("");
      setNewBody("");
      setError("");
      fetchThreads();
    } catch (e: any) {
      setError(e?.message || "Failed to create topic");
    }
    setCreating(false);
  };

  const handleReply = async () => {
    if (!replyBody.trim() || !selectedThread) return;
    setReplying(true);
    try {
      await api.post(`/forum/threads/${selectedThread._id}/posts`, {
        body: replyBody,
        authorName: username,
      });
      setReplyBody("");
      openThread(selectedThread);
    } catch (e: any) {
      setError(e?.message || "Failed to post reply");
    }
    setReplying(false);
  };

  const handleDeleteThread = async (id: string) => {
    try {
      await api.delete(`/forum/threads/${id}`);
      setSelectedThread(null);
      fetchThreads();
    } catch (e: any) {
      setError(e?.message || "Failed to delete thread");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!selectedThread) return;
    try {
      await api.delete(`/forum/posts/${id}`);
      openThread(selectedThread);
    } catch (e: any) {
      setError(e?.message || "Failed to delete post");
    }
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="absolute inset-0 bg-[#1a1b2e] flex flex-col z-30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D3054] flex-shrink-0">
        <div className="flex items-center gap-2">
          {selectedThread ? (
            <button
              onClick={() => setSelectedThread(null)}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
              title="Back to topics"
              aria-label="Back to topics"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <ChatCircleDots className="w-5 h-5 text-[#6C72CB]" />
          )}
          <span className="text-sm font-semibold text-white">
            {selectedThread ? selectedThread.title : "Forum"}
          </span>
          {isAdmin && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Moderator
            </span>
          )}
          {!selectedThread && (
            <span className="text-[10px] text-gray-500">
              {pagination.total} topics
            </span>
          )}
        </div>
        {!selectedThread && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> New Topic
          </button>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-300 hover:text-white"
            title="Dismiss error"
            aria-label="Dismiss error"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {!selectedThread ? (
        /* Thread list */
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <ChatCircleDots className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No topics yet. Start the conversation!</p>
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={t._id}
                onClick={() => openThread(t)}
                className="w-full text-left bg-[#252840] rounded-lg border border-[#2D3054] p-3 hover:border-[#3F4776] transition-colors"
              >
                <h3 className="text-xs font-semibold text-white mb-1 truncate">
                  {t.title}
                </h3>
                {t.body && (
                  <p className="text-[10px] text-gray-400 line-clamp-1 mb-1.5">
                    {t.body}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[9px] text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <User className="w-2.5 h-2.5" />
                    {t.authorName || "Anonymous"}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <ChatCircleDots className="w-2.5 h-2.5" />
                    {t.postCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(t.lastPostAt || t.createdAt)}
                  </span>
                </div>
              </button>
            ))
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => fetchThreads(i + 1)}
                  className={`w-6 h-6 rounded text-[10px] font-medium ${page === i + 1 ? "bg-[#6C72CB] text-white" : "bg-[#252840] text-gray-400 border border-[#2D3054]"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Thread detail */
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Original post */}
            <div className="bg-[#252840] rounded-lg border border-[#2D3054] p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  {selectedThread.body && (
                    <p className="text-xs text-gray-200 whitespace-pre-wrap mb-2">
                      {selectedThread.body}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[9px] text-gray-500">
                    <span>{selectedThread.authorName}</span>
                    <span>{formatDate(selectedThread.createdAt)}</span>
                  </div>
                </div>
                {selectedThread.canDelete && (
                  <button
                    onClick={() => handleDeleteThread(selectedThread._id)}
                    className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                    title="Delete topic"
                    aria-label="Delete topic"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Replies */}
            {postLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              posts.map((p) => (
                <div
                  key={p._id}
                  className="bg-[#1E2035] rounded-lg border border-[#2D3054] p-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-200 whitespace-pre-wrap mb-1.5">
                        {p.body}
                      </p>
                      <div className="flex items-center gap-2 text-[9px] text-gray-500">
                        <span>{p.authorName || "Anonymous"}</span>
                        <span>{formatDate(p.createdAt)}</span>
                      </div>
                    </div>
                    {p.canDelete && (
                      <button
                        onClick={() => handleDeletePost(p._id)}
                        className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete reply"
                        aria-label="Delete reply"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply input */}
          <div className="flex gap-2 px-3 py-2 border-t border-[#2D3054]">
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              className="flex-1 px-3 py-2 rounded-lg bg-[#252840] border border-[#2D3054] text-white text-xs placeholder-gray-500 outline-none focus:border-[#6C72CB]"
            />
            <button
              onClick={handleReply}
              disabled={replying || !replyBody.trim()}
              title="Send reply"
              aria-label="Send reply"
              className="px-3 py-2 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white disabled:opacity-50 transition-colors"
            >
              <PaperPlaneRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Create topic modal */}
      {showCreate && (
        <div
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-40"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-[#252840] rounded-xl p-5 w-[380px] max-w-[90vw] shadow-2xl border border-[#2D3054]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">New Topic</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white"
                title="Close new topic dialog"
                aria-label="Close new topic dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Topic title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />
              <textarea
                placeholder="Description (optional)"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB] resize-none"
              />
              <button
                onClick={handleCreateThread}
                disabled={creating || !newTitle.trim()}
                className="w-full py-2 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create Topic"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumPanel;
