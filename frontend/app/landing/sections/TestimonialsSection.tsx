'use client'

import { TESTIMONIALS } from "../constants";

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900 overflow-hidden transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
          Được đội nhóm tin dùng để làm việc &quot;có mặt&quot; hơn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700"
            >
              <div className="flex text-yellow-400 mb-4 text-sm">★★★★★</div>
              <p className="text-slate-700 dark:text-gray-300 mb-6 italic">
                &quot;{t.quote}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-600 flex items-center justify-center font-bold text-slate-500 dark:text-gray-300 text-sm">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {t.author}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">
                    {t.role}, {t.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
