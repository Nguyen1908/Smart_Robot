# ROBOTS Personal Assistant

Trợ lý AI cá nhân dạng agent, hỗ trợ voice-to-voice, 14 tools, bộ nhớ 4 tầng, MCP server.

## Tổng quan

Dự án triển khai một chatbot LLM trợ lý cá nhân theo hướng **agentic AI**, tích hợp:

- **LLM**: Pydantic-AI Agent với OpenAI-compatible provider (hỗ trợ mọi API tương thích OpenAI)
- **14 Tools**: Thời tiết, tìm kiếm web, tin tức, tỷ giá, cổ phiếu, nhạc, dịch thuật, tính toán, ...
- **Memory 4 tầng**: Profile, Facts, Action States, Conversation History — lưu trữ JSON
- **STT**: faster-whisper (large-v3-turbo) với auto-downgrade CPU, VAD filter
- **TTS**: edge-tts (Microsoft Neural Voice) với concurrent sentence processing
- **MCP Server**: FastMCP server expose tất cả tools qua Model Context Protocol
- **UI**: Streamlit web app với ghi âm trực tiếp qua microphone

## Kiến trúc hệ thống

```
┌──────────────────────────────────────────────────────────┐
│  Streamlit UI (assistant/ui/streamlit_app.py)            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Chat Input   │  │ Voice Record │  │ Audio Playback │  │
│  └──────┬───────┘  └──────┬───────┘  └───────▲────────┘  │
│         │                 │                  │           │
│         ▼                 ▼                  │           │
│  ┌─────────────────────────────────┐         │           │
│  │  PersonalAssistantAgent         │         │           │
│  │  (assistant/agent.py)           │         │           │
│  │                                 │         │           │
│  │  ┌───────────┐ ┌─────────────┐  │         │           │
│  │  │ Direct    │ │ Full LLM    │  │         │           │
│  │  │ Routing   │ │ Path        │  │         │           │
│  │  │ (fast)    │ │ (Pydantic-  │  │         │           │
│  │  │           │ │  AI Agent)  │  │         │           │
│  │  └─────┬─────┘ └──────┬──────┘  │         │           │
│  │        │              │         │         │           │
│  │        ▼              ▼         │         │           │
│  │  ┌──────────────────────────┐   │         │           │
│  │  │  14 Tools (tools.py)     │   │         │           │
│  │  │  Weather, Search, News,  │   │         │           │
│  │  │  Stock, Music, Exchange, │   │         │           │
│  │  │  Calculate, Translate... │   │         │           │
│  │  └──────────────────────────┘   │         │           │
│  │                                 │         │           │
│  │  ┌───────────────────────┐      │         │           │
│  │  │ Memory 4 tầng         │      │         │           │
│  │  │ (memory.py)           │      │         │           │
│  │  │ Profile / Facts /     │      │         │           │
│  │  │ Action States /       │      │         │           │
│  │  │ Conversation          │      │         │           │
│  │  └───────────────────────┘      │         │           │
│  │                                 │         │           │
│  │  ┌───────────────────────┐      │         │           │
│  │  │ SpeechService         │      │         │           │
│  │  │ (speech.py)           │──────┼─────────┘           │
│  │  │ STT: faster-whisper   │      │                     │
│  │  │ TTS: edge-tts         │      │                     │
│  │  └───────────────────────┘      │                     │
│  └─────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│  MCP Server (mcp_server.py)          │
│  FastMCP — expose 14 tools via MCP   │
│  python -m assistant.mcp_server      │
└──────────────────────────────────────┘
```

## Cấu trúc project

```
assistant/
├── __init__.py              # Package init
├── agent.py                 # Agent chính — routing, LLM, orchestration
├── config.py                # Cấu hình & runtime profiles (demo_fast, balanced, accurate)
├── memory.py                # Bộ nhớ 4 tầng: profile, facts, action_states, conversation
├── models.py                # Data models (ChatMessage, AssistantResponse)
├── speech.py                # STT (faster-whisper) + TTS (edge-tts)
├── tools.py                 # 14 pure tool functions (không phụ thuộc framework)
├── mcp_server.py            # MCP server (FastMCP) expose tất cả tools
└── ui/
    └── streamlit_app.py     # Giao diện web Streamlit

tests/
├── test_memory_action_state.py  # 27 tests — memory system + action states
├── test_music_switch.py         # 14 tests — music switch song extraction
├── test_tools_realtime.py       # 94 tests — all tools with real APIs
└── test_full_integration.py     # 72 tests — full integration + cross-topic memory flow

app.py                   # Entry point: streamlit run app.py
requirements.txt         # Dependencies
data/
├── memory.json          # Persistent memory (auto-created)
└── audio/               # STT input + TTS output files
```

## Cài đặt

```bash
pip install -r requirements.txt
```

### Dependencies chính

| Package | Mục đích |
|---------|----------|
| `pydantic-ai-slim[openai]` | Agent framework + OpenAI provider |
| `faster-whisper` | Speech-to-Text (Whisper) |
| `edge-tts` | Text-to-Speech (Microsoft Neural Voice) |
| `streamlit` | Web UI |
| `audio-recorder-streamlit` | Microphone recording trong browser |
| `requests` | HTTP client cho API calls |
| `fastmcp` | MCP server |
| `openai` | OpenAI client |
| `ctranslate2` | CTranslate2 backend cho faster-whisper |

## Chạy ứng dụng

```bash
streamlit run app.py
```

## Hệ thống Memory 4 tầng

### Tier 1: Profile (key-value)
- Thông tin hồ sơ user: tên, tuổi, nghề nghiệp, ...
- Persist vĩnh viễn trong `memory.json`

### Tier 2: Facts (danh sách)
- Các facts dài hạn: sở thích, thói quen, thông tin quan trọng
- User nói "hãy nhớ rằng..." → auto-save
- Inject vào system prompt để LLM luôn biết

### Tier 3: Action States (dict of dicts) — MỚI
- Theo dõi trạng thái hành động đang diễn ra (nhạc, timer, ...)
- **Mục đích**: Cho phép LLM nhớ context xuyên suốt cuộc hội thoại
- **Ví dụ flow**:
  1. User: "mở nhạc Ai đưa em về" → `action_states.music = {active: true, song: "Ai đưa em về"}`
  2. User: "giá vàng hôm nay" → Agent trả lời giá vàng bình thường
  3. User: "tin tức công nghệ" → Agent trả lời tin tức
  4. User: "dừng nhạc" → Agent biết nhạc đang phát → pause thành công!
- Thread-safe (sử dụng `threading.Lock`)
- Auto-sync giữa `tools.py` globals ↔ `memory.json`
- Restore trạng thái khi restart process

### Tier 4: Conversation History
- Pydantic-AI `ModelMessage` list (serialized JSON)
- Max 12 messages (configurable)
- Auto-clean tool-call/tool-return parts để tránh API error
- Direct-routed actions (weather, music) cũng được thêm vào history

### Luồng Memory trong Action States

```
User: "mở nhạc Ai đưa em về"
  → agent._handle_music() → play_music("Ai đưa em về")
  → memory.sync_music_state_from_tools()  ←── Save to memory.json
  → memory.add_action_to_history()        ←── Save to conversation

User: "giá vàng hôm nay" (chủ đề khác)
  → agent._handle_direct_realtime() → web_search()
  → LLM gets system prompt including: "Nhạc: bài "Ai đưa em về" đang phát"

User: "dừng nhạc" (quay lại nhạc)
  → agent._handle_music() → pause_music()  ←── Biết nhạc đang phát!
  → memory.sync_music_state_from_tools()   ←── Update paused state
```

## 14 Tools

### Thông tin & Dữ liệu
| Tool | Mô tả | Data Source |
|------|--------|-------------|
| `get_weather` | Thời tiết hiện tại + dự báo | Open-Meteo API |
| `web_search` | Tìm kiếm web realtime | Tavily API (fallback: DuckDuckGo) |
| `get_news` | Tin tức mới nhất theo chủ đề | Tavily API |
| `get_exchange_rate` | Tỷ giá ngoại tệ | ExchangeRate-API + Vietcombank XML |
| `get_stock_price` | Giá cổ phiếu realtime | SSI iBoard (VN) + Yahoo Finance (quốc tế) |
| `knowledge_search` | Kiến thức Wikipedia | Wikipedia API (vi + en) |

### Tiện ích
| Tool | Mô tả |
|------|--------|
| `calculate` | Tính toán biểu thức toán học |
| `get_current_datetime` | Ngày giờ hiện tại (UTC+7) |
| `translate_text` | Dịch thuật đa ngôn ngữ (MyMemory API) |
| `save_memory` | Lưu facts vào bộ nhớ dài hạn |

### Âm nhạc (Windows)
| Tool | Mô tả | Cơ chế |
|------|--------|--------|
| `play_music` | Mở nhạc YouTube | Mở tab browser + YouTube search |
| `pause_music` | Tạm dừng nhạc | Media key (VK_MEDIA_PLAY_PAUSE) |
| `resume_music` | Tiếp tục phát | Media key toggle |
| `stop_music` | Tắt nhạc (đóng tab) | EnumWindows + Ctrl+W |

## Direct Routing vs Full LLM Path

Agent có 2 đường xử lý:

### Direct Routing (nhanh, bypass LLM)
- **Weather**: Detect "thời tiết", "nhiệt độ" → gọi `get_weather()` trực tiếp
- **Memory**: Detect "hãy nhớ rằng", "tôi thích" → gọi `save_memory()` trực tiếp
- **Music**: Detect "mở nhạc", "dừng nhạc", "tắt nhạc" → gọi music tools trực tiếp
- **Exchange Rate**: Detect "tỷ giá", "đô la" → gọi `get_exchange_rate()` trực tiếp
- **Realtime**: Detect "giá xăng", "tin tức", "cổ phiếu" → gọi `web_search()` + pass qua LLM

### Full LLM Path (Pydantic-AI Agent)
- Query phức tạp, phân tích, so sánh
- LLM tự quyết định gọi tool nào
- Hỗ trợ multi-tool, reasoning

### Analytical Query Detection
Nếu query chứa keyword direct-route NHƯNG cũng chứa tín hiệu phân tích ("tại sao", "ảnh hưởng", "so sánh", ...) → đi full LLM path thay vì direct route.

## Runtime Profiles

3 profile tối ưu sẵn trong `config.py`:

| Profile | Whisper | Beam Size | Max Tokens | Temperature | Mục đích |
|---------|---------|-----------|------------|-------------|----------|
| `demo_fast` | large-v3-turbo | 1 | 500 | 0.2 | Demo, phản hồi nhanh nhất |
| `balanced` | large-v3-turbo | 1 | 450 | 0.3 | Cân bằng tốc độ/chính xác |
| `accurate` | large-v3-turbo | 2 | 500 | 0.25 | Ưu tiên chính xác |

Chọn profile:
```bash
# Windows CMD
set ASSISTANT_RUNTIME_PROFILE=demo_fast && streamlit run app.py

# PowerShell
$env:ASSISTANT_RUNTIME_PROFILE="demo_fast"; streamlit run app.py
```

## MCP Server

Expose tất cả 14 tools qua Model Context Protocol:

```bash
python -m assistant.mcp_server
```

Hỗ trợ tích hợp với bất kỳ MCP client nào (Claude Desktop, Continue, Cursor, ...).

## Speech Processing

### STT (Speech-to-Text)
- **Engine**: faster-whisper (CTranslate2 backend)
- **Model**: `large-v3-turbo` (auto-downgrade → `medium` trên CPU)
- **Language**: Vietnamese (vi) với initial prompt tiếng Việt
- **VAD**: Silero VAD filter, min silence 200-300ms
- **Post-processing**: 100+ Vietnamese correction rules cho lỗi Whisper thường gặp
  - Tên riêng: "JD Vans" → "JD Vance", "trùm ảnh" → "Trump"
  - Từ vựng: "tân hình" → "tình hình", "chứng khoáng" → "chứng khoán"

### TTS (Text-to-Speech)
- **Engine**: edge-tts (Microsoft Neural Voice)
- **Voice**: `vi-VN-NamMinhNeural` (nam, tự nhiên)
- **Concurrent**: Tách câu → synthesize song song → ghép MP3
- **Emoji handling**: Chuyển emoji → expression ("😂" → "haha"), strip remaining

## Tests

```bash
# Unit tests — memory system
pytest tests/test_memory_action_state.py -v          # 27 tests

# Unit tests — music switch extraction
pytest tests/test_music_switch.py -v                 # 14 tests

# Integration tests — all tools with real APIs
pytest tests/test_full_integration.py -v             # 72 tests

# All tests
pytest tests/ -v                                     # 113 tests total
```

### Test Coverage

| Test File | Tests | Mô tả |
|-----------|-------|--------|
| `test_memory_action_state.py` | 27 | MemoryStore, CRUD, persistence, sync, conversation flow, process restart |
| `test_music_switch.py` | 14 | Song name extraction from switch commands |
| `test_tools_realtime.py` | 94 | All 14 tools with real API calls |
| `test_full_integration.py` | 72 | Full integration + 12-step cross-topic memory flow |

## Biến môi trường

### LLM
| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `ASSISTANT_API_KEY` | `sk-thisisnhatanh2806` | API key cho OpenAI-compatible endpoint |
| `ASSISTANT_BASE_URL` | `https://api1.6766676.xyz` | Base URL cho LLM API |
| `ASSISTANT_MODEL` | `qwen3-coder-plus` | Model name |
| `ASSISTANT_LLM_TEMPERATURE` | `0.3` | Temperature cho LLM |
| `ASSISTANT_LLM_MAX_COMPLETION_TOKENS` | `500` | Max tokens cho response |
| `ASSISTANT_MAX_RESPONSE_CHARS` | `800` | Max ký tự response (cho TTS) |

### STT
| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `ASSISTANT_WHISPER_MODEL` | `large-v3-turbo` | Whisper model size |
| `ASSISTANT_WHISPER_DEVICE` | `auto` | Device: auto, cuda, cpu |
| `ASSISTANT_WHISPER_COMPUTE_TYPE` | `int8` | Compute type: int8, float16, float32 |
| `ASSISTANT_WHISPER_CPU_THREADS` | `4` | CPU threads cho Whisper |
| `ASSISTANT_STT_BEAM_SIZE` | `1` | Beam size (1 = greedy, nhanh) |
| `ASSISTANT_STT_BEST_OF` | `1` | Best-of sampling |
| `ASSISTANT_STT_VAD_MIN_SILENCE_MS` | `300` | Min silence duration cho VAD (ms) |

### TTS
| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `ASSISTANT_TTS_VOICE` | `vi-VN-NamMinhNeural` | Voice name cho edge-tts |
| `ASSISTANT_TTS_RATE` | `+30%` | Tốc độ đọc TTS |

### Memory & Data
| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `ASSISTANT_MEMORY_MAX_MESSAGES` | `12` | Max conversation messages lưu trữ |
| `ASSISTANT_MEMORY_FILE` | `data/memory.json` | Đường dẫn file memory |
| `ASSISTANT_DATA_DIR` | `data` | Thư mục dữ liệu |
| `ASSISTANT_AUDIO_DIR` | `data/audio` | Thư mục audio files |

### Routing
| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `ASSISTANT_DIRECT_WEATHER_ROUTING` | `true` | Bật direct routing cho weather |
| `ASSISTANT_DIRECT_MEMORY_ROUTING` | `true` | Bật direct routing cho memory save |
| `ASSISTANT_RUNTIME_PROFILE` | `demo_fast` | Runtime profile |

### API Keys
| Biến | Mô tả |
|------|--------|
| `TAVILY_API_KEY` | API key cho Tavily web search |
| `EXCHANGERATE_API_KEY` | API key cho ExchangeRate-API |

## Luồng hoạt động chi tiết

```
1. Input
   ├── Text (chat input) ──────────────────┐
   └── Audio (microphone) ──┐              │
                            ▼              │
                     faster-whisper STT    │
                     + Vietnamese          │
                       corrections         │
                            │              │
                            ▼              │
2. Routing          ┌───────────────────────┤
                    │  Direct Routing?      │
                    │  ┌─ Weather? ──→ get_weather()
                    │  ├─ Memory?  ──→ save_memory()
                    │  ├─ Music?   ──→ play/pause/stop/resume_music()
                    │  ├─ Exchange? ─→ get_exchange_rate() + LLM
                    │  └─ Realtime? ─→ web_search() + LLM
                    │
                    │  If analytical query → Full LLM path
                    │
3. LLM              │  Full LLM Path:
                    │  Pydantic-AI Agent.run_sync()
                    │  ├─ System prompt + memory context + action states
                    │  ├─ Conversation history
                    │  └─ 14 tools registered
                    │
4. Memory           │  After response:
                    │  ├─ Save conversation to memory
                    │  ├─ Sync action states (music, etc.)
                    │  └─ Add to conversation history
                    │
5. Output           │  ├─ Text response (normalized, max chars)
                    │  ├─ TTS (edge-tts, concurrent sentences)
                    │  └─ Audio autoplay in Streamlit UI
```

## Cách demo

### 1. Chào hỏi + Memory
```
User: "Xin chào, hãy nhớ rằng tôi tên là Nhật Anh và tôi thích lập trình"
Bot: "Mình đã ghi nhớ thông tin này rồi nhé."

User: "Tôi tên gì?"
Bot: "Bạn tên là Nhật Anh, và bạn thích lập trình nha."
```

### 2. Weather + Realtime
```
User: "Thời tiết TPHCM hôm nay"
Bot: "Thời tiết tại Thành phố Hồ Chí Minh... nhiệt độ 32°C..."

User: "Giá vàng hôm nay"
Bot: "Vàng SJC là X triệu/lượng, vàng nhẫn 9999 là Y triệu..."
```

### 3. Music Flow (cross-topic memory)
```
User: "Mở nhạc Ai đưa em về"
Bot: "Đang mở bài Ai đưa em về cho bạn..."

User: "Tin tức công nghệ hôm nay"     ← Chuyển chủ đề
Bot: "Tin tức công nghệ mới nhất..."

User: "Giá cổ phiếu VNM"             ← Chủ đề khác nữa
Bot: "Cổ phiếu VNM - Vinamilk..."

User: "Dừng nhạc"                     ← Quay lại nhạc — VẪN HOẠT ĐỘNG!
Bot: "Đã tạm dừng bài Ai đưa em về."

User: "Tiếp tục phát"
Bot: "Đã tiếp tục phát bài Ai đưa em về."

User: "Chuyển sang bài Chạy Ngay Đi"
Bot: "Đang mở bài Chạy Ngay Đi cho bạn..."
```

## Cấu hình khuyến nghị

### CPU (không có GPU)
```bash
set ASSISTANT_RUNTIME_PROFILE=demo_fast && set ASSISTANT_WHISPER_DEVICE=cpu && set ASSISTANT_WHISPER_COMPUTE_TYPE=int8 && streamlit run app.py
```

### GPU CUDA
```bash
set ASSISTANT_RUNTIME_PROFILE=balanced && set ASSISTANT_WHISPER_DEVICE=cuda && streamlit run app.py
```

## Ghi chú vận hành

- Model mặc định: `qwen3-coder-plus`
- Runtime profile mặc định: `demo_fast`
- Memory lưu tại `data/memory.json` (auto-created)
- Audio files lưu trong `data/audio/`
- Nếu thiếu CUDA (lỗi `cublas64_12.dll`), tự fallback sang CPU int8
- Whisper `large-v3-turbo` tự downgrade → `medium` trên CPU
- Browser cần quyền microphone cho ghi âm
- Music tools chỉ hoạt động trên Windows (sử dụng Windows API)
