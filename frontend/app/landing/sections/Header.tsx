'use client'

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "../constants";

interface HeaderProps {
  isScrolled: boolean;
  onJoin: () => void;
}

export default function Header({ isScrolled, onJoin }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm dark:shadow-gray-800" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="shrink-0 flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              G
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
              The Gathering
            </span>
          </div>

          <nav className="hidden md:flex space-x-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-md px-2 py-1"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={onJoin}
              className="text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-md px-3 py-2"
            >
              Đăng nhập
            </button>
            <button
              onClick={onJoin}
              className="bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-teal-700 dark:hover:bg-teal-500 transition-colors shadow-lg shadow-teal-200 dark:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600"
            >
              Tạo không gian
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700 absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-gray-200 hover:text-teal-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700 flex flex-col gap-2">
              <button
                onClick={() => { onJoin(); setMobileMenuOpen(false); }}
                className="w-full text-center px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => { onJoin(); setMobileMenuOpen(false); }}
                className="w-full text-center px-3 py-2 rounded-md text-base font-medium bg-teal-600 text-white hover:bg-teal-700"
              >
                Tạo không gian
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
