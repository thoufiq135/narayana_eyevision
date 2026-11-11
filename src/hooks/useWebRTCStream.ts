import { useEffect, useRef, useState } from 'react';

type StreamStatus = 'idle' | 'connecting' | 'live' | 'error';

// The RTSP source (with credentials) lives server-side only, in
// mediamtx.yml's `paths:` section. The browser can never fetch() an
// rtsp:// URL. MediaMTX bridges RTSP -> WebRTC and exposes that bridge
// over HTTP as a WHEP endpoint, which is what this hook talks to.
const MEDIAMTX_URL = import.meta.env.VITE_MEDIAMTX_URL ?? 'http://localhost:8889';

// export const CAMERA_ID_TO_PATH: Record<string, string> = {
  // 'cam-01': import.meta.env.VITE_CAMERA_GATE_ID ?? 'entry_gate',
// };
 
// export function resolveCameraPath(camera: { id: string } | undefined): string | undefined {
  // if (!camera) return undefined;
  // return CAMERA_ID_TO_PATH[camera.id]; // undefined if this camera has no real RTSP feed yet
// }

export function useWebRTCStream(cameraPath: string | undefined) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!cameraPath) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    // WHEP endpoint is {mediamtx}/{path}/whep — NOT a recognition/detection
    // endpoint. This must match a `paths:` entry name in mediamtx.yml.
    const whepUrl = `${MEDIAMTX_URL}/${cameraPath}/whep`;

    const closePeerConnection = (pc: RTCPeerConnection | null) => {
      if (!pc) return;
      pc.getReceivers().forEach((r) => r.track?.stop());
      pc.close();
      if (pcRef.current === pc) pcRef.current = null;
    };

    const scheduleRetry = () => {
      if (cancelled) return;
      retryTimer = setTimeout(connect, 3000);
    };

    async function connect() {
      if (cancelled) return;

      // Tear down any previous, still-open connection from an earlier
      // retry attempt before opening a new one — otherwise failed
      // connections pile up instead of being replaced.
      closePeerConnection(pcRef.current);

      try {
        setStatus('connecting');

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        pc.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            if (!cancelled) setStatus('live');
          }
        };

        pc.onconnectionstatechange = () => {
          if (cancelled) return;
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            setStatus('error');
            closePeerConnection(pc);
            scheduleRetry();
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // WHEP expects a complete offer (all ICE candidates gathered).
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') return resolve();
          const check = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', check);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', check);
          setTimeout(resolve, 2000);
        });

        if (cancelled) {
          closePeerConnection(pc);
          return;
        }

        // WHEP: POST raw SDP with Content-Type application/sdp,
        // response body is raw SDP text — not JSON.
        const res = await fetch(whepUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
            Accept: 'application/sdp',
          },
          body: pc.localDescription?.sdp,
        });

        if (!res.ok) {
          throw new Error(`WHEP request failed: ${res.status} ${res.statusText}`);
        }

        const answerSdp = await res.text();
        if (cancelled) {
          closePeerConnection(pc);
          return;
        }

        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      } catch (err) {
        // console.error('WebRTC connection error:', err);
        if (!cancelled) {
          setStatus('error');
          closePeerConnection(pcRef.current);
          scheduleRetry();
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      closePeerConnection(pcRef.current);
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setStatus('idle');
    };
  }, [cameraPath]);

  return { videoRef, status };
}