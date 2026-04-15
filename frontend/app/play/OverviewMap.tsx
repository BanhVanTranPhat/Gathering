"use client";

import React, { useEffect, useState, useCallback } from "react";
import signal from "@/utils/signal";
import {
  collabCampusDoors,
  collabCampusZones,
  Zone,
  OVERVIEW_ZOOM_THRESHOLD,
} from "@/utils/zones";
import ZonePopup from "./ZonePopup";

type ZoomData = {
  zoom: number;
  isOverview: boolean;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  playerX: number;
  playerY: number;
};

const OverviewMap: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [zoomData, setZoomData] = useState<ZoomData | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const onZoomChanged = (data: ZoomData) => {
      setZoomData(data);
      if (data.isOverview) {
        setVisible(true);
        const t = 1 - (data.zoom - 0.3) / (OVERVIEW_ZOOM_THRESHOLD - 0.3);
        setOpacity(Math.min(1, Math.max(0, t)));
      } else {
        setOpacity(0);
        setTimeout(() => setVisible(false), 200);
      }
    };
    signal.on("zoomChanged", onZoomChanged);
    return () => signal.off("zoomChanged", onZoomChanged);
  }, []);

  const handleZoneClick = useCallback((zone: Zone) => {
    setSelectedZone(zone);
  }, []);

  const handleGoTo = useCallback((zone: Zone) => {
    signal.emit("navigateToTile", zone.enterTile);
    setSelectedZone(null);
    setVisible(false);
    setOpacity(0);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      const pinchDelta = -e.deltaY * 0.01;
      signal.emit("mapZoomDelta", pinchDelta);
    } else {
      const delta = e.deltaY > 0 ? -0.25 : 0.25;
      signal.emit("mapZoomDelta", delta);
    }
  }, []);

  if (!visible || !zoomData) return null;

  const mapW = zoomData.maxX - zoomData.minX + 1;
  const mapH = zoomData.maxY - zoomData.minY + 1;
  const playerX = zoomData.playerX - zoomData.minX + 0.5;
  const playerY = zoomData.playerY - zoomData.minY + 0.5;

  return (
    <div
      className={`absolute inset-0 z-20 transition-opacity duration-200 ${opacity > 0.3 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      onWheel={handleWheel}
    >
      <div className="w-full h-full bg-[#1a1d2e]/85 backdrop-blur-sm flex items-center justify-center">
        <div className="relative w-[85%] max-w-[900px] h-[70vh]">
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${mapW} ${mapH}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {collabCampusZones.map((zone) => {
              const x = zone.bounds.x1 - zoomData.minX;
              const y = zone.bounds.y1 - zoomData.minY;
              const width = zone.bounds.x2 - zone.bounds.x1 + 1;
              const height = zone.bounds.y2 - zone.bounds.y1 + 1;

              const isSelected = selectedZone?.id === zone.id;
              const isPlayerHere =
                zoomData.playerX >= zone.bounds.x1 &&
                zoomData.playerX <= zone.bounds.x2 &&
                zoomData.playerY >= zone.bounds.y1 &&
                zoomData.playerY <= zone.bounds.y2;

              return (
                <g
                  key={zone.id}
                  className="cursor-pointer"
                  onClick={() => handleZoneClick(zone)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleZoneClick(zone);
                    }
                  }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={0.4}
                    ry={0.4}
                    fill={zone.color}
                    fillOpacity={0.2}
                    stroke={isSelected ? "#ffffff" : zone.color}
                    strokeOpacity={isSelected ? 1 : 0.5}
                    strokeWidth={isSelected ? 0.08 : 0.06}
                  />
                  <text
                    x={x + width / 2}
                    y={y + height / 2 - 0.1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white"
                    fontSize="0.5"
                  >
                    {zone.icon}
                  </text>
                  <text
                    x={x + width / 2}
                    y={y + height / 2 + 0.45}
                    textAnchor="middle"
                    className="fill-white"
                    fontSize="0.24"
                    fontWeight="700"
                  >
                    {zone.name}
                  </text>
                  {isPlayerHere && (
                    <circle
                      cx={x + width - 0.35}
                      cy={y + 0.35}
                      r={0.16}
                      fill="#4ade80"
                    />
                  )}
                </g>
              );
            })}

            {collabCampusDoors.map((door, i) => {
              const cx = door.x - zoomData.minX + 0.5;
              const cy = door.y - zoomData.minY + 0.5;
              const isVert = door.direction === "vertical";

              return (
                <g key={i} className="opacity-90">
                  <rect
                    x={cx - (isVert ? 0.06 : 0.2)}
                    y={cy - (isVert ? 0.2 : 0.06)}
                    width={isVert ? 0.12 : 0.4}
                    height={isVert ? 0.4 : 0.12}
                    rx={0.06}
                    ry={0.06}
                    fill="#fbbf24"
                  />
                </g>
              );
            })}

            {zoomData.playerX >= zoomData.minX &&
              zoomData.playerY >= zoomData.minY && (
                <g>
                  <circle
                    cx={playerX}
                    cy={playerY}
                    r={0.22}
                    fill="#4ade80"
                    stroke="#ffffff"
                    strokeWidth={0.08}
                  />
                </g>
              )}
          </svg>
        </div>
      </div>

      {selectedZone && (
        <ZonePopup
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
          onGoTo={handleGoTo}
        />
      )}
    </div>
  );
};

export default OverviewMap;
