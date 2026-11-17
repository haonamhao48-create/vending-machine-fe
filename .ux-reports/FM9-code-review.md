# FM9 code review (9.1, 9.2, 9.3) — 2026-11-13

Phạm vi: `git diff 41acc55 9bfa586` + phần giải xung đột trong b825a64. Kết luận: 0 Cao, 2 Vừa, 5 Thấp.

## Cao
Không có.

## Vừa
- **V1** Mock doanh thu không đọc `store.refunds` của FM8 (`src/api/mock/revenue.ts:22-26, 88-93`, `mockRefundedAt` = paidAt + 30'). Ghi hoàn hôm nay cho đơn cũ → báo cáo đặt tiền hoàn vào ngày thanh toán; O1 "Hôm nay" báo 0 ₫. Sửa: lấy `refundedAt`/`amount` từ `store.refunds` (chỉ hoàn của đơn có doanh thu), cập nhật Q2 draft trỏ `refunds.yaml`, ghi rõ không gồm hoàn PAYMENT_LATE/DUPLICATE, thêm test.
- **V2** CSV dấu phẩy có thể dồn một cột trên Excel vùng vi-VN; ngày `12/11/2026` có thể bị đảo (`src/admin/revenue.ts:239, 247-270`). Cần kiểm trên máy đích; cách sửa: ngày ISO, hoặc `;`/TSV UTF-16LE, hoặc ghi chú Data > From Text.

## Thấp
- **T1** Chặn công thức CSV chưa phủ khoảng trắng đầu (`revenue.ts:235`).
- **T2** Nhánh `refreshError` ở R1 không bao giờ chạy (`RevenueReportPage.tsx:172`).
- **T3** Nút Làm mới ở O1 không quay khi khối Doanh thu đang tải (`OverviewPage.tsx:45`).
- **T4** Thiếu test biên ngày giờ VN (16:59:59Z / 17:00:00Z, giờ 23/0).
- **T5** Lighthouse 9.3 chưa lưu báo cáo vào `.ux-reports/`.

## Đạt
Công thức gộp − giảm = khách trả − hoàn = thực thu; biên ngày VN; quyền REPORT_READ (STAFF 0 request); chỉ gửi field draft; đủ trạng thái; bộ lọc URL; race khi đổi lọc; CSV khớp màn; a11y biểu đồ/bảng; giải xung đột b825a64 đúng; landing không có vấn đề.
