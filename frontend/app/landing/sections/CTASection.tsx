'use client'

interface CTASectionProps {
  onJoin: () => void;
}

const STEPS = [
  "Chọn mẫu không gian (2 phút)",
  "Mời đội nhóm (1 click)",
  "Bắt đầu ngay",
];

export default function CTASection({ onJoin }: CTASectionProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-teal-600 to-emerald-700 dark:from-teal-900 dark:to-emerald-900 text-white text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          30 ngày đầu miễn phí
        </h2>
        <p className="text-xl text-teal-100 dark:text-teal-200 mb-10">
          Không cần thẻ tín dụng. Không phí thiết lập ẩn. Hủy bất cứ lúc nào.
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-12 text-teal-100 dark:text-teal-200 text-sm font-medium">
          {STEPS.map((step, idx) => (
            <div key={idx} className="contents">
              {idx > 0 && (
                <div className="hidden md:block w-12 h-px bg-teal-400/50"></div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white text-teal-600 dark:text-teal-900 flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>
                {step}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onJoin}
          className="bg-white text-teal-700 dark:bg-teal-500 dark:text-white text-lg font-bold px-10 py-4 rounded-full hover:bg-teal-50 dark:hover:bg-teal-400 transition-colors shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-900 focus-visible:ring-offset-2"
        >
          Tạo không gian ngay
        </button>
      </div>
    </section>
  );
}
