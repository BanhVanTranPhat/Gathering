'use client'

import { USE_CASES } from "../constants";

export default function UseCasesSection() {
  return (
    <section
      id="use-cases"
      className="py-20 bg-slate-50 dark:bg-gray-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Một nền tảng, vô vàn ứng dụng
          </h2>
          <p className="text-slate-600 dark:text-gray-400">
            Linh hoạt cho mọi nhu cầu gặp gỡ của doanh nghiệp.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {USE_CASES.map((useCase, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-slate-100 dark:border-gray-700 group"
            >
              <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg inline-block group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                {useCase.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {useCase.title}
              </h3>
              <p className="text-slate-600 dark:text-gray-400">
                {useCase.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
