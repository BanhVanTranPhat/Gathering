'use client'

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQS } from "../constants";

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
      <button
        className="w-full flex justify-between items-center p-4 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-left focus:outline-none focus:bg-slate-100 dark:focus:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-slate-900 dark:text-gray-200">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="p-4 text-slate-600 dark:text-gray-400 text-sm leading-relaxed border-t border-slate-100 dark:border-gray-800">
          {answer}
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  return (
    <section
      id="resources"
      className="py-20 bg-white dark:bg-gray-900 transition-colors"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
          Câu hỏi thường gặp
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <AccordionItem
              key={idx}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
