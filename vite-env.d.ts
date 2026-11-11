/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DETECTION_WS_URL: string;
  readonly VITE_MEDIAMTX_URL: string;
  readonly VITE_CAMERA_GATE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}