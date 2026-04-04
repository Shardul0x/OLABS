import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi?: any;
    _faceApiLoaded?: boolean;
  }
}

interface FaceDetectorResult { boundingBox: DOMRectReadOnly }
interface IFaceDetector {
  detect(source: HTMLVideoElement | HTMLCanvasElement): Promise<FaceDetectorResult[]>;
}
declare const FaceDetector:
  | { new(opts?: { fastMode?: boolean; maxDetectedFaces?: number }): IFaceDetector }
  | undefined;

const FACE_API_CDN     = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const FACE_API_WEIGHTS = "https://justadudewhohacks.github.io/face-api.js/models";

let faceApiPromise: Promise<void> | null = null;

function loadFaceApi(): Promise<void> {
  if (faceApiPromise) return faceApiPromise;

  faceApiPromise = new Promise<void>((resolve) => {
    if (window._faceApiLoaded) { resolve(); return; }

    const script = document.createElement("script");
    script.src = FACE_API_CDN;
    script.async = true;
    script.onload = async () => {
      try {
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_WEIGHTS);
        window._faceApiLoaded = true;
      } catch (e) {
        console.warn("face-api weight load failed:", e);
      }
      resolve();
    };
    script.onerror = () => {
      resolve(); 
    };
    document.head.appendChild(script);
  });

  return faceApiPromise;
}

const VideoPreview = () => {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const videoStreamRef  = useRef<MediaStream | null>(null);
  const audioStreamRef  = useRef<MediaStream | null>(null);
  const detectorRef     = useRef<IFaceDetector | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef      = useRef(true);

  const {
    cameraOn, setCameraOn,
    micOn, setMicOn,
    isRecording, setFacesDetected,
    facesDetected,
  } = useInterview();

  useEffect(() => {
    if (cameraOn && !videoStreamRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false })
        .then((stream) => {
          if (!mountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
          videoStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.warn("Camera denied:", err));
    }

    if (!cameraOn && videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setFacesDetected(0);
    }
  }, [cameraOn, setFacesDetected]);

  useEffect(() => {
    if (micOn && !audioStreamRef.current) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((stream) => {
          if (!mountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
          audioStreamRef.current = stream;
          stream.getAudioTracks().forEach((t) => { t.enabled = true; });
        })
        .catch(() => { });
    }
    if (!micOn && audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = false; });
    }
    if (micOn && audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = true; });
    }
  }, [micOn]);

  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !videoStreamRef.current || !mountedRef.current) return;

    try {
      if (typeof FaceDetector !== "undefined") {
        if (!detectorRef.current) {
          detectorRef.current = new FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
        }
        const faces = await detectorRef.current.detect(video);
        if (mountedRef.current) setFacesDetected(Math.max(1, faces.length));
        return;
      }
    } catch { }

    if (window._faceApiLoaded && window.faceapi) {
      try {
        const detections = await window.faceapi.detectAllFaces(
          video,
          new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
        );
        if (mountedRef.current) setFacesDetected(Math.max(1, detections.length));
        return;
      } catch { }
    }

    try {
      const W = 160, H = 90;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);

      let leftSkin = 0, rightSkin = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const skin =
          r > 95 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15 && r - b > 15;
        if (skin) {
          const x = (i / 4) % W;
          if (x < W / 2) leftSkin++; else rightSkin++;
        }
      }

      const half = W * H;
      const count =
        (leftSkin / half > 0.012 ? 1 : 0) +
        (rightSkin / half > 0.012 ? 1 : 0);
      if (mountedRef.current) setFacesDetected(Math.max(1, count));
    } catch { }
  }, [setFacesDetected]);

  useEffect(() => {
    if (!cameraOn) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    let boot: ReturnType<typeof setTimeout>;

    loadFaceApi();

    boot = setTimeout(() => {
      if (!mountedRef.current) return;
      runDetection();
      intervalRef.current = setInterval(runDetection, 1500);
    }, 500);

    return () => {
      clearTimeout(boot);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [cameraOn, runDetection]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      videoStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-xl overflow-hidden glass border border-border aspect-video"
    >
      {cameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-secondary">
          <CameraOff className="w-10 h-10 text-muted-foreground" />
        </div>
      )}

      {isRecording && (
        <div className="absolute top-3 left-3 flex items-center gap-2 glass px-3 py-1.5 rounded-full">
          <div className="recording-dot" />
          <span className="text-xs font-medium text-destructive">REC</span>
        </div>
      )}

      {cameraOn && (
        <div
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
            facesDetected > 1
              ? "bg-destructive/80 text-destructive-foreground"
              : "bg-black/40 text-white"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              facesDetected > 1 ? "bg-white animate-pulse" : "bg-green-400 animate-pulse"
            }`}
          />
          {facesDetected > 1 ? `${facesDetected} faces` : "1 face"}
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCameraOn(!cameraOn)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            cameraOn
              ? "bg-primary/20 text-primary"
              : "bg-destructive/20 text-destructive"
          }`}
        >
          {cameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMicOn(!micOn)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            micOn
              ? "bg-primary/20 text-primary"
              : "bg-destructive/20 text-destructive"
          }`}
        >
          {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VideoPreview;