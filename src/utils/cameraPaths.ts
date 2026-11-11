// The store's camera.id (cam-01, cam-02, ...) is a display/mock identifier
// and is NOT the same string as a mediamtx `paths:` entry name. Right now
// only one physical RTSP camera exists (the entry gate, wired up in
// mediamtx.yml as `entry_gate`), so only cam-01 resolves to a real feed.
// Add an entry here whenever another physical camera is connected.
export const CAMERA_ID_TO_PATH: Record<string, string> = {
  'cam-01': import.meta.env.VITE_CAMERA_GATE_ID ?? 'entry_gate',
};

export function resolveCameraPath(camera: { id: string } | undefined): string | undefined {
  if (!camera) return undefined;
  return CAMERA_ID_TO_PATH[camera.id]; // undefined if this camera has no real RTSP feed yet
}