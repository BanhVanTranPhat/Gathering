"use client";

import React from "react";
import { Keyboard } from "lucide-react";

type InteractPromptProps = {
  label: string;
};

const InteractPrompt: React.FC<InteractPromptProps> = ({ label }) => {
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
      <div className="rounded-xl border border-white/15 bg-[#1e2140]/95 px-4 py-2.5 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 text-white">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-white/10 text-xs font-bold">
            E
          </span>
          <Keyboard size={14} className="text-white/60" />
          <span className="text-sm font-medium">{label}</span>
        </div>
      </div>
    </div>
  );
};

export default InteractPrompt;
