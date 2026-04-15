
"use client";
import React, { useEffect, useState } from "react";
import signal from "@/utils/signal";
import { RealmData } from "@/utils/pixi/types";

type ElevatorMenuProps = {
  mapData: RealmData;
};

const ElevatorMenu: React.FC<ElevatorMenuProps> = ({ mapData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);

  useEffect(() => {
    const handleOpen = (data: { roomIndex: number; x: number; y: number }) => {
      setCurrentRoomIndex(data.roomIndex);
      setIsOpen(true);
    };

    signal.on("openElevatorMenu", handleOpen);
    return () => {
      signal.off("openElevatorMenu", handleOpen);
    };
  }, []);

  if (!isOpen) return null;

  const handleSelectFloor = (index: number) => {
    setIsOpen(false);
    
    // Step 1: Teleport to Cabin
    signal.emit("triggerElevatorTeleport", {
      roomIndex: 4, // Elevator Cabin index
      x: 2,
      y: 2,
    });

    // Step 2: Show "Moving..." state (optional, but good for UX)
    // Step 3: Wait and then teleport to actual floor
    setTimeout(() => {
      signal.emit("triggerElevatorTeleport", {
        roomIndex: index,
        x: 3, // Elevator exit position
        y: 3,
      });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-secondary border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Select Floor</h2>
            <p className="text-xs text-gray-400 mt-1">Where would you like to go?</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-3">
          {mapData.rooms.slice(0, 4).map((room, index) => (
            <button
              key={index}
              onClick={() => handleSelectFloor(index)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                currentRoomIndex === index
                  ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/10"
                  : "border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:border-white/20"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                currentRoomIndex === index ? "bg-blue-500 text-white" : "bg-white/10 text-gray-400"
              }`}>
                {index === 0 ? "L" : index}
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold block">{room.name}</span>
                {currentRoomIndex === index && (
                  <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Current Floor</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="w-full mt-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors border border-white/5"
        >
          Stay Here
        </button>
      </div>
    </div>
  );
};

export default ElevatorMenu;
