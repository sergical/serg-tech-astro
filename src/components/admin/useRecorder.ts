import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_MS = 5 * 60 * 1000;

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

function pickMimeType(): string | undefined {
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

export interface RecorderState {
  active: boolean;
  seconds: number;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
}

// Records a single take and resolves the pending stop() promise with the blob once
// the last dataavailable event fires. One instance is reused across dictate/instruct
// toggles by callers that only ever run one recording at a time.
export function useRecorder(onError: (message: string) => void): RecorderState {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const stopResolveRef = useRef<((blob: Blob | null) => void) | null>(null);
  // Holds a take that ended on its own (the 5-minute cap) until the caller asks for it.
  const finishedRef = useRef<Blob | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setActive(false);
    setSeconds(0);
  }, []);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      finishedRef.current = null;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType ?? 'audio/webm' });
        if (stopResolveRef.current) {
          stopResolveRef.current(blob);
          stopResolveRef.current = null;
        } else {
          finishedRef.current = blob;
        }
        cleanup();
      };
      streamRef.current = stream;
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setActive(true);
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setSeconds(Math.floor(elapsed / 1000));
        if (elapsed >= MAX_MS && recorder.state === 'recording') recorder.stop();
      }, 250);
    } catch {
      onError('microphone permission denied');
    }
  }, [cleanup, onError]);

  const stop = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder) {
      const finished = finishedRef.current;
      finishedRef.current = null;
      return Promise.resolve(finished);
    }
    return new Promise((resolve) => {
      stopResolveRef.current = resolve;
      recorder.stop();
    });
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  return { active, seconds, start, stop };
}
