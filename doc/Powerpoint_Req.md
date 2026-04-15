Chương 3. Kỹ thuật lấy yêu cầu và tài liệu SRS
(Requirements Engineering and Software Requirements Specification)
3.1. Tổng quan về kỹ thuật lấy yêu cầu (Requirements Engineering)
Requirements Engineering (RE) là quá trình xác định, phân tích, ghi chép, xác minh và
quản lý các yêu cầu đối với hệ thống phần mềm. Đây là một trong những giai đoạn cốt lõi
và quan trọng nhất của chu trình phát triển phần mềm (SDLC), bởi mọi sai sót trong yêu
cầu đều có thể lan truyền và gây lỗi nghiêm trọng ở các pha sau.
Mục tiêu của giai đoạn này là:
• Đảm bảo rằng phần mềm được phát triển đúng nhu cầu của khách hàng và người
dùng.
• Chuyển đổi ý tưởng hoặc vấn đề thực tế thành tài liệu yêu cầu có thể kiểm chứng
được.
• Tạo nền tảng cho thiết kế, kiểm thử và đánh giá sản phẩm.
3.2. Phân loại các loại yêu cầu
Trong kỹ thuật lấy yêu cầu, cần phân biệt rõ bốn cấp độ yêu cầu chính:
Loại yêu cầu Business
Requirements
User
Requirements
System
Requirements
Software
Requirements
Mô tả Các mục tiêu chiến lược hoặc
vấn đề kinh doanh cần giải
quyết.
Nhu cầu và mong muốn của
người dùng cuối.
Các đặc tả chức năng và phi
chức năng của hệ thống.
Công cụ & kỹ thuật thu thập
Phỏng vấn lãnh đạo, phân tích
SWOT, tài liệu kế hoạch doanh
nghiệp.
Khảo sát, quan sát, Workshop, User
Stories, Personas.
Use Case Diagram, Sequence
Diagram, UML.
Chi tiết kỹ thuật cụ thể được mô
tả trong tài liệu SRS.
Đặc tả chi tiết chức năng, API, giao
diện, ràng buộc kỹ thuật.
19
3.3. Quy trình kỹ thuật lấy yêu cầu (Requirements Process)
Bước 1: Elicitation (Thu thập yêu cầu)
• Gặp gỡ và trao đổi với các bên liên quan.
• Sử dụng kỹ thuật phỏng vấn, khảo sát, hoặc mô phỏng quy trình.
• Ghi nhận các nhu cầu, mong muốn và vấn đề của người dùng.
Bước 2: Analysis (Phân tích yêu cầu)
• Phân loại và sắp xếp yêu cầu theo nhóm chức năng và phi chức năng.
• Xác định mối quan hệ phụ thuộc, mâu thuẫn, hoặc trùng lặp giữa các yêu cầu.
• Xây dựng mô hình Use Case hoặc Context Diagram để minh họa phạm vi hệ thống.
Bước 3: Specification (Đặc tả yêu cầu)
• Ghi lại yêu cầu trong tài liệu Software Requirements Specification (SRS).
• Mỗi yêu cầu cần rõ ràng, đo lường được và có thể kiểm chứng.
Bước 4: Validation (Thẩm định yêu cầu)
• Kiểm tra xem yêu cầu có phản ánh đúng nhu cầu của người dùng không.
• Tổ chức các buổi Review hoặc Walkthrough với khách hàng.
• Sử dụng mô hình Prototype hoặc Wireframe để xác minh.
Bước 5: Management (Quản lý yêu cầu)
• Lưu trữ, theo dõi và cập nhật yêu cầu trong suốt vòng đời dự án.
• Quản lý thay đổi (Change Request) thông qua công cụ như Jira, Trello, hoặc DOORS.
3.4. Cấu trúc chuẩn của tài liệu SRS (IEEE 830)
Tài liệu Software Requirements Specification (SRS) là nền tảng cho giai đoạn thiết kế và
phát triển. Theo chuẩn IEEE 830, cấu trúc SRS bao gồm:
Phần 1: Giới thiệu (Introduction)
• Mục đích của tài liệu.
• Phạm vi dự án (Scope).
20
• Định nghĩa thuật ngữ, viết tắt và tài liệu tham khảo.
Phần 2: Tổng quan hệ thống (Overall Description)
• Bối cảnh hệ thống (System Context).
• Môi trường hoạt động (Operational Environment).
• Giả định và ràng buộc (Assumptions and Constraints).
Phần 3: Các yêu cầu cụ thể (Specific Requirements)
• Functional Requirements: Mô tả chi tiết từng chức năng phần mềm (theo Use
Case).
• Non-functional Requirements:
o Hiệu suất (Performance).
o Bảo mật (Security).
o Tính sẵn sàng (Availability).
o Khả năng mở rộng (Scalability).
o Dễ sử dụng (Usability).
• External Interface Requirements: Giao diện với người dùng, hệ thống khác, phần
cứng hoặc API.
Phần 4: Phụ lục và tham khảo
• Mẫu biểu, bảng thuật ngữ, biểu đồ UML hoặc dữ liệu mô phỏng.
3.5. Kỹ thuật thu thập và đặc tả yêu cầu phổ biến
Kỹ thuật Mô tả Ứng dụng trong Capstone
Project
Use Case Modeling
Dùng để xác định các chức
năng chính của phần mềm.
User Story &
Acceptance Criteria
Mô tả hành vi người dùng và hệ
thống qua biểu đồ Use Case.
Đặc tả yêu cầu theo định dạng “As
a [role], I want [feature], so that
[benefit]”.
Dùng trong phương pháp
Agile/Scrum.
21
Kỹ thuật Mô tả Ứng dụng trong Capstone
Project
Prototyping
Tạo mô hình mẫu giao diện hoặc
chức năng.
Dùng để xác minh yêu cầu và
thu hồi phản hồi sớm.
Context Diagram
Biểu đồ xác định ranh giới hệ thống
và các tác nhân bên ngoài.
Giúp định nghĩa phạm vi của
phần mềm.
Requirement
Traceability Matrix
(RTM)
Liên kết từng yêu cầu với mục tiêu
và test case tương ứng.
Dùng để đảm bảo kiểm soát
và kiểm thử đầy đủ.
3.6. Ví dụ minh họa: Tài liệu SRS cho Hệ thống Quản lý Thư viện Số
(Digital Library System)
1. Giới thiệu:
• Mục đích: Xây dựng hệ thống quản lý sách, mượn/trả, và tra cứu tài liệu trực tuyến.
• Phạm vi: Cung cấp chức năng cho sinh viên, thủ thư, và quản trị viên.
2. Yêu cầu chức năng (Functional Requirements):
• FR1: Người dùng có thể đăng ký tài khoản và đăng nhập.
• FR2: Sinh viên có thể tìm kiếm và mượn sách.
• FR3: Thủ thư có thể thêm/xóa/sửa thông tin sách.
• FR4: Hệ thống gửi thông báo nhắc hạn trả sách qua email.
3. Yêu cầu phi chức năng (Non-Functional Requirements):
• NFR1: Thời gian phản hồi của hệ thống < 2 giây.
• NFR2: Dữ liệu được sao lưu tự động hàng ngày.
• NFR3: Hệ thống hỗ trợ 1.000 người dùng đồng thời.
4. Ràng buộc:
• Hệ thống phải hoạt động trên nền tảng Web và tương thích trình duyệt Chrome,
Edge, Firefox.
22
3.7. Mối liên hệ giữa SRS và các pha sau của dự án
• SRS → SDS (Software Design Specification): Cung cấp thông tin đầu vào cho thiết
kế kiến trúc và chi tiết phần mềm.
• SRS → Testing: Dùng để xác định tiêu chí kiểm thử (Acceptance Criteria).
• SRS → Project Planning: Giúp ước lượng công việc, thời gian và chi phí phát triển.
3.8. Lỗi thường gặp trong quá trình lấy yêu cầu
1. Yêu cầu không rõ ràng hoặc mâu thuẫn.
2. 3. 4. 5. Bỏ qua các yêu cầu phi chức năng.
Không cập nhật tài liệu khi có thay đổi.
Thiếu sự tham gia của người dùng cuối.
Mô tả yêu cầu ở mức quá trừu tượng hoặc quá chi tiết.
3.9. Kết luận chương 3
Kỹ thuật lấy yêu cầu là xương sống của mọi dự án phần mềm. Một tài liệu SRS tốt không chỉ
mô tả chính xác “phần mềm cần làm gì”, mà còn đảm bảo mọi bên liên quan có cùng hiểu
biết chung về hệ thống.
Trong đồ án Capstone, sinh viên cần coi SRS là “hợp đồng kỹ thuật” giữa nhóm phát triển và
giảng viên phản biện – nền tảng vững chắc để bước sang giai đoạn thiết kế kiến trúc phần
mềm trong chương tiếp theo.
23