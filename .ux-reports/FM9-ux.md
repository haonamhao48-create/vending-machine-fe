# Test UX/UI FM9 (9.1–9.4, trên mock) — 13/11/2026 15:50

Worktree `.claude/worktrees/fe-fm9`, nhánh `feature/fe-fm9-reports-polish` @ `0924205`, **cộng thay đổi chưa commit** của agent song song ở `src/admin/revenue.ts`, `RevenueReportPage.tsx`, `src/api/mock/revenue.ts`, `revenue-reports.d.ts`, `api-contract/drafts/revenue-reports.yaml` (kết quả dưới đây là của cây làm việc lúc 15:20–15:50). 9.5 bị chặn (chờ API thật), không test.
Trình duyệt: Edge (Playwright 1.65, `channel: msedge`), `PW_PORT=5955`, locale vi-VN, múi giờ Asia/Ho_Chi_Minh.

Bằng chứng (đều trong `apps/web/.ux-reports/fm9/`):
- `suite/ux-summary.md`, `suite/screenshots/*.png`: ảnh + axe + cuộn ngang của bộ e2e dự án (revenue-report, overview, landing, kiosk 1280×800, incident-report 390, forbidden, login, orders, kit, alerts…).
- `shots/*.png`, `shots/r1-print.pdf`, `extra-log.jsonl`, `perf-log.jsonl`: kiểm tra bổ sung của tester (`fm9-extra.spec.ts`, `focus-date.spec.ts`, `landing-img.spec.ts`, `perf.spec.ts`; chạy bằng `npx playwright test -c .ux-reports/fm9/pw.config.ts`).

## Bảng 8 bước

| Bước | Kết quả | Ghi chú |
| --- | --- | --- |
| 1. lint, test, build | **Đạt** | `npm run lint` exit 0, 0 lỗi, 12 cảnh báo (baseline 14). `npm test` 463/463. `npm run build` pass, `check-dist`: "dist không chứa mã mock và không còn CSS cũ". (Không dùng `h.mjs regress` theo yêu cầu.) |
| 2. Luồng Playwright ADMIN/STAFF | **Đạt** | Toàn bộ bộ e2e: 279/282 pass lần 1; 3 test hỏng đều ở `alerts.spec.ts` (FM6), chạy lại nhóm alerts + revenue-report + landing + overview + incident-report + kiosk + visual + shell: **64/64 pass** → chập chờn, không liên quan FM9 (xem T5). STAFF: không có mục Báo cáo, mở thẳng URL bị chặn trước khi gọi API, Tổng quan không có khối Doanh thu (test pass). |
| 3. Ảnh 1440/768/390 sáng/tối; kiosk 1280×800 | **Đạt** | 80 lần kiểm trong bộ dự án + 30 lần bổ sung (404, R1 theo giờ, R1 các trạng thái 390, O1 3 khổ, 7 trang admin ở 390): **0 cuộn ngang**. Kiosk 13 màn 1280×800 không vỡ sau khi chuyển CSS (`kiosk-catalog-1280x800-light.png`). |
| 4. Trạng thái loading/rỗng/lỗi/403/401/400/409 | **Đạt** | R1: đang tải (`r1-loading-*.png`), rỗng có nút "Xem 30 ngày qua", 500 có Thử lại, 403 trang Không có quyền, 401 về `/login?next=`, khoảng ngày sai báo ngay không gọi API (400 phía client), 400 máy chủ gắn lỗi vào bộ lọc (code `RevenueReportPage.tsx:78-80,148`), chưa có API (missing) nói rõ BE 6.1. O1: khối Doanh thu lỗi riêng có Thử lại, 403 giải thích quyền (`o1-block-403-*.png`), missing nói rõ. 409 không áp dụng (màn chỉ đọc). |
| 5. axe + bàn phím | **Đạt** (có lỗi Thấp) | axe WCAG 2.0/2.1 A+AA: 0 vi phạm ở mọi lần quét (bộ dự án 80 + bổ sung 30). Bàn phím R1: 13 điểm dừng trong nội dung, nút/select có vòng focus; điểm dừng thứ 2 của ô ngày (nút lịch) không có vòng ring (T2). Landing: skip link, menu mobile, Esc trả focus, FAQ bằng Enter (test pass). |
| 6. Nội dung "hộp"/"ngăn", tiền, giờ | **Đạt** (lưu ý T1) | Tiền `937.500 ₫`, `17.500 ₫`; giờ "Lập lúc 13/11/2026 15:39 (giờ Việt Nam)"; ngày bảng `07/11/2026`; cột "Số hộp". Riêng ô `<input type=date>` hiển thị theo ngôn ngữ trình duyệt (`11/07/2026` trên Edge tiếng Anh) – T1. |
| 7. Tiêu chí xong | **Đạt 3/4, 9.3 chưa đo trực tiếp** | Xem bảng dưới. |
| 8. Bạn duyệt rồi gộp PR | Chờ người dùng | Không có lỗi mức Cao. |

## Tiêu chí xong

| Issue | Tiêu chí | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
| 9.1 | Số trên màn khớp file CSV | **Đạt** | `revenue-report.spec.ts` "Tiêu chí xong 9.1": tải CSV thật, so từng ô dòng Tổng với 8 ô số, 7 dòng ngày, 4 dòng sản phẩm → pass. Lọc 1 sản phẩm: tên file có SKU (`doanh-thu_2026-10-15_2026-11-13_DEV-MANGO.csv`), không có cảnh báo "không khớp" (`extra-log.jsonl` r1-product). Tự cộng trên ảnh `revenue-report-1440-light.png`: 33 đơn = 8+8+7+10; 34 hộp = 9+8+7+10; tiền hoàn 130.000 = 80.000+50.000 = 40+25+40+25 nghìn theo ngày. |
| 9.1 | Tách tiền giảm và tiền hoàn | **Đạt** (trên mock) | Ô "Tiền giảm 17.500 ₫" và "Tiền hoàn 130.000 ₫" riêng, cột riêng trong cả 2 bảng và CSV; giá gốc − giảm = khách trả, khách trả − hoàn = thực thu (test kiểm). Lọc Mixed fruit bowl: giảm 17.500 ₫, hoàn 0 ₫; Mango: giảm 0 ₫, hoàn 80.000 ₫. Lỗi đã biết, không tính lại: tiền hoàn chưa lấy từ bản ghi hoàn tiền FM8. |
| 9.2 | Số doanh thu khớp màn Báo cáo | **Đạt** | Test "Tiêu chí xong 9.2": 5 số (thực thu, số đơn, khách trả, giảm, hoàn) của "Hôm nay" và "7 ngày qua" bằng đúng ô tương ứng ở R1 mở qua link → pass. Ảnh `o1-block-light-1440.png`/`o1-block-dark-390.png`: 7 ngày 937.500 ₫ = R1; hôm nay 175.000 ₫ = dòng 13/11/2026 của R1. |
| 9.3 | Lighthouse hiệu năng và truy cập ≥ 90 | **Chưa kiểm được trực tiếp** | Không chạy được Lighthouse (lệnh tải `lighthouse` từ npm bị chặn quyền). Đo thay thế trên bản build (`vite preview`), giả lập mobile CPU ×4 + 150 ms RTT 1,6 Mbps: FCP 1,40 s, LCP 2,16 s, CLS 0, TBT ≈ 60 ms, 294 KB (`perf-log.jsonl`) → ước tính hiệu năng ≥ 90; desktop LCP 0,18 s. Truy cập: axe 0 vi phạm ở 1440/768/390 sáng/tối. Commit `8c866af` ghi Lighthouse 92 mobile / 100 desktop, truy cập 100 – cần người dùng chạy Lighthouse trong Edge DevTools để xác nhận. |
| 9.4 | Không còn class a-* | **Đạt** | grep `src` không còn `a-*` (bỏ aria-/data-); `tests/legacy-css.test.mjs` pass; `src` chỉ còn `index.css`, `styles/app.css`. |
| 9.4 | Build không còn file CSS cũ | **Đạt** | `dist/assets` chỉ có `index-*.css` và `AdminApp-*.css` (font Inter); `check-dist` không thấy `admin/App/LandingPage/PurchasePage*.css`, `.a-*`, `.route-message`. Hồi quy giao diện: admin shell h1 24px/h2 16px ở 7 trang, nút dùng Inter (`extra-log.jsonl` shell), 0 cuộn ngang ở 390; kiosk, báo sự cố 390, 404, login không vỡ. |

## Lỗi

### Cao
Không có.

### Vừa

**V1. "In / Lưu PDF" ở khổ A4 mất 3 cột Giá gốc, Số hộp, Số đơn hoàn trong cả hai bảng.**
- Tái hiện: `/admin/reports/revenue` → In / Lưu PDF (A4 dọc). Ảnh `shots/r1-print.png` (giả lập in, rộng 1000px): bảng ngày và bảng sản phẩm chỉ còn 6 cột; ở màn 1440 có 9 cột. Vùng nội dung A4 ≈ 700–720px rơi đúng vào khoảng ẩn cột phụ. Ô tổng vẫn có đủ 8 số, nhưng file PDF ít số theo ngày/sản phẩm hơn màn và CSV.
- Code nghi ngờ: `src/components/ui/data-table.tsx:25` `SECONDARY = '@min-[681px]:@max-[1023px]:hidden'`; `RevenueReportPage.tsx:33-34` đánh dấu `grossAmount, quantity, refundCount` là cột phụ. Gợi ý: thêm `print:table-cell` cho cột phụ (hoặc bỏ `secondary` khi in).

### Thấp

- **T1. Ô ngày hiện theo ngôn ngữ trình duyệt.** Trên Edge tiếng Anh, "Từ ngày" hiện `11/07/2026` (tháng/ngày), trái quy ước `09/11/2026` và dễ đọc nhầm thành 11 tháng 7. Dòng phạm vi ngay dưới đã ghi đúng "Từ 07/11/2026 đến 13/11/2026", nên vẫn đọc được. Ảnh `shots/date-focus-2.png`; `RevenueReportPage.tsx:116-121` (`<Input type="date">`). Cách khắc phục là thêm dòng hiển thị ngày dạng dd/MM/yyyy cạnh ô hoặc dùng bộ chọn ngày riêng.
- **T2. Nút lịch trong ô ngày không có vòng focus ring.** Tab vào ô ngày cho hai điểm dừng. Ở điểm dừng thứ hai (biểu tượng lịch), `:focus-visible` của input là false nên ring không hiện, chỉ còn viền mảnh mặc định của trình duyệt. Ảnh `shots/date-focus-2.png`, log `focus-date.spec.ts`. Vị trí: `src/components/ui/input.tsx:4` (thử `focus-within:` ring).
- **T3. CSS kiosk chỉ được chuyển chỗ, chưa dọn.** Khoảng 150 dòng `buy-*` trước ở `PurchasePage.css` nay nằm trong `src/index.css`, là CSS toàn cục tải ở mọi trang kể cả landing. Tiêu chí 9.4 vẫn đạt theo câu chữ, và DESIGN.md ghi đây là ngoại lệ có chủ đích. Nên chuyển sang utility ở milestone sau.
- **T4. Trang 404 còn sơ sài (có từ trước 9.4, không phải hồi quy).** h1 cùng cỡ với chữ thân, link chỉ dùng outline mặc định, theme tối vẫn nền trắng. Đã so với CSS cũ `.route-message`: h1 trước đây cũng không có cỡ chữ riêng. Ảnh `shots/404-*.png`.
- **T5. Hạ tầng test chập chờn.** (a) Trong lần chạy đầy đủ, 3 test `alerts.spec.ts` (đếm chuông sau polling, trả focus, ghi "Xác nhận") hỏng rồi pass khi chạy lại; có thể do Vite reload khi agent song song sửa file. (b) `global-setup.ts` xóa `e2e-report/` dùng chung, nên một lần chạy Playwright khác trong cùng worktree đã xóa ảnh và dữ liệu giữa chừng: `ux-summary.md` lần 1 thiếu revenue-report, landing, incident-report. Lần chạy lại đủ ảnh.
- **T6. Ảnh landing full-page trong bộ e2e trống khung ảnh "Hợp tác".** Ảnh lazy chưa giải mã lúc chụp. Trang thật vẫn tải ảnh đủ (1448px, `shots/landing-hop-tac-1440.png`), nên đây chỉ là lỗi ở bằng chứng. Vị trí: `e2e/landing.spec.ts` `ready()` cuộn lên đầu ngay sau khi cuộn tới ảnh lazy.

## Kết luận

**Đạt để gộp** (không có lỗi Cao). Số lỗi: Cao 0, Vừa 1, Thấp 6. Điều kiện đi kèm:
- Tiêu chí 9.3 cần người dùng chạy Lighthouse thật để xác nhận.
- Phải chạy lại `revenue-report.spec.ts` sau khi agent song song commit phần tiền hoàn/CSV.
