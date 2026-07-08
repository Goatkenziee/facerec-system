"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, CameraOff, ScanFace, RefreshCw, UserCheck,
  AlertTriangle, Users, UserPlus, Trash2, CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Input } from '@/components/ui/input';
import { detectFaces, type DetectedFace } from '@/lib/face-recognition';
import {
  getKnownPeople, savePerson, deletePerson, findMatch,
  type KnownPerson
} from '@/lib/known-people';

type DetectionStatus = 'idle' | 'detecting' | 'face_detected' | 'no_face' | 'error';
type RecognitionMode = 'detect' | 'recognize';

let nextPersonId = 1;

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState<DetectionStatus>('idle');
  const [faceCount, setFaceCount] = useState(0);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<RecognitionMode>('detect');
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [recognizedNames, setRecognizedNames] = useState<string[]>([]);
  const [people, setPeople] = useState<KnownPerson[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [lastMatchScores, setLastMatchScores] = useState<number[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  // Load known people on mount
  useEffect(() => {
    setPeople(getKnownPeople());
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    setCameraOn(false);
    setStatus('idle');
    setFaceCount(0);
    setDetectedFaces([]);
    setRecognizedNames([]);
    setLastMatchScores([]);
  }, []);

  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(() => runDetection());
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const faces = await detectFaces(video);
      setFaceCount(faces.length);
      setDetectedFaces(faces);

      if (faces.length > 0) {
        setStatus('face_detected');

        // Draw bounding boxes
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        const names: string[] = [];
        const scores: number[] = [];

        for (const face of faces) {
          const box = face.box;

          // Only draw if box has valid dimensions
          if (box.width > 0 && box.height > 0) {
            ctx.strokeRect(box.x, box.y, box.width, box.height);
          }

          // Draw landmarks
          if (face.landmarks && face.landmarks.length > 0) {
            for (const lp of face.landmarks) {
              ctx.fillStyle = '#3b82f6';
              ctx.beginPath();
              ctx.arc(lp.x, lp.y, 3, 0, 2 * Math.PI);
              ctx.fill();
            }
          }

          // Recognition mode — match against known people
          if (mode === 'recognize' && people.length > 0) {
            const match = findMatch(face.descriptor, 0.6);
            if (match) {
              const dist = match.distance;
              const score = Math.round((1 - dist) * 100);
              names.push(match.person.name);
              scores.push(score);

              ctx.fillStyle = '#22c55e';
              ctx.font = 'bold 14px sans-serif';
              const label = `${match.person.name} (${score}%)`;
              ctx.fillText(label, box.x, Math.max(box.y - 8, 16));
            } else {
              names.push('Unknown');
              scores.push(0);
              ctx.fillStyle = '#f59e0b';
              ctx.font = 'bold 14px sans-serif';
              ctx.fillText('Unknown', box.x, Math.max(box.y - 8, 16));
            }
          } else if (mode === 'detect') {
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('Face', box.x, Math.max(box.y - 8, 16));
          }
        }

        setRecognizedNames(names);
        setLastMatchScores(scores);
      } else {
        setStatus('no_face');
        setRecognizedNames([]);
        setLastMatchScores([]);
      }
    } catch {
      setStatus('detecting');
    }

    animFrameRef.current = requestAnimationFrame(() => runDetection());
  }, [mode, people]);

  const startCamera = useCallback(async () => {
    setError('');
    setStatus('detecting');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraOn(true);
      setTimeout(() => runDetection(), 500);
    } catch (err: any) {
      setCameraOn(false);
      setStatus('error');
      setError(err.message || 'Camera access denied. Please allow camera permissions.');
    }
  }, [runDetection]);

  const toggleCamera = useCallback(() => {
    if (cameraOn) stopCamera();
    else startCamera();
  }, [cameraOn, startCamera, stopCamera]);

  const toggleMode = useCallback(() => {
    setMode(m => m === 'detect' ? 'recognize' : 'detect');
  }, []);

  const handleAddPerson = useCallback(() => {
    const name = newPersonName.trim();
    if (!name || detectedFaces.length === 0) return;

    const face = detectedFaces[0];
    const person: KnownPerson = {
      id: `person_${nextPersonId++}_${Date.now()}`,
      name,
      descriptor: face.descriptor,
      thumbnail: face.thumbnail || '',
      registeredAt: Date.now(),
    };
    savePerson(person);
    setPeople(getKnownPeople());
    setNewPersonName('');
    setIsEnrolling(false);
  }, [newPersonName, detectedFaces]);

  const handleRemovePerson = useCallback((id: string) => {
    deletePerson(id);
    setPeople(getKnownPeople());
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const statusStyles: Record<DetectionStatus, string> = {
    face_detected: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    detecting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    no_face: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    idle: 'bg-white/5 text-white/40 border-white/10',
  };

  const statusLabels: Record<DetectionStatus, string> = {
    face_detected: 'Face Detected',
    detecting: 'Detecting...',
    no_face: 'No Face',
    error: 'Error',
    idle: 'Off',
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
            <p className="text-xs text-white/40">Real-time facial detection & recognition</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusStyles[status]}>
            {statusLabels[status]}
          </Badge>
          <Button
            onClick={toggleCamera}
            variant={cameraOn ? "destructive" : "default"}
            size="sm"
          >
            {cameraOn ? <CameraOff className="h-4 w-4 mr-1.5" /> : <Camera className="h-4 w-4 mr-1.5" />}
            {cameraOn ? 'Stop Camera' : 'Start Camera'}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Top stats row */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Camera"
              value={cameraOn ? 'Active' : 'Off'}
              icon={cameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              trend={cameraOn ? { direction: 'up', label: 'Online' } : { direction: 'down', label: 'Offline' }}
            />
            <StatCard
              title="Detection"
              value={statusLabels[status]}
              icon={<ScanFace className="h-4 w-4" />}
              trend={status === 'face_detected' ? { direction: 'up', label: 'Active' } : status === 'error' ? { direction: 'down', label: 'Error' } : { direction: 'down', label: 'Inactive' }}
            />
            <StatCard
              title="Faces Detected"
              value={String(faceCount)}
              icon={<Users className="h-4 w-4" />}
              trend={faceCount > 0 ? { direction: 'up', label: `${faceCount} face${faceCount !== 1 ? 's' : ''}` } : { direction: 'down', label: 'None' }}
            />
            <StatCard
              title="Known People"
              value={String(people.length)}
              icon={<UserCheck className="h-4 w-4" />}
              trend={people.length > 0 ? { direction: 'up', label: `${people.length} enrolled` } : { direction: 'down', label: 'None' }}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Camera feed */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden border-white/10 bg-white/5">
                <CardContent className="p-0 relative">
                  <div className="relative aspect-[4/3] bg-black/60 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 h-full w-full object-cover ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <canvas
                      ref={canvasRef}
                      className={`absolute inset-0 h-full w-full object-cover ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {!cameraOn && (
                      <div className="flex flex-col items-center gap-3 text-white/30">
                        <Camera className="h-16 w-16" />
                        <p className="text-sm">Camera off — click Start Camera</p>
                      </div>
                    )}
                    {error && (
                      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-300">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Camera controls overlay */}
                  <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge className="border-white/20 text-white/60 text-xs">
                        {mode === 'detect' ? 'Detection Mode' : 'Recognition Mode'}
                      </Badge>
                      {faceCount > 0 && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                          {faceCount} face{faceCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {cameraOn && (
                        <Button
                          onClick={toggleMode}
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {mode === 'detect' ? 'Switch to Recognition' : 'Switch to Detection'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side panel — recognition & known people */}
            <div className="space-y-4">
              {/* Enroll new face */}
              {cameraOn && faceCount > 0 && (
                <Card className="border-white/10 bg-white/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UserPlus className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-medium text-white">Enroll Face</h3>
                    </div>
                    {!isEnrolling ? (
                      <Button
                        onClick={() => setIsEnrolling(true)}
                        variant="outline"
                        size="sm"
                        className="w-full border-white/10"
                      >
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        Enroll Detected Face
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter person's name..."
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          className="border-white/10 bg-white/5 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddPerson}
                            size="sm"
                            className="flex-1"
                            disabled={!newPersonName.trim()}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={() => { setIsEnrolling(false); setNewPersonName(''); }}
                            variant="outline"
                            size="sm"
                            className="border-white/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Known people list */}
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-medium text-white">Known People</h3>
                    <Badge className="border-white/20 text-white/60 ml-auto text-xs">
                      {people.length}
                    </Badge>
                  </div>
                  {people.length === 0 ? (
                    <p className="text-xs text-white/40 text-center py-4">
                      No people enrolled yet. Start the camera and enroll a face.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                      {people.map((person) => {
                        const isRecognized = recognizedNames.includes(person.name);
                        return (
                          <div
                            key={person.id}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                              isRecognized
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${
                                isRecognized ? 'bg-emerald-400' : 'bg-white/20'
                              }`} />
                              <span>{person.name}</span>
                              {isRecognized && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                                  LIVE
                                </Badge>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemovePerson(person.id)}
                              className="text-white/20 hover:text-red-400 transition-colors"
                              title="Remove person"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recognition results */}
              {mode === 'recognize' && detectedFaces.length > 0 && (
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-medium text-white">Recognition Results</h3>
                    </div>
                    <div className="space-y-1.5">
                      {detectedFaces.map((_, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                          <span className="text-white/70">Face #{i + 1}</span>
                          <span className={recognizedNames[i] && recognizedNames[i] !== 'Unknown' ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                            {recognizedNames[i] || 'Unknown'}
                            {lastMatchScores[i] !== undefined && ` (${lastMatchScores[i]}%)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
