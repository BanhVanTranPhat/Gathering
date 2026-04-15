'use client'

import { PUB } from "@/utils/assetPaths";
import { Monitor, Play } from "lucide-react";

export default function VideoDemo() {
  return (
    <div className="hidden lg:flex flex-1 items-center justify-center p-8 xl:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#1a1b2e]" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-900/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-emerald-900/15 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-3xl">
        <div className="bg-[#252840] rounded-2xl shadow-2xl border border-[#2D3054] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#1E2035] border-b border-[#2D3054]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-1 bg-[#2D3054] rounded-md text-xs text-gray-400 border border-[#3F4776]">
                <Monitor className="w-3 h-3" />
                The Gathering — Demo
              </div>
            </div>
          </div>

          <div className="relative aspect-video bg-gray-900">
            <video
              src={`${PUB.ui}/banner-video.mov`}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-400">
          <Play className="w-4 h-4 text-teal-500" />
          <span>
            Không gian làm việc ảo —{" "}
            <span className="font-semibold text-teal-400">
              kết nối đội nhóm từ xa
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
