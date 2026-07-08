"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, CameraOff, RefreshCw, UserCheck, AlertTriangle, ScanFace } from "lucide-react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState<"idle" | "detecting" | "face_detected" | "no_face" | "error">("idle");
  const [faceCount, setFaceCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const animRef = useRef<number>(0);

  const startCamera = useCallback(async () => {
    setErrorMsg("");
    setStatus("detecting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(s);
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err: any) {
      setCameraOn(false);
      setStatus("error");
      setErrorMsg(err.message || "Camera access denied.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraOn(false);
    setStatus("idle");
    setFaceCount(0);
    cancelAnimationFrame(animRef.current);
  }, [stream]);

  const detectFaces = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if ("FaceDetector" in window) {
      const faceDetector = new (window as any).FaceDetector({
        maxDetectedFaces: 10,
        fastMode: true,
      });
      faceDetector
        .detect(canvas)
        .then((faces: any[]) => {
          setFaceCount(faces.length);
          setStatus(faces.length > 0 ? "face_detected" : "no_face");
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          for (const face of faces) {
            const box = face.boundingBox;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            if (face.landmarks) {
              for (const lp of face.landmarks) {
                ctx.fillStyle = "#3b82f6";
                ctx.beginPath();
                ctx.arc(lp.x, lp.y, 3, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
          }
        })
        .catch(() => setStatus("detecting"));
    } else {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let skinPixels = 0;
      const total = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
          skinPixels++;
        }
      }
      const ratio = skinPixels / total;
      if (ratio > 0.05) {
        setFaceCount(Math.round(ratio * 10) || 1);
        setStatus("face_detected");
      } else {
        setFaceCount(0);
        setStatus("no_face");
      }
    }

    animRef.current = requestAnimationFrame(detectFaces);
  }, []);

  useEffect(() => {
    if (cameraOn) {
      const timeout = setTimeout(() => {
        animRef.current = requestAnimationFrame(detectFaces);
      }, 500);
      return () => {
        clearTimeout(timeout);
        cancelAnimationFrame(animRef.current);
      };
    }
  }, [cameraOn, detectFaces]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, [stream]);

  const statusBadge = () => {
    const styles = {
      face_detected: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      detecting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      no_face: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      error: "bg-red-500/20 text-red-400 border-red-500/30",
      idle: "bg-white/5 text-white/40 border-white/10",
    };
    const labels = {
      face_detected: "Face Detected",
      detecting: "Detecting...",
      no_face: "No Face",
      error: "Error",
      idle: "Off",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
            <ScanFace className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">FaceRec</h1>
            <p className="text-xs text-white/40">Real-time facial detection</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge()}
          <button
            onClick={cameraOn ? stopCamera : startCamera}
            className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              cameraOn
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"
                : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30"
            }`}
          >
            {cameraOn ? (
              <><CameraOff className="mr-2 h-4 w-4" /> Stop Camera</>
            ) : (
              <><Camera className="mr-2 h-4 w-4" /> Start Camera</>
            )}
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <div className="relative w-full max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-emerald-500/5">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full opacity-0 absolute inset-0"
            />
            <canvas
              ref={canvasRef}
              className="w-full aspect-[4/3] object-cover"
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80 backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Camera className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-sm text-white/40">Camera is off</p>
                <button
                  onClick={startCamera}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
                >
                  <Camera className="mr-2 h-4 w-4" /> Enable Camera
                </button>
              </div>
            )}
            {cameraOn && status === "detecting" && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-3 py-1.5 backdrop-blur-sm">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
                  <span className="text-xs text-blue-400">Initializing...</span>
                </div>
              </div>
            )}
            {cameraOn && status === "face_detected" && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1.5 backdrop-blur-sm">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400">{faceCount} face{faceCount !== 1 ? "s" : ""} detected</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-white/40 mb-1">Camera Status</p>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${cameraOn ? "bg-emerald-400" : "bg-white/20"}`} />
              <span className="text-sm font-medium text-white">{cameraOn ? "Active" : "Inactive"}</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-white/40 mb-1">Detection Status</p>
            <span className="text-sm font-medium text-white capitalize">
              {status === "face_detected" ? "Face Found" : status === "detecting" ? "Scanning..." : status === "no_face" ? "No Face" : status === "error" ? "Error" : "Idle"}
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-white/40 mb-1">Faces Detected</p>
            <span className="text-2xl font-bold text-white">{cameraOn ? faceCount : "—"}</span>
          </div>
        </div>

        <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium text-white">How it works</h3>
          </div>
          <p className="text-xs text-white/40 mb-3">
            Uses your browser camera for real-time facial detection. No images are sent to any server — everything runs locally.
          </p>
          <ul className="space-y-1 text-xs text-white/30">
            <li>• <span className="text-white/50 font-medium">FaceDetector API</span> — Chrome&apos;s built-in face detection</li>
            <li>• <span className="text-white/50 font-medium">Skin-tone heuristic</span> — Fallback for other browsers</li>
            <li>• All processing is done on-device. Your privacy is preserved.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}