'use client'

const FOOTER_LINKS = {
  "Sản phẩm": ["Tính năng", "Bảo mật", "Tải xuống", "Khách hàng"],
  "Tài nguyên": ["Blog", "Hướng dẫn", "Trợ giúp", "Cộng đồng"],
  "Công ty": ["Về chúng tôi", "Tuyển dụng", "Liên hệ", "Pháp lý"],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-black text-slate-400 py-12 border-t border-slate-800 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1">
            <div className="flex items-center gap-2 text-white mb-4">
              <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center font-bold text-xs">
                G
              </div>
              <span className="font-bold text-lg">The Gathering</span>
            </div>
            <p className="text-sm">
              Kết nối đội nhóm từ xa bằng không gian ảo sống động.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-bold mb-4">{title}</h4>
              <ul className="space-y-2 text-sm">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>
            &copy; {new Date().getFullYear()} The Gathering Inc. Bảo lưu mọi
            quyền.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">
              Điều khoản
            </a>
            <a href="#" className="hover:text-white">
              Riêng tư
            </a>
            <a href="#" className="hover:text-white">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
