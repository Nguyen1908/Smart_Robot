import asyncio
import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import uvicorn
import warnings
import os
import time

# 1. Tối ưu hệ thống
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2' 
warnings.filterwarnings("ignore", category=UserWarning, module='google.protobuf.symbol_database')

app = FastAPI()

# 2. Cấu hình MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(
    model_selection=0,           
    min_detection_confidence=0.5 
)

# 3. Quản lý trạng thái Robot
class RobotState:
    def __init__(self):
        self.mode = "LIVE"       
        self.servo_x = 90        
        self.servo_y = 90        
        self.STEP = 5            
        
        self.SAFE_ZONE = 35      
        self.FAST_ZONE = 90      
        self.last_cmd_time = 0
        self.NORMAL_DELAY = 0.08 
        self.FAST_DELAY = 0.04   
        
        self.frame_count = 0     

state = RobotState()

# 4. Quản lý kết nối WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: any, sender: WebSocket = None, is_binary: bool = False):
        for connection in self.active_connections:
            if connection != sender:
                try:
                    if is_binary: await connection.send_bytes(message)
                    else: await connection.send_text(message)
                except: pass

manager = ConnectionManager()

# 5. Hàm xử lý AI - ĐÃ FIX NGƯỢC CHIỀU TRỤC Y (LÊN/XUỐNG)
def get_ai_navigation(image_bytes):
    state.frame_count += 1
    if state.frame_count % 2 != 0: return None, 0

    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None: return None, 0

        h, w, _ = frame.shape
        center_x, center_y = w // 2, h // 2
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_detection.process(rgb_frame)

        if results.detections:
            detection = results.detections[0]
            bboxC = detection.location_data.relative_bounding_box
            face_x = int((bboxC.xmin + bboxC.width / 2) * w)
            face_y = int((bboxC.ymin + bboxC.height / 2) * h)

            dx = face_x - center_x
            dy = face_y - center_y
            max_offset = max(abs(dx), abs(dy))
            
            commands = []
            
            # --- LOGIC ĐIỀU KHIỂN ĐÃ SỬA LỖI NGƯỢC ---
            
            # Trục ngang (X): Mặt bên phải (dx>0) -> Gửi LEFT để Robot quay Phải
            if abs(dx) > state.SAFE_ZONE:
                if dx > 0: 
                    commands.append("LEFT") 
                    state.servo_x = max(0, state.servo_x - state.STEP)
                else:      
                    commands.append("RIGHT")
                    state.servo_x = min(180, state.servo_x + state.STEP)
            
            # Trục dọc (Y): Mặt bên dưới (dy>0) -> Gửi UP để Robot cúi Xuống (Đã đảo lại)
            if abs(dy) > state.SAFE_ZONE:
                if dy > 0: 
                    commands.append("UP") # Trước là DOWN bị ngược, giờ đổi thành UP
                    state.servo_y = min(180, state.servo_y + state.STEP)
                else:      
                    commands.append("DOWN") # Trước là UP bị ngược, giờ đổi thành DOWN
                    state.servo_y = max(0, state.servo_y - state.STEP)
            
            return commands, max_offset
    except Exception as e:
        print(f"AI Error: {e}")
    return None, 0

# 6. Giao diện Web
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>AI Robot Control Center</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <style>
        body { font-family: sans-serif; text-align: center; background: #121212; color: #eee; margin: 0; padding: 10px; }
        .container { max-width: 800px; margin: auto; background: #1e1e1e; padding: 15px; border-radius: 15px; border: 1px solid #333; }
        .stats { display: flex; justify-content: space-around; background: #252525; padding: 12px; border-radius: 10px; margin-bottom: 10px; color: #00ff88; font-family: monospace; font-size: 1.2em; }
        #stream { width: 100%; max-width: 640px; border-radius: 10px; border: 2px solid #444; }
        .control-panel { display: grid; grid-template-columns: repeat(3, 1fr); width: 280px; margin: 15px auto; gap: 10px; }
        .btn { background: #333; color: white; border: none; border-radius: 12px; padding: 20px; font-size: 28px; cursor: pointer; touch-action: none; }
        .btn:active { background: #00ff88; color: #000; }
        .btn-mode { grid-column: span 3; padding: 12px; font-size: 15px; font-weight: bold; border-radius: 8px; margin-top: 5px; cursor: pointer; }
        #status-mode { font-size: 1.1em; color: #f39c12; margin-bottom: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h3>AI ROBOT MONITOR</h3>
        <div id="status-mode">CHẾ ĐỘ: LIVE MODE</div>
        <div class="stats">
            <div>GÓC X: <span id="valX">90</span>°</div>
            <div>GÓC Y: <span id="valY">90</span>°</div>
        </div>
        <img id="stream" src="">
        <div class="control-panel">
            <div></div><button class="btn" onmousedown="start('DOWN')" onmouseup="stop()" ontouchstart="start('DOWN')" ontouchend="stop()">▲</button><div></div>
            <button class="btn" onmousedown="start('RIGHT')" onmouseup="stop()" ontouchstart="start('RIGHT')" ontouchend="stop()">◀</button>
            <button class="btn" style="font-size: 14px;" onclick="sendCmd('CENTER')">RESET</button>
            <button class="btn" onmousedown="start('LEFT')" onmouseup="stop()" ontouchstart="start('LEFT')" ontouchend="stop()">▶</button>
            <div></div><button class="btn" onmousedown="start('UP')" onmouseup="stop()" ontouchstart="start('UP')" ontouchend="stop()">▼</button><div></div>
            <button class="btn btn-mode" style="background:#f39c12; color: black;" onclick="sendCmd('MODE:AI')">KÍCH HOẠT AI MODE</button>
            <button class="btn btn-mode" style="background:#27ae60" onclick="sendCmd('MODE:LIVE')">CHUYỂN VỀ LIVE MODE</button>
        </div>
    </div>
    <script>
        var ws = new WebSocket("ws://" + location.host + "/ws");
        var img = document.getElementById('stream');
        var timer = null;
        ws.onmessage = function(e) {
            if (e.data instanceof Blob) {
                var url = URL.createObjectURL(e.data);
                img.src = url;
                img.onload = () => URL.revokeObjectURL(url);
            } else {
                let msg = e.data;
                if(msg.startsWith("MODE:")) document.getElementById('status-mode').innerText = "CHẾ ĐỘ: " + msg.split(': ')[1];
                else if(msg.startsWith("STAT:")) {
                    let angles = msg.split(":")[1].split(",");
                    document.getElementById('valX').innerText = angles[0];
                    document.getElementById('valY').innerText = angles[1];
                }
            }
        };
        function sendCmd(c) { if(ws.readyState===1) ws.send(c); }
        function start(c) { if(!timer) { sendCmd(c); timer = setInterval(()=>sendCmd(c), 100); } }
        function stop() { clearInterval(timer); timer = null; }
    </script>
</body>
</html>
"""

# 7. WebSocket Logic
@app.get("/")
async def get(): return HTMLResponse(HTML_TEMPLATE)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive()
            if "bytes" in data:
                await manager.broadcast(data["bytes"], sender=websocket, is_binary=True)
                if state.mode == "AI":
                    loop = asyncio.get_event_loop()
                    cmds, offset = await loop.run_in_executor(None, get_ai_navigation, data["bytes"])
                    if cmds:
                        delay = state.FAST_DELAY if offset > state.FAST_ZONE else state.NORMAL_DELAY
                        if (time.time() - state.last_cmd_time) > delay:
                            for c in cmds: await websocket.send_text(c)
                            await manager.broadcast(f"STAT:{state.servo_x},{state.servo_y}")
                            state.last_cmd_time = time.time()
            elif "text" in data:
                msg = data["text"]
                if msg.startswith("MODE:"):
                    state.mode = msg.split(":")[1]
                    await manager.broadcast(f"MODE: {state.mode}")
                elif msg == "CENTER":
                    state.servo_x, state.servo_y = 90, 90
                    await manager.broadcast(msg)
                    await manager.broadcast("STAT:90,90")
                elif state.mode == "LIVE":
                    # Xử lý góc trong chế độ thủ công
                    if msg == "UP": state.servo_y = min(180, state.servo_y + state.STEP)
                    elif msg == "DOWN": state.servo_y = max(0, state.servo_y - state.STEP)
                    elif msg == "LEFT": state.servo_x = max(0, state.servo_x - state.STEP)
                    elif msg == "RIGHT": state.servo_x = min(180, state.servo_x + state.STEP)
                    await manager.broadcast(msg, sender=websocket)
                    await manager.broadcast(f"STAT:{state.servo_x},{state.servo_y}")
    except: pass
    finally: manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8765)