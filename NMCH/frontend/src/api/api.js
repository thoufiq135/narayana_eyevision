// ---------------------------------------------------------------------------
// api.js — every backend call the app makes lives in this one file.
//
// Real event shape from the backend:
//   { type, timestamp, name, score, track_id, api_status, camera_id, dup_similarity, image, timestamp_tag }
//
//   type values seen: "unknown_new" | "unknown_duplicate" | "unknown_streak_reset" | "known"
// ---------------------------------------------------------------------------

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "" : "http://192.168.0.6:8000")
).replace(/\/$/, "");

const ENDPOINTS = {
  EVENTS: "/recognition/events",
  SUMMARY: "/recognition/events",
  LIVE: "/recognition/live",
};

let eventsCache = null;
let eventsCachePromise = null;
const EVENT_CACHE_TTL_MS = 3000;
const MAX_BACKEND_LIMIT = 200;

const CAMERA_RTSP_URL =
  (import.meta.env.VITE_CAMERA_RTSP_URL ||
    "rtsp://admin:STACKENZO2025@192.168.0.21:554/Streaming/Channels/401?transportmode=unicast").trim();

const CAMERA_STREAM_URL = (import.meta.env.VITE_CAMERA_STREAM_URL || "").trim();

function buildUrl(path, query = {}) {
  const origin = API_BASE_URL || window.location.origin;
  const url = new URL(path, `${origin}/`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function apiRequest(method, path, { query = {}, body, timeoutMs = 5000 } = {}) {
  const url = buildUrl(path, query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }

    if (!res.ok) {
      throw new Error(data?.detail || data?.message || text || `Request failed: ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`Request timed out after ${timeoutMs}ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// -- normalization ------------------------------------------------------

function parseConfidence(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num > 1 ? num : num * 100;
}

/**
 * The backend's `type` field is authoritative:
 *   "known"      -> a recognized person
 *   "unknown_*"  -> an unrecognized person
 */
function classifyPersonType(item) {
  const type = String(item?.type ?? "").trim().toLowerCase();

  // Check type field first (most authoritative)
  if (type === "known" || type.startsWith("known")) return "known";
  if (type === "unknown" || type.startsWith("unknown")) return "unknown";

  // If type is missing or ambiguous, check name
  const name = String(item?.name ?? item?.employee_name ?? "").trim().toLowerCase();
  if (!name || name === "unknown" || name === "null" || name === "") {
    return "unknown";
  }
  
  // If it has a valid name, it's known
  return "known";
}

function hasMeaningfulName(item) {
  const name = String(item?.name ?? item?.employee_name ?? "").trim();
  // Allow "Unknown" as a valid name (it's what the backend sends for unknown events)
  return name.length > 0 && name.toLowerCase() !== "null";
}

/**
 * A row is a real, displayable detection if it has a name.
 * unknown_streak_reset and unknown_duplicate are housekeeping.
 * Score is optional for unknown events.
 */
function shouldDisplayEvent(item) {
  const type = String(item?.type ?? "").trim().toLowerCase();
  
  // Filter out housekeeping events
  if (type === "unknown_streak_reset" || type === "unknown_duplicate") {
    return false;
  }
  
  // Known events should always display
  if (type === "known") {
    return true;
  }
  
  // Unknown events should display if they have a name
  const name = String(item?.name ?? "").trim();
  return name.length > 0;
}

export function filterValidEvents(events = []) {
  return (Array.isArray(events) ? events : []).filter(shouldDisplayEvent);
}

function normalizeImage(item) {
  const value = item?.image;
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.includes("\\") || value.includes("/")) {
    return null; // local file path — can't display directly
  }
  return `data:image/jpeg;base64,${value}`;
}

function normalizeEvent(item) {
  const person_type = classifyPersonType(item);
  const rawName = String(item?.name ?? item?.employee_name ?? "").trim();
  const normalizedName =
    rawName && rawName.toLowerCase() !== "unknown" && rawName.toLowerCase() !== "null"
      ? rawName
      : null;

  let displayName;
  if (person_type === "known") {
    displayName = normalizedName || "Known person";
  } else if (person_type === "unknown") {
    // For unknown events, keep "Unknown" if that's what the backend sent
    displayName = rawName || "Unknown person";
  } else {
    displayName = "Unknown person";
  }

  return {
    id: `${item?.track_id ?? "na"}-${item?.type ?? "evt"}-${item?.timestamp || new Date().toISOString()}`,
    type: person_type,
    name: displayName,
    person_type,
    employee_name: displayName,
    employee_code: person_type === "known" ? (item?.employee_code ?? null) : null,
    track_id: item?.track_id ?? null,
    camera_name: item?.camera_id ? `Camera ${item.camera_id}` : "Camera",
    event_time: item?.timestamp || new Date().toISOString(),
    confidence: Number.isFinite(Number(item?.score))
      ? Math.round(parseConfidence(item.score))
      : null,
    acknowledged: item?.api_status === 200 || item?.api_status === 201,
    image: normalizeImage(item),
    dup_similarity: item?.dup_similarity ?? null,
    raw_type: item?.type ?? null,
    raw_api_status: item?.api_status ?? null,
    rtsp_url: CAMERA_RTSP_URL,
    stream_url: CAMERA_STREAM_URL || CAMERA_RTSP_URL,
  };
}

function buildSummaryFromEvents(events) {
  const today = new Date();
  const todays = events.filter((e) => {
    try { return new Date(e.event_time).toDateString() === today.toDateString(); }
    catch { return true; }
  });
  const known = todays.filter((e) => e.person_type === "known");
  const unknown = todays.filter((e) => e.person_type === "unknown");
  return {
    total_events: todays.length,
    known_events: known.length,
    unknown_events: unknown.length,
    unacknowledged_unknown: unknown.filter((e) => !e.acknowledged).length,
  };
}

async function loadEventsFromBackend(limit = 100) {
  const safeLimit = Math.min(Number.isFinite(Number(limit)) ? Number(limit) : 100, MAX_BACKEND_LIMIT);
  const cacheKey = `events:${safeLimit}`;
  const now = Date.now();

  if (eventsCache && eventsCache.key === cacheKey && now - eventsCache.fetchedAt < EVENT_CACHE_TTL_MS) {
    return eventsCache.value;
  }
  if (eventsCachePromise && eventsCachePromise.key === cacheKey) {
    return eventsCachePromise.promise;
  }

  const promise = (async () => {
    try {
      const payload = await apiRequest("GET", ENDPOINTS.EVENTS, { 
        query: { limit: safeLimit }, 
        timeoutMs: 3000 
      });
      
      // Handle different response formats
      let list = [];
      if (Array.isArray(payload)) {
        list = payload;
      } else if (payload?.events) {
        list = payload.events;
      } else if (payload?.data) {
        list = payload.data;
      } else if (payload?.results) {
        list = payload.results;
      } else {
        list = [];
      }
      
      console.log(`📊 Raw events from backend: ${list.length}`);
      if (list.length > 0) {
        console.log('📋 Sample event:', list[0]);
      }
      
      // Filter out housekeeping events and invalid events
      const filtered = filterValidEvents(list);
      console.log(`✅ Filtered events (valid): ${filtered.length}`);
      
      // Normalize events
      const normalized = filtered
        .map(normalizeEvent)
        .sort((a, b) => new Date(b.event_time) - new Date(a.event_time));

      console.log(`📈 Normalized events: ${normalized.length}`);
      const knownCount = normalized.filter(e => e.person_type === 'known').length;
      const unknownCount = normalized.filter(e => e.person_type === 'unknown').length;
      console.log(`👤 Known events: ${knownCount}`);
      console.log(`❓ Unknown events: ${unknownCount}`);

      eventsCache = { key: cacheKey, fetchedAt: Date.now(), value: normalized };
      return normalized;
    } catch (error) {
      console.error('❌ Error loading events:', error);
      return [];
    }
  })();

  eventsCachePromise = { key: cacheKey, promise };
  try {
    return await promise;
  } finally {
    eventsCachePromise = null;
  }
}

// -- public API -----------------------------------------------------------

export async function getEvents({ limit = 100 } = {}) {
  return loadEventsFromBackend(limit);
}

export async function getKnownEvents(filters = {}) {
  const events = await getEvents(filters);
  return events.filter(isKnownEvent);
}

export async function getUnknownEvents(filters = {}) {
  const events = await getEvents({ limit: filters.limit ?? 100 });
  return events.filter(isUnknownEvent);
}

export async function getSummary() {
  try {
    const events = await getEvents({ limit: 200 });
    return buildSummaryFromEvents(events);
  } catch {
    return { total_events: 0, known_events: 0, unknown_events: 0, unacknowledged_unknown: 0 };
  }
}

export async function getCameras() {
  const events = await getEvents({ limit: 200 }).catch(() => []);
  const byCamera = new Map();

  for (const event of events) {
    const key = event.camera_name || "Camera";
    const existing = byCamera.get(key);
    if (!existing) {
      byCamera.set(key, {
        id: key,
        name: key,
        rtsp_url: event.rtsp_url,
        stream_url: event.stream_url,
        lastEventTime: event.event_time,
        lastPersonName: event.person_type === "known" ? event.employee_name : "Unknown visitor",
        lastPersonType: event.person_type,
        detectionCount: 1,
      });
    } else {
      existing.detectionCount += 1;
      if (new Date(event.event_time) > new Date(existing.lastEventTime)) {
        existing.lastEventTime = event.event_time;
        existing.lastPersonName = event.person_type === "known" ? event.employee_name : "Unknown visitor";
        existing.lastPersonType = event.person_type;
      }
    }
  }

  return Array.from(byCamera.values()).sort((a, b) => new Date(b.lastEventTime) - new Date(a.lastEventTime));
}

export const getEmployees = async () => {
  try {
    return await apiRequest("GET", "/employees", { timeoutMs: 1500 });
  } catch (err) {
    console.warn("getEmployees: falling back to empty list —", err.message);
    return [];
  }
};

// -- Event classification helpers -----------------------------------------

export function isKnownEvent(event) {
  if (!event) return false;
  // Check raw_type first (most reliable)
  if (event.raw_type === "known" || event.raw_type?.startsWith("known")) return true;
  // Then check type and person_type
  const type = event?.type || event?.person_type || '';
  return type === "known" || type.startsWith("known");
}

export function isUnknownEvent(event) {
  if (!event) return false;
  // Check raw_type first (most reliable)
  if (event.raw_type === "unknown" || event.raw_type === "unknown_new" || event.raw_type?.startsWith("unknown")) return true;
  // Then check type and person_type
  const type = event?.type || event?.person_type || '';
  return type === "unknown" || type === "unknown_new" || type.startsWith("unknown");
}

// -- Live simulation (dev only) --------------------------------------------

export function subscribeLive(callback) {
  console.log('🔴 Live subscription started');
  return () => {
    console.log('🔴 Live subscription ended');
  };
}

export function startLiveSimulation({ intervalMs = 14000 } = {}) {
  const intervalId = setInterval(() => {
    const isKnown = Math.random() > 0.7;
    const event = {
      type: isKnown ? 'known' : 'unknown_new',
      timestamp: new Date().toISOString(),
      name: isKnown ? ['Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel'][Math.floor(Math.random() * 4)] : 'Unknown',
      score: isKnown ? 0.85 + Math.random() * 0.14 : 0.15 + Math.random() * 0.20,
      track_id: Math.floor(Math.random() * 1000),
      api_status: 200,
      camera_id: Math.floor(Math.random() * 5) + 1,
      image: null,
    };
    console.log('🔄 Simulated event:', event);
    
    if (typeof callback === 'function') {
      callback({ type: 'new_event', event });
    }
  }, intervalMs);
  
  return () => {
    clearInterval(intervalId);
    console.log('🔄 Live simulation stopped');
  };
}

// -- Acknowledge event ----------------------------------------------------

export async function acknowledgeEvent(eventId) {
  console.log(`✅ Acknowledging event: ${eventId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id: eventId,
    acknowledged: true,
    acknowledged_at: new Date().toISOString()
  };
}