'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { StressResult, Intervention } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export function useWebSocket() {
  const token = useAppStore((s) => s.token);
  const sessionId = useAppStore((s) => s.sessionId);
  const setWsConnected = useAppStore((s) => s.setWsConnected);
  const setStressResult = useAppStore((s) => s.setStressResult);
  const enqueueInterventions = useAppStore((s) => s.enqueueInterventions);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const url = token ? `${WS_URL}/ws?token=${token}` : `${WS_URL}/ws`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelay.current = 1000;
      setWsConnected(true);
      if (sessionId) {
        ws.send(JSON.stringify({ type: 'session_start', data: { sessionId } }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'stress_result') {
          setStressResult(msg.data as StressResult);
        } else if (msg.type === 'intervention') {
          const { interventions } = msg.data as { interventions: Intervention[] };
          if (interventions?.length > 0) {
            enqueueInterventions(interventions);
          }
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setWsConnected(false);
      if (!mountedRef.current) return;
      // Exponential backoff reconnect (max 30s)
      const delay = Math.min(reconnectDelay.current, 30000);
      reconnectDelay.current = delay * 2;
      reconnectRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token, sessionId, setWsConnected, setStressResult, enqueueInterventions]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const sendMessage = useCallback((type: string, data: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data }));
    }
  }, []);

  return { sendMessage };
}
