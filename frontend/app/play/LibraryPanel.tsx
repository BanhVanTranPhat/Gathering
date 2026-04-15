"use client";

import React, { useState, useEffect } from "react";
import {
  MagnifyingGlass,
  Plus,
  X,
  ArrowSquareOut,
  BookOpen,
} from "@phosphor-icons/react";
import { api } from "@/utils/backendApi";

type Resource = {
  _id: string;
  title: string;
  author?: string;
  content_type: string;
  url?: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
};

type LibraryPanelProps = {
  realmId: string;
  uid: string;
  username: string;
  initialType?: string;
};

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Guides", value: "guide" },
  { label: "E-books", value: "ebook" },
  { label: "Courses", value: "course" },
  { label: "Videos", value: "video" },
  { label: "Audio", value: "audio" },
];

const TYPE_COLORS: Record<string, string> = {
  guide: "bg-blue-500/20 text-blue-400",
  ebook: "bg-purple-500/20 text-purple-400",
  course: "bg-green-500/20 text-green-400",
  video: "bg-red-500/20 text-red-400",
  audio: "bg-amber-500/20 text-amber-400",
  other: "bg-gray-500/20 text-gray-400",
};

const LibraryPanel: React.FC<LibraryPanelProps> = ({
  realmId,
  uid,
  username,
  initialType = "all",
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState(initialType);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Sync activeType if initialType changes from outside
  useEffect(() => {
    if (initialType && initialType !== "all") {
      setActiveType(initialType);
    }
  }, [initialType]);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("guide");
  const [newUrl, setNewUrl] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debouncedSearch, activeType]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("realmId", realmId);
      params.set("page", String(page));
      if (activeType !== "all") params.set("type", activeType);
      if (debouncedSearch) params.set("q", debouncedSearch);
      const data = await api.get<{ resources: Resource[]; pagination: any }>(
        `/resources?${params}`,
      );
      setResources(data.resources || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load resources");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, [realmId, page, activeType, debouncedSearch]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api.post("/resources", {
        title: newTitle,
        content_type: newType,
        url: newUrl,
        author: newAuthor,
        description: newDesc,
        realmId,
        createdByName: username,
      });
      setShowCreate(false);
      setNewTitle("");
      setNewType("guide");
      setNewUrl("");
      setNewAuthor("");
      setNewDesc("");
      setError("");
      fetchResources();
    } catch (e: any) {
      setError(e?.message || "Failed to add resource");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/resources/${id}`);
      fetchResources();
    } catch (e: any) {
      setError(e?.message || "Failed to delete resource");
    }
  };

  return (
    <div className="absolute inset-0 bg-[#1a1b2e] flex flex-col z-30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D3054] flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#6C72CB]" />
          <span className="text-sm font-semibold text-white">Library</span>
          <span className="text-[10px] text-gray-500">
            {pagination.total} resources
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Add Resource
        </button>
      </div>

      {/* Search + filters */}
      <div className="px-4 py-3 border-b border-[#2D3054] flex-shrink-0 space-y-2">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#252840] border border-[#2D3054] text-white text-xs placeholder-gray-500 outline-none focus:border-[#6C72CB]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveType(f.value)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${activeType === f.value ? "bg-[#6C72CB] text-white" : "bg-[#252840] text-gray-400 hover:text-white border border-[#2D3054]"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
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

      {/* Resource list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No resources yet</p>
          </div>
        ) : (
          resources.map((r) => (
            <div
              key={r._id}
              className="bg-[#252840] rounded-lg border border-[#2D3054] p-3 hover:border-[#3F4776] transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${TYPE_COLORS[r.content_type] || TYPE_COLORS.other}`}
                    >
                      {r.content_type}
                    </span>
                    <h3 className="text-xs font-semibold text-white truncate">
                      {r.title}
                    </h3>
                  </div>
                  {r.author && (
                    <p className="text-[10px] text-gray-500 mb-1">
                      by {r.author}
                    </p>
                  )}
                  {r.description && (
                    <p className="text-[10px] text-gray-400 line-clamp-2">
                      {r.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                      title={`Open resource: ${r.title}`}
                      aria-label={`Open resource: ${r.title}`}
                    >
                      <ArrowSquareOut className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {r.createdBy === uid && (
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                      title={`Delete resource: ${r.title}`}
                      aria-label={`Delete resource: ${r.title}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-6 h-6 rounded text-[10px] font-medium ${page === i + 1 ? "bg-[#6C72CB] text-white" : "bg-[#252840] text-gray-400 border border-[#2D3054]"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
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
              <h3 className="text-white font-semibold text-sm">Add Resource</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white"
                title="Close add resource modal"
                aria-label="Close add resource modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />
              <input
                type="text"
                placeholder="Author (optional)"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                title="Resource type"
                aria-label="Resource type"
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm outline-none focus:border-[#6C72CB]"
              >
                <option value="guide">Guide</option>
                <option value="ebook">E-book</option>
                <option value="course">Course</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="other">Other</option>
              </select>
              <input
                type="url"
                placeholder="URL (optional)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />
              <textarea
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB] resize-none"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="w-full py-2 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {creating ? "Adding..." : "Add Resource"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPanel;
