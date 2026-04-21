'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

export interface EyeTrackingOutput {
  blinkRate: number;
  gazeDirection: 'left' | 'right' | 'center';
  eyeClosure: number;
  gazeShifts: number;
  isReady: boolean;
  error: string | null;
}

// MediaPipe landmark indices
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function computeEAR(landmarks: { x: number; y: number }[], indices: number[]): number {
  const [p1, p2, p3, p4, p5, p6] = indices.map((i) => landmarks[i]);
  const a = dist(p2, p6);
  const b = dist(p3, p5);
  const c = dist(p1, p4);
  return c > 0 ? (a + b) / (2 * c) : 0.3;
}

export function useEyeTracking(isActive: boolean): EyeTrackingOutput {
  const [output, setOutput] = useState<EyeTrackingOutput>({
    blinkRate: 15,
    gazeDirection: 'center',
    eyeClosure: 0.2,
    gazeShifts: 0,
    isReady: false,
    error: null,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceMeshRef = useRef<unknown>(null);
  const blinkTimestamps = useRef<number[]>([]);
  const gazeHistory = useRef<string[]>([]);
  const lastGaze = useRef<string>('center');
  const isBlinking = useRef(false);
  const mountedRef = useRef(true);
  const rafRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const injectScript = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!isActive) { cleanup(); return; }

    let animFrameId: number;

    async function init() {
      try {
        // Load MediaPipe scripts
        await injectScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        await injectScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

        if (!mountedRef.current) return;

        // Get webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        streamRef.current = stream;

        // Create offscreen video
        const video = document.createElement('video');
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();
        videoRef.current = video;

        // Create canvas for frame capture
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        canvasRef.current = canvas;

        // Init FaceMesh
        const win = window as unknown as Record<string, unknown>;
        const FaceMesh = win['FaceMesh'] as new (opts: object) => unknown;
        const faceMesh = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        (faceMesh as { setOptions: Function }).setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        (faceMesh as { onResults: Function }).onResults((results: { multiFaceLandmarks?: { x: number; y: number; z: number }[][] }) => {
          if (!mountedRef.current) return;
          if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

          const lm = results.multiFaceLandmarks[0] as { x: number; y: number }[];
          const now = Date.now();

          // EAR for both eyes
          const earL = computeEAR(lm, LEFT_EYE);
          const earR = computeEAR(lm, RIGHT_EYE);
          const ear = (earL + earR) / 2;

          // Blink detection (threshold EAR < 0.2)
          if (ear < 0.2 && !isBlinking.current) {
            isBlinking.current = true;
            blinkTimestamps.current.push(now);
          } else if (ear >= 0.2) {
            isBlinking.current = false;
          }

          // Clean up old blinks (> 60 seconds ago)
          blinkTimestamps.current = blinkTimestamps.current.filter(
            (t) => now - t < 60000,
          );
          const blinkRate = blinkTimestamps.current.length;

          // Gaze direction from iris
          let gazeDirection: 'left' | 'right' | 'center' = 'center';
          if (LEFT_IRIS[0] < lm.length && RIGHT_IRIS[0] < lm.length) {
            const leftIrisX = LEFT_IRIS.reduce((s, i) => s + lm[i].x, 0) / LEFT_IRIS.length;
            const rightIrisX = RIGHT_IRIS.reduce((s, i) => s + lm[i].x, 0) / RIGHT_IRIS.length;
            const irisX = (leftIrisX + rightIrisX) / 2;

            const leftEyeW = dist(lm[LEFT_EYE[0]], lm[LEFT_EYE[3]]);
            const normalizedX = leftEyeW > 0
              ? (lm[LEFT_EYE[0]].x - leftIrisX) / leftEyeW + 0.5
              : 0.5;

            if (normalizedX < 0.35) gazeDirection = 'left';
            else if (normalizedX > 0.65) gazeDirection = 'right';
            else gazeDirection = 'center';

            void irisX; // suppress lint
          }

          // Gaze shifts (changes in last 60s)
          if (gazeDirection !== lastGaze.current) {
            gazeHistory.current.push(gazeDirection);
          }
          lastGaze.current = gazeDirection;
          // Keep only last 60 entries (~60s worth)
          if (gazeHistory.current.length > 60) {
            gazeHistory.current = gazeHistory.current.slice(-60);
          }
          const gazeShifts = gazeHistory.current.length;

          // Eye closure (1 - EAR, clamped 0–1)
          const eyeClosure = Math.max(0, Math.min(1, 1 - ear * 3));

          setOutput({ blinkRate, gazeDirection, eyeClosure, gazeShifts, isReady: true, error: null });
        });

        faceMeshRef.current = faceMesh;

        // Frame loop
        const ctx = canvas.getContext('2d')!;
        const processFrame = async () => {
          if (!mountedRef.current) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          await (faceMesh as { send: Function }).send({ image: canvas });
          animFrameId = requestAnimationFrame(processFrame);
          rafRef.current = animFrameId;
        };
        processFrame();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Camera error';
        setOutput((prev) => ({ ...prev, error: msg, isReady: false }));
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      cleanup();
    };
  }, [isActive, cleanup, injectScript]);

  return output;
}
