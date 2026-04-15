'use client'

import { Check, ChevronRight } from "lucide-react";

interface FeatureCollaborationProps {
  onJoin: () => void;
}

const FEATURE_POINTS = [
  "Thấy ngay ai đang rảnh rỗi trên bản đồ",
  "Vẫy tay chào hỏi không cần làm phiền",
  "Nghe âm thanh rõ dần khi lại gần (Spatial Audio)",
  "Tham gia cuộc trò chuyện chỉ với 1 thao tác",
];

export default function FeatureCollaboration({ onJoin }: FeatureCollaborationProps) {
  return (
    <section className="py-20 bg-slate-50 dark:bg-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wide text-sm mb-2">
                Phối hợp tức thì
              </h2>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Kết nối chỉ với một lần di chuyển
              </h3>
              <p className="text-slate-600 dark:text-gray-400 text-lg">
                Không còn chờ đợi link Zoom. Thấy ai đó đang rảnh? Chỉ cần di
                chuyển avatar của bạn lại gần họ để bắt đầu trò chuyện ngay lập
                tức.
              </p>
            </div>
            <ul className="space-y-4">
              {FEATURE_POINTS.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400 mt-0.5">
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <span className="text-slate-700 dark:text-gray-300 font-medium">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={onJoin}
              className="text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1 group"
            >
              Dùng thử 30 ngày{" "}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex-1 w-full">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-gray-950 p-6 border border-slate-100 dark:border-gray-700 relative">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-gray-800">
                <div className="h-4 w-32 bg-slate-200 dark:bg-gray-700 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-gray-700"></div>
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-gray-700"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-video bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center relative border border-teal-100 dark:border-teal-900">
                  <div className="w-12 h-12 rounded-full bg-teal-200 dark:bg-teal-600 border-4 border-white dark:border-gray-800"></div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                    Bạn
                  </div>
                </div>
                <div className="aspect-video bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center relative border border-emerald-100 dark:border-emerald-900">
                  <div className="w-12 h-12 rounded-full bg-emerald-200 dark:bg-emerald-600 border-4 border-white dark:border-gray-800"></div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                    Đồng nghiệp
                  </div>
                  <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-green-400"></div>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                  Đã kết nối âm thanh
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
