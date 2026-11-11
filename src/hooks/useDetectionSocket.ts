import { useEffect, useRef, useState } from 'react';


export interface DetectionBox {
  id: string;
  label: string;
  confidence: number;
  known: boolean;
  x: number; 
  y: number;
  w: number;
  h: number;
}

const DETECTION_WS_URL = import.meta.env.VITE_DETECTION_WS_URL ?? 'ws://localhost:8080/detections';

export function useDetectionSocket(cameraId: string | undefined) {
  const [boxes, setBoxes] = useState<DetectionBox[]>([]);
  const [personCount, setPersonCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!cameraId) return;

    const ws = new WebSocket(`${DETECTION_WS_URL}/${cameraId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setBoxes(data.boxes ?? []);
        setPersonCount(data.boxes?.length ?? 0);
      } catch (err) {
        // console.error('Bad detection payload:', err);
      }
    };

    // ws.onerror = (err) => console.error('Detection socket error:', err);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [cameraId]);

  return { boxes, personCount };
}