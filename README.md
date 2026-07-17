# Smart_Robot

Smart_Robot là một dự án tích hợp giữa trí tuệ nhân tạo, trợ lý giọng nói và robot điều khiển qua camera. Dự án này bao gồm ba thành phần chính:

- Một trợ lý AI cá nhân chạy trên máy tính, có thể giao tiếp bằng giọng nói, nhớ ngữ cảnh và gọi các công cụ như thời tiết, tin tức, tìm kiếm web, nhạc và dịch thuật.
- Một hệ thống robot điều khiển bằng camera, sử dụng ESP32-CAM và MediaPipe để phát hiện khuôn mặt và điều khiển chuyển động robot.
- Một module phát triển trên ESP32-C3 dùng cho thu âm/phát âm thanh qua mạng UDP.

## Mục tiêu dự án

Dự án nhằm xây dựng một hệ thống robot thông minh có thể:

- nghe và phản hồi bằng giọng nói,
- hiểu yêu cầu người dùng bằng ngôn ngữ tự nhiên,
- thực hiện các tác vụ như tra cứu thông tin, phát nhạc, lưu nhớ sở thích,
- điều khiển robot thông qua camera hoặc giao diện web.

## Tổng quan kiến trúc

Dự án được chia thành hai nhánh chính:

### 1. Server AI / Trợ lý cá nhân
Vị trí: [Server_C3](Server_C3)

Phần này cung cấp backend cho trợ lý AI với các tính năng:

- giao diện web bằng Streamlit,
- nhận văn bản và giọng nói,
- chuyển đổi giọng nói sang văn bản (STT) bằng Whisper,
- chuyển văn bản sang giọng nói (TTS) bằng edge-tts,
- bộ nhớ 4 tầng để ghi nhớ thông tin người dùng,
- hệ thống tools cho thời tiết, tin tức, tìm kiếm web, tỷ giá, cổ phiếu, nhạc và nhiều tác vụ khác,
- tích hợp MCP server để expose tools cho các client khác.

### 2. Robot điều khiển bằng camera
Vị trí: [ESP32_Cam](ESP32_Cam)

Phần này triển khai:

- một WebSocket server chạy trên Python,
- giao diện web để xem luồng camera và điều khiển robot,
- xử lý ảnh bằng MediaPipe để phát hiện khuôn mặt,
- điều khiển robot theo chuyển động của khuôn mặt trong chế độ AI.

### 3. Firmware cho ESP32-C3 / ESP32-CAM
Vị trí:

- [Server_C3/Code_Nap_C3/Code_Nap_C3.ino](Server_C3/Code_Nap_C3/Code_Nap_C3.ino)
- [ESP32_Cam/Code_Nap_Cam/Code_Nap_Cam.ino](ESP32_Cam/Code_Nap_Cam/Code_Nap_Cam.ino)

Phần firmware này dùng để:

- kết nối Wi-Fi,
- thu âm và phát loa qua I2S,
- truyền dữ liệu âm thanh bằng UDP tới server,
- hỗ trợ tương tác âm thanh giữa hardware và phần mềm.

## Cấu trúc thư mục

```text
Smart_Robot/
├── ESP32_Cam/
│   ├── Code_Nap_Cam/
│   │   └── Code_Nap_Cam.ino
│   ├── ServerCam.py
│   └── requirements.txt
├── Server_C3/
│   ├── app.py
│   ├── requirements.txt
│   ├── assistant/
│   │   ├── agent.py
│   │   ├── config.py
│   │   ├── memory.py
│   │   ├── models.py
│   │   ├── mcp_server.py
│   │   ├── speech.py
│   │   ├── tools.py
│   │   └── ui/
│   │       └── streamlit_app.py
│   ├── Code_Nap_C3/
│   │   └── Code_Nap_C3.ino
│   ├── data/
│   └── tests/
└── README.md
```

## Tính năng chính

### Trợ lý AI
- hỗ trợ hội thoại bằng tiếng Việt,
- nhận input từ văn bản hoặc giọng nói,
- có thể trả lời các câu hỏi thời tiết, tin tức, tỷ giá, cổ phiếu,
- có thể phát nhạc, tạm dừng, tiếp tục hoặc dừng nhạc,
- lưu lại thông tin người dùng vào bộ nhớ dài hạn,
- hỗ trợ chạy dưới dạng MCP server cho các ứng dụng khác.

### Robot điều khiển bằng camera
- xem luồng ảnh trực tiếp từ camera,
- điều khiển robot bằng bàn phím hoặc giao diện web,
- chuyển sang chế độ AI để robot tự điều hướng bằng nhận diện khuôn mặt.

### Firmware phần cứng
- kết nối Wi-Fi,
- xử lý mic và loa qua I2S,
- truyền âm thanh qua UDP giữa ESP32 và server.

## Yêu cầu môi trường

### Phần mềm
- Python 3.10+
- pip
- các package được liệt kê trong:
  - [Server_C3/requirements.txt](Server_C3/requirements.txt)
  - [ESP32_Cam/requirements.txt](ESP32_Cam/requirements.txt)

### Phần cứng
- ESP32-CAM
- ESP32-C3
- module mic và loa hỗ trợ I2S
- robot cơ khí hoặc bộ điều khiển tương ứng

## Cài đặt

### 1. Cài đặt môi trường Python cho server AI

```bash
cd Server_C3
pip install -r requirements.txt
```

### 2. Cài đặt môi trường cho camera server

```bash
cd ESP32_Cam
pip install -r requirements.txt
```

## Chạy dự án

### Chạy trợ lý AI

Từ thư mục [Server_C3](Server_C3):

```bash
streamlit run app.py
```

### Chạy server camera robot

Từ thư mục [ESP32_Cam](ESP32_Cam):

```bash
python ServerCam.py
```

### Chạy MCP server (tuỳ chọn)

```bash
cd Server_C3
python -m assistant.mcp_server
```

## Cấu hình quan trọng

Một số biến môi trường có thể được thiết lập trước khi chạy trợ lý AI, ví dụ:

- ASSISTANT_API_KEY
- ASSISTANT_BASE_URL
- ASSISTANT_MODEL
- ASSISTANT_RUNTIME_PROFILE
- TAVILY_API_KEY
- EXCHANGERATE_API_KEY

Nếu dùng firmware ESP32, cần chỉnh sửa thông tin Wi-Fi và địa chỉ server trong file Arduino tương ứng.

## Lưu ý khi sử dụng

- Một số tính năng như tra cứu tin tức, thời tiết hoặc tỷ giá phụ thuộc vào kết nối internet và API bên ngoài.
- Đối với phần camera/robot, hiệu quả điều khiển phụ thuộc vào độ sáng, góc máy và cấu hình phần cứng.
- Khi chạy trên Windows, có thể cần cài thêm các phụ thuộc liên quan tới audio và Whisper.

## Kết luận

Smart_Robot là một nền tảng thử nghiệm thú vị cho việc kết hợp AI agent, giọng nói và robot điều khiển bằng camera. Đây là một dự án phù hợp để học về:

- phát triển AI assistant,
- tích hợp speech-to-text và text-to-speech,
- xây dựng hệ thống robot điều khiển bằng hình ảnh,
- kết nối phần cứng ESP32 với ứng dụng phần mềm.
