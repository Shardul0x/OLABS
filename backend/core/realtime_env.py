import cv2
import numpy as np
import urllib.request
import os
import threading
import time

# ------------------------------------------------------------------
# MODEL DOWNLOADER
# ------------------------------------------------------------------

MODEL_DIR      = os.path.dirname(os.path.abspath(__file__))
PROTOTXT_PATH  = os.path.join(MODEL_DIR, "deploy.prototxt")
CAFFEMODEL_PATH = os.path.join(MODEL_DIR, "res10_300x300_ssd_iter_140000.caffemodel")

PROTOTXT_URL   = "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt"
CAFFEMODEL_URL = "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel"

def ensure_model_exists():
    if not os.path.exists(PROTOTXT_PATH):
        print("📥 Downloading deploy.prototxt...")
        urllib.request.urlretrieve(PROTOTXT_URL, PROTOTXT_PATH)
        print("✅ deploy.prototxt downloaded")

    if not os.path.exists(CAFFEMODEL_PATH):
        print("📥 Downloading face detection model (~10MB, please wait)...")
        urllib.request.urlretrieve(CAFFEMODEL_URL, CAFFEMODEL_PATH)
        print("✅ caffemodel downloaded")

# ------------------------------------------------------------------
# ENVIRONMENT MONITOR
# ------------------------------------------------------------------

class EnvironmentMonitor:
    DETECTION_INTERVAL = 0.3    # seconds between DNN runs
    CONFIDENCE_THRESH  = 0.4    # minimum DNN confidence to count a face
    ROI_Y2             = 0.85   # ignore detections in bottom 15% (body, not face)

    def __init__(self, show_preview: bool = True):
        self.show_preview = show_preview
        self._running         = False
        self._capture_thread  = None
        self._detection_thread = None
        self._face_log  = []
        self._lock      = threading.Lock()
        self._latest_frame = None
        self._frame_lock   = threading.Lock()
        self._latest_boxes = []
        self._boxes_lock   = threading.Lock()
        self._answer_start = None
        self._net  = None
        self._cap  = None

    def start(self):
        """Start capture and detection threads. Safe to call multiple times."""
        if self._running:
            return

        ensure_model_exists()
        print("🧠 Loading face detection neural network...")
        self._net = cv2.dnn.readNetFromCaffe(PROTOTXT_PATH, CAFFEMODEL_PATH)

        self._cap = cv2.VideoCapture(0)
        if not self._cap.isOpened():
            print("❌ Camera not accessible — face detection disabled")
            self._cap = None
        else:
            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            print("📷 Camera opened successfully")

        self._running = True
        self.mark_answer_start()

        self._capture_thread = threading.Thread(target=self._capture_loop, daemon=True, name="face-capture")
        self._detection_thread = threading.Thread(target=self._detection_loop, daemon=True, name="face-detection")

        self._capture_thread.start()
        self._detection_thread.start()
        print(f"🟢 EnvironmentMonitor started")

    def stop(self):
        """Force complete hardware release and thread termination."""
        if not self._running:
            return

        self._running = False

        if self._capture_thread:
            self._capture_thread.join(timeout=2)
        if self._detection_thread:
            self._detection_thread.join(timeout=2)

        # Critcal: Release the camera immediately
        if self._cap:
            self._cap.release()
            self._cap = None

        with self._frame_lock:
            self._latest_frame = None

        if self.show_preview:
            try:
                cv2.destroyAllWindows()
            except Exception:
                pass

        print("🔴 EnvironmentMonitor stopped and camera released")

    def mark_answer_start(self):
        """Resets the face log window for the current question."""
        self._answer_start = time.time()
        with self._lock:
            cutoff = self._answer_start
            self._face_log = [(t, c) for (t, c) in self._face_log if t >= cutoff]

    def snapshot(self) -> dict:
        """Returns the face count for the CURRENT answer window."""
        window_start = self._answer_start or (time.time() - 10)

        with self._lock:
            face_counts = [c for (t, c) in self._face_log if t >= window_start]

        if face_counts:
            multi_ratio    = sum(1 for c in face_counts if c > 1) / len(face_counts)
            faces_detected = 2 if multi_ratio > 0.2 else 1
            print(f"[Monitor] snapshot: {len(face_counts)} samples, multi_ratio={multi_ratio:.2f}, result={faces_detected}")
        else:
            faces_detected = 1

        return {"faces_detected": faces_detected}

    def update_preview(self):
        """Call from the MAIN THREAD in CLI mode to refresh the OpenCV window."""
        if not self.show_preview:
            return True

        with self._frame_lock:
            frame = self._latest_frame.copy() if self._latest_frame is not None else None
        with self._boxes_lock:
            boxes = list(self._latest_boxes)

        if frame is None:
            blank = np.zeros((300, 500, 3), dtype=np.uint8)
            cv2.putText(blank, "Waiting for camera...", (80, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (180, 180, 180), 2)
            cv2.imshow("Interview Monitor", blank)
        else:
            h, w = frame.shape[:2]
            n = len(boxes)
            for i, (x1, y1, x2, y2, conf) in enumerate(boxes):
                color = (0, 220, 0) if n == 1 else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                label = f"P{i+1}: {conf*100:.0f}%"
                y_label = y1 - 10 if y1 - 10 > 10 else y1 + 10
                cv2.putText(frame, label, (x1, y_label), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            if n == 0:
                status, color = "NO FACE DETECTED", (0, 165, 255)
            elif n == 1:
                status, color = "1 FACE  |  OK", (0, 220, 0)
            else:
                status, color = f"{n} FACES  |  WARNING", (0, 0, 255)

            cv2.rectangle(frame, (0, 0), (w, 44), (20, 20, 20), -1)
            cv2.putText(frame, status, (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            cv2.imshow("Interview Monitor", frame)

        key = cv2.waitKey(1)
        if key == 27:
            cv2.destroyAllWindows()
            self.show_preview = False

        return True

    def _capture_loop(self):
        """Thread 1: grabs frames as fast as the camera allows."""
        while self._running:
            if not self._cap or not self._cap.isOpened():
                time.sleep(0.1)
                continue
            ret, frame = self._cap.read()
            if ret:
                with self._frame_lock:
                    self._latest_frame = frame

    def _detection_loop(self):
        """Thread 2: runs DNN every DETECTION_INTERVAL seconds."""
        last_run = 0.0
        while self._running:
            now = time.time()
            if now - last_run < self.DETECTION_INTERVAL:
                time.sleep(0.01)
                continue

            with self._frame_lock:
                frame = self._latest_frame.copy() if self._latest_frame is not None else None

            if frame is None:
                time.sleep(0.05)
                continue

            boxes, count = self._run_detection(frame)

            with self._boxes_lock:
                self._latest_boxes = boxes

            with self._lock:
                self._face_log.append((now, count))

            last_run = now

    def _run_detection(self, frame):
        h, w = frame.shape[:2]
        blob = cv2.dnn.blobFromImage(
            cv2.resize(frame, (300, 300)), 1.0, (300, 300),
            (104.0, 177.0, 123.0)
        )
        self._net.setInput(blob)
        detections = self._net.forward()

        boxes = []
        for i in range(detections.shape[2]):
            conf = float(detections[0, 0, i, 2])
            if conf < self.CONFIDENCE_THRESH:
                continue
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            x1, y1, x2, y2 = box.astype("int")
            if y1 >= h * self.ROI_Y2:
                continue
            boxes.append((x1, y1, x2, y2, conf))

        return boxes, len(boxes)