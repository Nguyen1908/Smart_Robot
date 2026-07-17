# ESP32_Cam

## Tổng quan

ESP32_Cam là phần module robot điều khiển bằng camera trong dự án Smart_Robot. Nó tích hợp camera, xử lý hình ảnh bằng MediaPipe và giao diện web để cho phép theo dõi, điều khiển và tự động hóa chuyển động robot.

## Mục tiêu

Mục tiêu của module này là xây dựng một hệ thống điều khiển robot thông minh thông qua:

- truyền luồng hình ảnh từ camera,
- phát hiện khuôn mặt bằng MediaPipe,
- điều khiển robot theo chuyển động của khuôn mặt,
- cung cấp giao diện web để người dùng tương tác trực tiếp.

## Tính năng chính

- Xem trực tiếp video từ camera qua trình duyệt.
- Điều khiển robot bằng nút trên giao diện web.
- Chuyển sang chế độ AI để robot tự điều hướng dựa trên vị trí khuôn mặt.
- Gửi trạng thái góc quay và chế độ hoạt động về giao diện.
- Tương thích với WebSocket để truyền dữ liệu thời gian thực.

## Kiến trúc hệ thống

Module này gồm 2 phần chính:

1. Server Python
   - Chạy WebSocket server.
   - Nhận và phát dữ liệu hình ảnh.
   - Xử lý điều khiển robot.

2. Giao diện web
   - Hiển thị video stream.
   - Cung cấp nút điều khiển cơ bản như trái, phải, lên, xuống.
   - Cho phép bật chế độ AI.

## Cấu trúc thư mục

```text
ESP32_Cam/
├── Code_Nap_Cam/
│   └── Code_Nap_Cam.ino
├── ServerCam.py
└── requirements.txt
```

## Các file chính

- ServerCam.py: file chính triển khai server FastAPI + WebSocket + xử lý AI.
- Code_Nap_Cam/Code_Nap_Cam.ino: firmware cho module camera/ESP32.
- requirements.txt: các thư viện Python cần thiết.

## Yêu cầu môi trường

- Python 3.9+
- Cài đặt các dependency trong requirements.txt

### Cài đặt

```bash
pip install -r requirements.txt
```

## Chạy ứng dụng

Từ thư mục ESP32_Cam, chạy:

```bash
python ServerCam.py
```

Sau đó mở trình duyệt và truy cập:

```text
http://localhost:8765
```

## Cách hoạt động

1. Camera gửi frame hình ảnh tới server.
2. Server dùng MediaPipe để phát hiện khuôn mặt.
3. Nếu ở chế độ AI, server tính toán hướng dịch chuyển và gửi lệnh điều khiển tới robot.
4. Người dùng có thể thay đổi sang chế độ thủ công để điều khiển trực tiếp bằng giao diện.

## Công nghệ sử dụng

- Python
- FastAPI
- WebSocket
- OpenCV
- MediaPipe
- NumPy
- Uvicorn

## Lưu ý

- Hiệu quả điều khiển phụ thuộc vào độ sáng, góc quay camera và độ chính xác của phát hiện khuôn mặt.
- Để hoạt động ổn định, cần cấu hình phần cứng và camera phù hợp.
- Nếu dùng với robot thực tế, cần kiểm tra kết nối điều khiển và giới hạn chuyển động của thiết bị.

## Kết luận

ESP32_Cam là một mô-đun quan trọng trong hệ thống Smart_Robot, giúp kết nối camera, AI vision và điều khiển robot trong một quy trình tự động và tương tác thời gian thực.
