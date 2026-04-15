"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CaretLeft,
  CaretRight,
  Plus,
  X,
  Clock,
  MapPin,
  UsersThree,
} from "@phosphor-icons/react";
import { api } from "@/utils/backendApi";

type Event = {
  eventId: string;
  realmId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  createdByName: string;
  attendees: { userId: string; username: string; status: string }[];
  location: string;
  maxParticipants?: number;
  hostingMode?: "agora" | "external";
  roomIndex?: number;
  channelKey?: string;
  breakoutRooms?: {
    name: string;
    roomIndex: number;
    channelKey?: string;
    maxParticipants?: number;
  }[];
};

type CalendarPanelProps = {
  realmId: string;
  uid: string;
  username: string;
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 08 - 23

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(d);
    dt.setDate(diff + i);
    dt.setHours(0, 0, 0, 0);
    return dt;
  });
}

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const CalendarPanel: React.FC<CalendarPanelProps> = ({
  realmId,
  uid,
  username,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomIndex, setRoomIndex] = useState("0");
  const [channelKey, setChannelKey] = useState("");
  const [breakoutInput, setBreakoutInput] = useState("");

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const monthLabel = currentDate.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  const fetchEvents = async () => {
    try {
      const m = currentDate.getMonth();
      const y = currentDate.getFullYear();
      const data = await api.get<{ events: Event[] }>(
        `/events?realmId=${realmId}&month=${m}&year=${y}`,
      );
      setEvents(data.events || []);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load events");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [realmId, currentDate]);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  const handleCreate = async () => {
    if (!title.trim() || !startTime || !endTime) return;
    setLoading(true);
    try {
      await api.post("/events", {
        realmId,
        title,
        description,
        startTime,
        endTime,
        createdByName: username,
        roomIndex: Number(roomIndex),
        channelKey,
        breakoutRooms: breakoutInput
          .split(",")
          .map((name, index) => name.trim())
          .filter(Boolean)
          .map((name, index) => ({
            name,
            roomIndex: Number(roomIndex) + index + 1,
            channelKey: channelKey
              ? `${channelKey}-breakout-${index + 1}`
              : undefined,
          })),
      });
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setRoomIndex("0");
      setChannelKey("");
      setBreakoutInput("");
      fetchEvents();
    } catch (e: any) {
      setError(e?.message || "Failed to create event");
    }
    setLoading(false);
  };

  const handleRsvp = async (eventId: string, status: string) => {
    try {
      await api.post(`/events/${eventId}/rsvp`, { status, username });
      fetchEvents();
    } catch (e: any) {
      setError(e?.message || "RSVP failed");
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await api.delete(`/events/${eventId}`);
      setSelectedEvent(null);
      fetchEvents();
    } catch (e: any) {
      setError(e?.message || "Failed to delete event");
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowHour = new Date().getHours();

  const getEventsForDayHour = (day: Date, hour: number) => {
    return events.filter((e) => {
      const s = new Date(e.startTime);
      return (
        s.getFullYear() === day.getFullYear() &&
        s.getMonth() === day.getMonth() &&
        s.getDate() === day.getDate() &&
        s.getHours() === hour
      );
    });
  };

  return (
    <div className="absolute inset-0 bg-[#1a1b2e] flex flex-col z-30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D3054] flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            title="Previous week"
            aria-label="Previous week"
          >
            <CaretLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextWeek}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            title="Next week"
            aria-label="Next week"
          >
            <CaretRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white border border-[#2D3054]"
          >
            Today
          </button>
          <span className="text-sm font-semibold text-white ml-2">
            {monthLabel}
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> New Meeting
        </button>
      </div>

      {/* Day headers */}
      <div className="flex border-b border-[#2D3054] flex-shrink-0">
        <div className="w-12 flex-shrink-0" />
        {weekDates.map((d, i) => {
          const isToday = d.getTime() === today.getTime();
          return (
            <div
              key={i}
              className="flex-1 text-center py-2 border-l border-[#2D3054]"
            >
              <p className="text-[10px] text-gray-500 font-medium">
                {DAY_LABELS[i]}
              </p>
              <p
                className={`text-sm font-bold ${isToday ? "text-red-400 bg-red-500/20 rounded-full w-7 h-7 flex items-center justify-center mx-auto" : "text-white"}`}
              >
                {d.getDate()}
              </p>
            </div>
          );
        })}
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

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="flex h-14 border-b border-[#2D3054]/50">
              <div className="w-12 flex-shrink-0 text-[10px] text-gray-500 text-right pr-2 pt-0.5">
                {String(hour).padStart(2, "0")}
              </div>
              {weekDates.map((d, di) => {
                const cellEvents = getEventsForDayHour(d, hour);
                const isNowCell =
                  d.getTime() === today.getTime() && hour === nowHour;
                return (
                  <div
                    key={di}
                    className="flex-1 border-l border-[#2D3054]/50 relative"
                  >
                    {isNowCell && (
                      <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 top-0">
                        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                      </div>
                    )}
                    {cellEvents.map((ev) => (
                      <button
                        key={ev.eventId}
                        onClick={() => setSelectedEvent(ev)}
                        className="absolute inset-x-0.5 top-0.5 bottom-0.5 rounded bg-[#6C72CB]/30 border border-[#6C72CB]/50 px-1 text-left overflow-hidden hover:bg-[#6C72CB]/50 transition-colors"
                      >
                        <p className="text-[10px] font-medium text-white truncate">
                          {ev.title}
                        </p>
                        <p className="text-[8px] text-gray-400">
                          {new Date(ev.startTime).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Create event modal */}
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
              <h3 className="text-white font-semibold text-sm">New Meeting</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white"
                title="Close create event modal"
                aria-label="Close create event modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB]"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-sm placeholder-gray-500 outline-none focus:border-[#6C72CB] resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    title="Start date and time"
                    aria-label="Start date and time"
                    className="w-full px-2 py-1.5 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-xs outline-none focus:border-[#6C72CB]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    title="End date and time"
                    aria-label="End date and time"
                    className="w-full px-2 py-1.5 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-xs outline-none focus:border-[#6C72CB]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">
                    Room Index
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={roomIndex}
                    onChange={(e) => setRoomIndex(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-xs outline-none focus:border-[#6C72CB]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">
                    Channel Key
                  </label>
                  <input
                    type="text"
                    placeholder="realm-main"
                    value={channelKey}
                    onChange={(e) => setChannelKey(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-xs outline-none focus:border-[#6C72CB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">
                  Breakouts (comma separated names)
                </label>
                <input
                  type="text"
                  value={breakoutInput}
                  onChange={(e) => setBreakoutInput(e.target.value)}
                  placeholder="Focus Room, Mentoring, Private Session"
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2035] border border-[#3F4776] text-white text-xs placeholder-gray-500 outline-none focus:border-[#6C72CB]"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading || !title.trim() || !startTime || !endTime}
                className="w-full py-2 rounded-lg bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-40"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-[#252840] rounded-xl p-5 w-[380px] max-w-[90vw] shadow-2xl border border-[#2D3054]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">
                {selectedEvent.title}
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-white"
                title="Close event details"
                aria-label="Close event details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedEvent.description && (
              <p className="text-xs text-gray-400 mb-3">
                {selectedEvent.description}
              </p>
            )}
            <div className="space-y-2 text-xs text-gray-300 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                {new Date(selectedEvent.startTime).toLocaleString(
                  "vi-VN",
                )} —{" "}
                {new Date(selectedEvent.endTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  {selectedEvent.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <UsersThree className="w-3.5 h-3.5 text-gray-500" />
                {
                  selectedEvent.attendees.filter((a) => a.status === "going")
                    .length
                }{" "}
                going
                {selectedEvent.maxParticipants
                  ? ` / ${selectedEvent.maxParticipants} max`
                  : ""}
              </div>
              <div className="text-[11px] text-gray-400">
                Host mapping: room #{selectedEvent.roomIndex ?? 0}
                {selectedEvent.channelKey ? ` - channel ${selectedEvent.channelKey}` : ""}
              </div>
              {(selectedEvent.breakoutRooms || []).length > 0 && (
                <div className="rounded-lg border border-[#2D3054] bg-[#1E2035] p-2">
                  <p className="text-[10px] text-gray-500 mb-1">Breakout sessions</p>
                  <div className="space-y-1">
                    {(selectedEvent.breakoutRooms || []).map((breakout, index) => (
                      <p key={`${breakout.name}-${index}`} className="text-[11px] text-gray-300">
                        {breakout.name} (room #{breakout.roomIndex}
                        {breakout.channelKey ? `, ${breakout.channelKey}` : ""})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mb-3">
              {(["going", "maybe", "not_going"] as const).map((s) => {
                const myRsvp = selectedEvent.attendees.find(
                  (a) => a.userId === uid,
                )?.status;
                const label =
                  s === "going"
                    ? "Going"
                    : s === "maybe"
                      ? "Maybe"
                      : "Not Going";
                return (
                  <button
                    key={s}
                    onClick={() => handleRsvp(selectedEvent.eventId, s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      myRsvp === s
                        ? "bg-[#6C72CB] text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10 border border-[#2D3054]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {selectedEvent.createdBy === uid && (
              <button
                onClick={() => handleDelete(selectedEvent.eventId)}
                className="w-full py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
              >
                Delete Event
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPanel;
