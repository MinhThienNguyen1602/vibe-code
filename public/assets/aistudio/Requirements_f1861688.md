Hãy đóng vai một kỹ sư Frontend chuyên xây dựng học liệu Toán học tương tác. Hãy tạo cho tôi ứng dụng web một trang mang tên **"Bàn Cờ Phân Số & Tỉ Lệ" (Fraction & Area Grid Explorer)** chạy hoàn toàn ở phía client (không dùng API ngoài, dùng HTML5, CSS thuần và Vanilla JavaScript).

### 1. Yêu cầu kiến trúc & Tách file (Quan trọng)
- Xuất ra mã nguồn tách biệt rõ ràng thành **2 file riêng biệt**: `index.html` và `style.css` (liên kết qua thẻ `<link rel="stylesheet" href="style.css">`). Không dùng Tailwind CSS hay các thư viện CSS nhúng inline để tôi dễ dàng tích hợp ứng dụng này thành một module trong trang web lớn sau này.
- Toàn bộ giao diện ứng dụng bọc trong một container gốc có class `.fraction-explorer-app` và tiền tố class CSS rõ ràng (ví dụ `.fe-...`) để tránh xung đột style với trang web mẹ.
- Code JavaScript viết theo hướng module/hàm thuần túy (tách bạch logic tính toán phân số với logic render giao diện SVG/DOM) và đặt gọn trong thẻ `<script>` ở cuối `index.html`.

### 2. Luồng tương tác (Input -> Output)
- **Khu vực điều khiển (Input):**
  1. Hai thanh trượt (slider) điều chỉnh **Mẫu số 1** (chia hình vuông lớn thành $b$ cột dọc, giá trị từ 1 đến 12) và **Mẫu số 2** (chia hình vuông lớn thành $d$ hàng ngang, giá trị từ 1 đến 12).
  2. Hai bộ điều khiển chọn **Tử số 1** ($a$, từ $0$ đến $b$) và **Tử số 2** ($c$, từ $0$ đến $d$), cho phép người dùng vừa kéo thanh trượt/bấm nút tăng giảm, vừa có thể **click trực tiếp lên các cột hoặc hàng trên bàn cờ** để bật/tắt việc tô màu.
  3. Các nút chuyển chế độ hiển thị lớp màu: *Chỉ xem Phân số 1*, *Chỉ xem Phân số 2*, và *Chồng hai lớp (Phép nhân)*.
  4. Nút "Đặt lại" (Reset).

- **Khu vực hiển thị trực quan & Kết quả (Output):**
  1. **Bàn cờ hình vuông đơn vị (SVG tương tác):** Vẽ sắc nét lưới $b \times d$ ô vuông.
     - Các cột được chọn của phân số 1 tô màu xanh dương bán trong suốt (`rgba(59, 130, 246, 0.45)`).
     - Các hàng được chọn của phân số 2 tô màu vàng/cam bán trong suốt (`rgba(245, 158, 11, 0.45)`).
     - Vùng giao nhau của hai lớp màu tự động nổi bật thành màu xanh lá đậm kèm viền nhấn mạnh để học sinh thấy rõ phần diện tích chung.
  2. **Bảng phân tích toán học thời gian thực:**
     - Hiển thị trực quan phép nhân hai phân số: $\frac{a}{b} \times \frac{c}{d} = \frac{a \times c}{b \times d}$ (kèm dạng phân số tối giản nếu rút gọn được).
     - Hiển thị số lượng ô giao nhau trên tổng số ô của lưới (ví dụ: *6 / 20 ô vuông nhỏ*).
     - Quy đổi sang **Số thập phân** và **Tỉ số phần trăm (%)** diện tích vùng giao nhau so với toàn bộ hình vuông lớn.
     - Một hộp giải thích ngắn gọn tự động cập nhật theo thông số hiện tại để hỗ trợ giáo viên giảng bài.

### 3. Yêu cầu thẩm mỹ & Trải nghiệm
- Giao diện hiện đại, sáng sủa, thân thiện với môi trường giáo dục (bố cục 2 cột trên màn hình lớn: bên trái là Bàn cờ SVG, bên phải là Bảng điều khiển & Kết quả; tự động xếp dọc trên màn hình nhỏ).
- Có hiệu ứng chuyển động mượt mà (CSS transition) khi thay đổi số đường chia hoặc tô màu ô.