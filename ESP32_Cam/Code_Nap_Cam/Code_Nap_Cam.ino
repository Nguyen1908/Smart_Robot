#include "esp_camera.h"
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ESP32Servo.h>

// --- CẤU HÌNH ---
const char* ssid = "SSID";
const char* password = "password";
const char* server_ip = "ipserver";
const uint16_t server_port = 8765;

WebSocketsClient webSocket;
Servo servoUD, servoLR;

int posUD = 90, posLR = 90;
const int step = 5;

// === THROTTLE CONTROL ===
unsigned long lastFrameTime = 0;
unsigned long lastPingTime = 0;
const unsigned long FRAME_INTERVAL_MS = 80;
const unsigned long PING_INTERVAL_MS  = 5000; 

bool isStreaming = true;

// =============================================
void setupCamera() {
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer   = LEDC_TIMER_0;

    config.pin_d0 = 5;  config.pin_d1 = 18; config.pin_d2 = 19; config.pin_d3 = 21;
    config.pin_d4 = 36; config.pin_d5 = 39; config.pin_d6 = 34; config.pin_d7 = 35;
    config.pin_xclk    = 0;  config.pin_pclk  = 22; config.pin_vsync = 25;
    config.pin_href    = 23; config.pin_sscb_sda = 26; config.pin_sscb_scl = 27;
    config.pin_pwdn    = 32; config.pin_reset = -1;

    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    // Dùng QVGA mặc định — ít nóng hơn, dễ chuyển lên VGA khi cần
    config.frame_size   = FRAMESIZE_QVGA;
    config.jpeg_quality = 15;  // 10–15: cân bằng chất lượng/nhiệt
    config.fb_count     = 1;   // 1 buffer: ít RAM hơn, tránh backlog frame cũ

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("Camera init failed: 0x%x\n", err);
        return;
    }

    sensor_t* s = esp_camera_sensor_get();
    if (s) {
        s->set_vflip(s, 1);
        s->set_hmirror(s, 1);
        // Giảm tốc độ sensor — ít nhiệt hơn
        s->set_aec2(s, 0);
        s->set_gainceiling(s, (gainceiling_t)2); // giới hạn gain
    }
}

// =============================================
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {

        case WStype_CONNECTED:
            Serial.println("[WS] Connected");
            isStreaming = true;
            break;

        case WStype_DISCONNECTED:
            Serial.println("[WS] Disconnected — will retry...");
            isStreaming = false;
            break;

        case WStype_TEXT: {
            String msg = (char*)payload;
            sensor_t* s = esp_camera_sensor_get();

            if      (msg == "UP")    posUD = constrain(posUD + step, 0, 180);
            else if (msg == "DOWN")  posUD = constrain(posUD - step, 0, 180);
            else if (msg == "LEFT")  posLR = constrain(posLR + step, 0, 180);
            else if (msg == "RIGHT") posLR = constrain(posLR - step, 0, 180);
            else if (msg == "STREAM:ON")  isStreaming = true;
            else if (msg == "STREAM:OFF") isStreaming = false;
            else if (msg == "MODE:AI"   && s) s->set_framesize(s, FRAMESIZE_VGA);
            else if (msg == "MODE:LIVE" && s) s->set_framesize(s, FRAMESIZE_QVGA);

            servoUD.write(posUD);
            servoLR.write(posLR);

            String status = "STAT:" + String(posUD) + "," + String(posLR);
            webSocket.sendTXT(status);
            break;
        }

        case WStype_PING:
        case WStype_PONG:
            // thư viện tự xử lý, không cần làm gì
            break;

        default: break;
    }
}

// =============================================
void setup() {
    Serial.begin(115200);

    ESP32PWM::allocateTimer(0);
    servoUD.attach(12, 500, 2400);
    servoLR.attach(13, 500, 2400);
    servoUD.write(posUD);
    servoLR.write(posLR);

    // WiFi: dùng chế độ power-save thấp hơn để ổn định hơn
    WiFi.setSleep(false);  // tắt WiFi sleep — giảm drop kết nối
    WiFi.begin(ssid, password);

    Serial.print("Connecting WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.printf("\nIP: %s\n", WiFi.localIP().toString().c_str());

    setupCamera();

    webSocket.begin(server_ip, server_port, "/ws");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(3000);       // tự reconnect sau 3s
    webSocket.enableHeartbeat(10000, 3000, 2);  // ping 10s, timeout 3s, 2 lần thử
}

// =============================================
void loop() {
    webSocket.loop();

    unsigned long now = millis();

    // Keepalive thủ công (dự phòng nếu server không hỗ trợ ping/pong)
    if (now - lastPingTime >= PING_INTERVAL_MS) {
        lastPingTime = now;
        if (webSocket.isConnected()) {
            webSocket.sendTXT("PING");
        }
    }

    // Gửi frame có kiểm soát tốc độ
    if (isStreaming && webSocket.isConnected() && (now - lastFrameTime >= FRAME_INTERVAL_MS)) {
        camera_fb_t* fb = esp_camera_fb_get();
        if (fb) {
            webSocket.sendBIN(fb->buf, fb->len);
            esp_camera_fb_return(fb);
            lastFrameTime = now;
        }
    }

    // Nhường CPU — quan trọng! tránh watchdog reset
    delay(1);
}