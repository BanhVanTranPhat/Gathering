'use client'

interface HeroSectionProps {
  onJoin: () => void;
}

export default function HeroSection({ onJoin }: HeroSectionProps) {
  return (
    <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold uppercase tracking-wide mb-6 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Gặp gỡ trực tuyến thế hệ mới
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-6">
              Không gian làm việc ảo giúp đội nhóm{" "}
              <span className="text-teal-600 dark:text-teal-400">
                gặp nhau nhanh
              </span>{" "}
              như ngoài đời
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Cảm nhận sự hiện diện của đồng nghiệp. Đi lại gần để nói chuyện
              ngay lập tức. Giảm thiểu những cuộc họp lên lịch cứng nhắc và mệt
              mỏi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={onJoin}
                className="px-8 py-3.5 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-700 hover:-translate-y-0.5 transition-all shadow-xl shadow-teal-200 dark:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 text-lg"
              >
                Tạo không gian
              </button>
              <button
                onClick={onJoin}
                className="px-8 py-3.5 rounded-full bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 hover:border-slate-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 text-lg flex items-center justify-center gap-2"
              >
                <span className="w-6 h-6 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-300">
                  ▶
                </span>
                Xem demo
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-xl lg:max-w-full relative">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10 animate-blob"></div>
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10 animate-blob animation-delay-2000"></div>

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900 border border-slate-100 dark:border-gray-700 overflow-hidden aspect-[4/3] transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div
                className="absolute inset-0 bg-slate-50 dark:bg-gray-900"
                style={{
                  backgroundImage:
                    "radial-gradient(#94a3b8 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                  opacity: 0.2,
                }}
              ></div>

              <div className="absolute top-8 left-8 right-32 bottom-24 border-2 border-dashed border-teal-200 dark:border-teal-800 rounded-xl bg-teal-50/50 dark:bg-teal-900/20 flex items-center justify-center">
                <span className="text-teal-300 dark:text-teal-500 font-bold text-2xl uppercase tracking-widest opacity-50 select-none">
                  Khu vực làm việc
                </span>
              </div>
              <div className="absolute bottom-6 right-6 w-48 h-32 bg-orange-50/80 dark:bg-orange-900/20 border-2 border-orange-100 dark:border-orange-900/50 rounded-lg flex items-center justify-center">
                <span className="text-orange-300 dark:text-orange-600 font-bold uppercase text-xs">
                  Pantry
                </span>
              </div>

              <div className="absolute top-1/3 left-1/4 flex flex-col items-center gap-1 animate-bounce-slow">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-white font-bold">
                    L
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"
                    aria-label="Online"
                  ></div>
                </div>
                <span className="bg-black/75 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Lan (Design)
                </span>
                <span className="absolute -top-8 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-200 text-xs px-2 py-1 rounded-lg shadow-sm whitespace-nowrap animate-fade-in-up">
                  Review xong chưa?
                </span>
              </div>

              <div className="absolute top-1/3 left-[40%] flex flex-col items-center gap-1 animate-bounce-slow animation-delay-1000">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-white font-bold">
                    H
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>
                <span className="bg-black/75 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Hùng (Dev)
                </span>
              </div>

              <div className="absolute bottom-10 right-12 flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-white font-bold opacity-80">
                    M
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full"
                    aria-label="Busy"
                  ></div>
                </div>
                <span className="bg-black/75 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Minh (Đang họp)
                </span>
              </div>

              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-md font-medium border border-green-200 dark:border-green-800">
                  Trò chuyện
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-md font-medium border border-blue-200 dark:border-blue-800">
                  Review thiết kế
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
