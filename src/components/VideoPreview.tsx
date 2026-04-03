import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";

const VideoPreview = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { cameraOn, setCameraOn, micOn, setMicOn, isRecording, setFacesDetected } = useInterview();
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera once and keep it running
  useEffect(() => {
    if (cameraOn && !streamRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => {});
    }

    if (!cameraOn && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    return () => {
      // Only cleanup on unmount
    };
  }, [cameraOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Simulate face detection every 2 seconds
  useEffect(() => {
    if (!cameraOn) return;
    const interval = setInterval(() => {
      // Mock: 90% chance 1 person, 10% chance 2
      setFacesDetected(Math.random() > 0.9 ? 2 : 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [cameraOn, setFacesDetected]);

  // Mute/unmute audio tracks
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = micOn;
      });
    }
  }, [micOn]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-xl overflow-hidden glass border border-border aspect-video"
    >
      {cameraOn ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
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
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      )}

      <div className="absolute bottom-3 right-3 flex gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCameraOn(!cameraOn)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            cameraOn ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
          }`}
        >
          {cameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMicOn(!micOn)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            micOn ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
          }`}
        >
          {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VideoPreview;
