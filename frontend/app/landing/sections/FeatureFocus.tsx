'use client'

const FOCUS_CARDS = [
  { title: "Chế độ tối giản", icon: "✨" },
  { title: "Kiểm soát âm thanh", icon: "🔊" },
  { title: "Trạng thái tự động", icon: "🔴" },
];

export default function FeatureFocus() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row-reverse items-center gap-16">
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wide text-sm mb-2">
                Giảm xao nhãng
              </h2>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Làm việc sâu mà không bị cô lập
              </h3>
              <p className="text-slate-600 dark:text-gray-400 text-lg">
                Cần tập trung? Bước vào khu vực "Focus Zone". Bạn vẫn hiện diện
                với đồng nghiệp nhưng thông báo và âm thanh sẽ được tắt tự động.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FOCUS_CARDS.map((card, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 text-center hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-gray-200">
                    {card.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-3xl transform -rotate-2"></div>
            <div className="relative bg-slate-900 dark:bg-black rounded-2xl shadow-2xl p-6 border border-slate-800 text-white">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="text-sm font-mono text-slate-400">
                    Trạng thái: Đừng làm phiền
                  </div>
                </div>
                <div className="h-6 w-12 bg-slate-700 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="h-32 flex items-center justify-center border border-dashed border-slate-700 rounded-lg bg-slate-800/50">
                <span className="text-slate-500 text-sm">
                  Không có thông báo mới
                </span>
              </div>
              <div className="mt-6 flex gap-3">
                <div className="h-2 w-full bg-slate-700 rounded overflow-hidden">
                  <div className="h-full w-2/3 bg-teal-500"></div>
                </div>
                <span className="text-xs text-teal-400">Đang code...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
