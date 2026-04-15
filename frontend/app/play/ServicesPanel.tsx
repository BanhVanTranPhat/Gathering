"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlass,
  Plus,
  X,
  Phone,
  LinkSimple,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import { api } from "@/utils/backendApi";

type Service = {
  _id: string;
  title: string;
  category: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
  contactUrl?: string;
  tags?: string[];
  createdBy?: string;
  createdByName?: string;
  isApproved?: boolean;
};

type ServicesPanelProps = {
  realmId: string;
  uid: string;
  username: string;
};

const CATEGORIES = [
  "all",
  "coaching",
  "design",
  "development",
  "marketing",
  "wellness",
  "legal",
  "other",
];

const ServicesPanel: React.FC<ServicesPanelProps> = ({
  realmId,
  uid,
  username,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const prevApprovalById = useRef<Record<string, boolean>>({});

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("coaching");
  const [newDescription, setNewDescription] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTags, setNewTags] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, activeCategory]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("realmId", realmId);
      params.set("page", String(page));
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (debouncedSearch) params.set("q", debouncedSearch);

      const data = await api.get<{ services: Service[]; pagination: any }>(
        `/services?${params}`,
      );
      const nextServices = data.services || [];
      const nextApprovalMap: Record<string, boolean> = {};
      let approvedNow = 0;

      nextServices.forEach((service) => {
        nextApprovalMap[service._id] = Boolean(service.isApproved);
        if (service.createdBy === uid) {
          const prevStatus = prevApprovalById.current[service._id];
          if (prevStatus === false && service.isApproved === true) {
            approvedNow += 1;
          }
        }
      });

      prevApprovalById.current = {
        ...prevApprovalById.current,
        ...nextApprovalMap,
      };
      if (approvedNow > 0) {
        setNotice(`${approvedNow} service của bạn vừa được duyệt.`);
      }

      setServices(nextServices);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load services");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, [realmId, page, activeCategory, debouncedSearch]);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDescription.trim()) return;
    setCreating(true);
    try {
      const tags = newTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const created = await api.post<{ service?: Service }>("/services", {
        title: newTitle,
        category: newCategory,
        description: newDescription,
        contactEmail: newEmail,
        contactPhone: newPhone,
        contactUrl: newUrl,
        tags,
        realmId,
        createdByName: username,
      });

      setShowCreate(false);
      setNewTitle("");
      setNewCategory("coaching");
      setNewDescription("");
      setNewEmail("");
      setNewPhone("");
      setNewUrl("");
      setNewTags("");
      setError("");
      if (created?.service && created.service.isApproved === false) {
        setNotice("Service đã được gửi, đang chờ admin duyệt.");
      } else {
        setNotice("Service đã được đăng thành công.");
      }
      fetchServices();
    } catch (e: any) {
      setError(e?.message || "Failed to create service");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (e: any) {
      setError(e?.message || "Failed to delete service");
    }
  };

  return (
    <div className="absolute inset-0 bg-[#1a1b2e] flex flex-col z-30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D3054] flex-shrink-0">
        <div className="flex items-center gap-2">
          <LinkSimple className="w-5 h-5 text-[#6C72CB]" />
          <span className="text-sm font-semibold text-white">
            Service Directory
          </span>
          <span className="text-[10px] text-gray-500">
            {pagination.total} services
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Add Service
        </button>
      </div>

      <div className="px-4 py-3 border-b border-[#2D3054] flex-shrink-0 space-y-2">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#252840] border border-[#2D3054] text-white text-xs placeholder-gray-500 outline-none focus:border-[#6C72CB]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${activeCategory === c ? "bg-[#6C72CB] text-white" : "bg-[#252840] text-gray-400 hover:text-white border border-[#2D3054]"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            title="Dismiss error"
            onClick={() => setError("")}
            className="ml-2 text-red-300 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {notice && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
          <span>{notice}</span>
          <button
            title="Dismiss notification"
            onClick={() => setNotice("")}
            className="ml-2 text-emerald-200 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <LinkSimple className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No services found</p>
          </div>
        ) : (
          services.map((s) => (
            <div
              key={s._id}
              className="bg-[#252840] rounded-lg border border-[#2D3054] p-3 hover:border-[#3F4776] transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      {s.category}
                    </span>
                    <span
                      className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${s.isApproved ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}
                    >
                      {s.isApproved ? "Approved" : "Pending"}
                    </span>
                    <h3 className="text-xs font-semibold text-white truncate">
                      {s.title}
                    </h3>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2 whitespace-pre-wrap">
                    {s.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                    {s.contactEmail && (
                      <span className="inline-flex items-center gap-1">
                        <EnvelopeSimple className="w-3 h-3" />
                        {s.contactEmail}
                      </span>
                    )}
                    {s.contactPhone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {s.contactPhone}
                      </span>
                    )}
                    {s.contactUrl && (
                      <a
                        href={s.contactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
                      >
                        <LinkSimple className="w-3 h-3" />
                        Open Link
                      </a>
                    )}
                  </div>
                  {!!s.tags?.length && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {s.createdBy === uid && (
                  <button
                    title="Delete service"
                    onClick={() => handleDelete(s._id)}
                    className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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

      {showCreate && (
        <div
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-40"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-[#252840] rounded-xl p-5 w-[420px] max-w-[90vw] shadow-2xl border border-[#2D3054]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Add Service</h3>
              <button
                title="Close"
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Service title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />
              <select
                title="Service category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm outline-none focus:border-[#6C72CB]"
              >
                {CATEGORIES.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB] resize-none"
              />
              <input
                type="email"
                placeholder="Contact email (optional)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />
              <input
                type="text"
                placeholder="Contact phone (optional)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />
              <input
                type="url"
                placeholder="Contact URL (optional)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />

              <button
                onClick={handleCreate}
                disabled={
                  creating || !newTitle.trim() || !newDescription.trim()
                }
                className="w-full py-2 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {creating ? "Adding..." : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPanel;
