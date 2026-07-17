#include <WiFi.h>
#include <driver/i2s.h>

// --- Cấu hình chân ---
#define I2S_MIC_SD_PIN     10 // Chân SD của Mic
#define I2S_SPEAKER_DIN_PIN 8  // Chân DIN của Loa
#define I2S_SCK_PIN        6  
#define I2S_WS_PIN         7  

// --- Cấu hình WiFi & Server ---
const char* ssid = "SSID";
const char* password = "password";
const char* server_ip = "ipserver"; 
const int udp_port = 12345;

WiFiUDP udp;
#define SAMPLE_RATE     16000
#define BUFFER_SIZE     512

enum DeviceMode { MODE_MIC, MODE_SPEAKER };
DeviceMode currentMode = MODE_MIC;

// Hàm khởi tạo I2S tổng quát
void initI2S(i2s_mode_t mode) {
    i2s_driver_uninstall(I2S_NUM_0); // Gỡ bỏ cấu hình cũ

    i2s_config_t i2s_config = {
        .mode = mode, 
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = BUFFER_SIZE,
        .use_apll = false
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK_PIN,
        .ws_io_num = I2S_WS_PIN,
        .data_out_num = (mode & I2S_MODE_TX) ? I2S_SPEAKER_DIN_PIN : I2S_PIN_NO_CHANGE,
        .data_in_num = (mode & I2S_MODE_RX) ? I2S_MIC_SD_PIN : I2S_PIN_NO_CHANGE
    };

    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &pin_config);
    i2s_zero_dma_buffer(I2S_NUM_0); // Xóa bộ đệm để tránh tiếng nổ lụp bụp
}

void setup() {
    Serial.begin(115200);
    
    // Kết nối WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected");
    udp.begin(udp_port);
    
    // Mặc định ban đầu là chế độ thu âm
    initI2S((i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX));
    currentMode = MODE_MIC;
}

void loop() {
    // 1. Kiểm tra dữ liệu từ Server (Ưu tiên phát loa)
    int packetSize = udp.parsePacket();
    
    if (packetSize > 0) {
        // Nếu đang ở chế độ Mic, chuyển sang Loa
        if (currentMode != MODE_SPEAKER) {
            Serial.println("Chuyển sang LOA (Mic OFF)");
            initI2S((i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX));
            currentMode = MODE_SPEAKER;
        }
        
        uint8_t audioBuffer[BUFFER_SIZE];
        int bytesRead = udp.read(audioBuffer, BUFFER_SIZE);
        size_t bytesWritten;
        // Phát âm thanh ra loa
        i2s_write(I2S_NUM_0, audioBuffer, bytesRead, &bytesWritten, portMAX_DELAY);
    } 
    else {
        // 2. Nếu không có dữ liệu từ server, quay lại chế độ thu âm
        if (currentMode != MODE_MIC) {
            Serial.println("Chuyển sang MIC (Loa OFF)");
            initI2S((i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX));
            currentMode = MODE_MIC;
        }

        int16_t micBuffer[BUFFER_SIZE / 2];
        size_t bytesRead;
        // Đọc âm thanh từ Mic
        i2s_read(I2S_NUM_0, &micBuffer, sizeof(micBuffer), &bytesRead, portMAX_DELAY);

        if (bytesRead > 0) {
            udp.beginPacket(server_ip, udp_port);
            udp.write((uint8_t*)micBuffer, bytesRead);
            udp.endPacket();
        }
    }
}