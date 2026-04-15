'use client'

import {
  Building2,
  UserPlus,
  Heart,
  Presentation,
  GraduationCap,
  Globe,
} from "lucide-react";

import type {
  NavItem,
  ComparisonPoint,
  UseCase,
  Testimonial,
  FAQItem,
} from "./types";

const ICON_CLASS = "w-8 h-8 text-teal-600 dark:text-teal-400";

export const NAV_ITEMS: NavItem[] = [
  { label: "Sản phẩm", href: "#product" },
  { label: "Trường hợp dùng", href: "#use-cases" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Tài nguyên", href: "#resources" },
];

export const COMPARISON_OLD: ComparisonPoint[] = [
  { text: "Gửi link họp và chờ đợi" },
  { text: "Giao tiếp rời rạc qua chat" },
  { text: "Mệt mỏi vì phải bật camera liên tục" },
  { text: "Không biết đồng nghiệp đang bận hay rảnh" },
  { text: "Không gian làm việc tĩnh, nhàm chán" },
];

export const COMPARISON_NEW: ComparisonPoint[] = [
  { text: "Đi lại gần để nói chuyện ngay lập tức" },
  { text: "Thấy trạng thái rảnh/bận qua avatar" },
  { text: "Không bắt buộc bật camera, dùng avatar" },
  { text: "Cảm giác thuộc về một đội nhóm thực sự" },
  { text: "Tùy biến văn phòng theo sở thích" },
];

export const USE_CASES: UseCase[] = [
  {
    title: "Văn phòng ảo",
    desc: "Thay thế văn phòng vật lý, làm việc từ xa nhưng vẫn gắn kết.",
    icon: <Building2 className={ICON_CLASS} />,
  },
  {
    title: "Onboarding",
    desc: "Đào tạo nhân sự mới trực quan, dễ dàng hòa nhập văn hóa.",
    icon: <UserPlus className={ICON_CLASS} />,
  },
  {
    title: "Team Bonding",
    desc: "Tổ chức game, tiệc tùng ảo để xả stress cùng nhau.",
    icon: <Heart className={ICON_CLASS} />,
  },
  {
    title: "Workshop",
    desc: "Chia nhóm thảo luận, bảng trắng và thuyết trình hiệu quả.",
    icon: <Presentation className={ICON_CLASS} />,
  },
  {
    title: "Lớp học",
    desc: "Không gian học tập tương tác, không còn cảm giác buồn chán.",
    icon: <GraduationCap className={ICON_CLASS} />,
  },
  {
    title: "Cộng đồng",
    desc: "Tổ chức sự kiện, hội thảo cho hàng trăm người tham gia.",
    icon: <Globe className={ICON_CLASS} />,
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The Gathering đã thay đổi hoàn toàn cách chúng tôi làm việc từ xa. Cảm giác cô đơn biến mất.",
    author: "Nguyễn Văn A",
    role: "CTO",
    company: "TechStart VN",
  },
  {
    quote:
      "Không còn những cuộc họp vô tận. Cần gì chỉ cần 'đi bộ' qua bàn đồng nghiệp hỏi là xong.",
    author: "Trần Thị B",
    role: "Product Manager",
    company: "Creative Studio",
  },
  {
    quote:
      "Onboarding nhân viên mới chưa bao giờ dễ dàng đến thế. Mọi người hòa nhập rất nhanh.",
    author: "Lê Văn C",
    role: "HR Director",
    company: "Global Corp",
  },
  {
    quote:
      "Giao diện dễ thương, nhẹ nhàng, không gây áp lực như các ứng dụng họp trực tuyến khác.",
    author: "Phạm Thị D",
    role: "Designer",
    company: "ArtWorks",
  },
  {
    quote:
      "Chúng tôi tổ chức Happy Hour mỗi thứ 6 trên The Gathering. Rất vui và gắn kết!",
    author: "Hoàng Văn E",
    role: "Team Lead",
    company: "DevHouse",
  },
  {
    quote:
      "Tính năng âm thanh theo phạm vi thực sự là bước đột phá cho các buổi workshop.",
    author: "Vũ Thị F",
    role: "Agile Coach",
    company: "Innovate Inc",
  },
];

export const FAQS: FAQItem[] = [
  {
    question: "The Gathering có miễn phí không?",
    answer:
      "Có, chúng tôi có gói miễn phí vĩnh viễn cho các đội nhóm nhỏ dưới 10 người. Các tính năng cốt lõi đều được bao gồm.",
  },
  {
    question: "Tôi có cần cài đặt phần mềm không?",
    answer:
      "Không. The Gathering chạy hoàn toàn trên trình duyệt web (Chrome, Firefox, Safari, Edge).",
  },
  {
    question: "Giới hạn số người tham gia là bao nhiêu?",
    answer:
      "Gói Enterprise của chúng tôi hỗ trợ lên đến 500 người cùng lúc trong một không gian sự kiện.",
  },
  {
    question: "Bảo mật dữ liệu như thế nào?",
    answer:
      "Chúng tôi tuân thủ GDPR và sử dụng mã hóa đầu cuối cho tất cả các luồng âm thanh và video.",
  },
  {
    question: "Tôi có thể tùy chỉnh không gian không?",
    answer:
      "Chắc chắn rồi! Chúng tôi cung cấp công cụ Map Maker để bạn tự thiết kế văn phòng, hoặc dùng các mẫu có sẵn.",
  },
  {
    question: "Tính năng âm thanh hoạt động ra sao?",
    answer:
      "Giống như ngoài đời thực, bạn chỉ nghe thấy tiếng của những người đứng gần bạn trong không gian ảo.",
  },
  {
    question: "Có hỗ trợ trên điện thoại không?",
    answer:
      "Hiện tại chúng tôi có bản mobile beta hỗ trợ các tính năng cơ bản như di chuyển và trò chuyện âm thanh.",
  },
  {
    question: "Làm sao để thanh toán?",
    answer:
      "Chúng tôi chấp nhận thẻ tín dụng quốc tế (Visa, Mastercard) và chuyển khoản ngân hàng cho gói doanh nghiệp.",
  },
];
