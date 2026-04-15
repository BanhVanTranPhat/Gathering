'use client'

import { CircleCheck, CircleX } from "lucide-react";
import { COMPARISON_OLD, COMPARISON_NEW } from "../constants";

export default function ComparisonSection() {
  return (
    <section className="py-20 bg-teal-900 dark:bg-gray-950 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nâng cấp trải nghiệm làm việc
          </h2>
          <p className="text-teal-200 dark:text-gray-400 max-w-2xl mx-auto">
            Tại sao các đội nhóm chuyển từ công cụ họp truyền thống sang The
            Gathering?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-teal-800/50 dark:bg-gray-800/50 rounded-2xl p-8 border border-teal-700/50 dark:border-gray-700/50">
            <h3 className="text-xl font-bold mb-6 text-teal-200 dark:text-gray-300 flex items-center gap-2">
              <span className="text-2xl">🏚️</span> Cách làm cũ
            </h3>
            <ul className="space-y-4">
              {COMPARISON_OLD.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-teal-100/80 dark:text-gray-400"
                >
                  <CircleX className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-2xl p-8 border border-white dark:border-gray-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              KHUYÊN DÙNG
            </div>
            <h3 className="text-xl font-bold mb-6 text-teal-600 dark:text-teal-400 flex items-center gap-2">
              <span className="text-2xl">🚀</span> The Gathering
            </h3>
            <ul className="space-y-4">
              {COMPARISON_NEW.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 font-medium">
                  <CircleCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
