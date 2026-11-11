export type ApiPaginatedResponse<T> = {
  success?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
  };
  data?: T[];
  items?: T[];
  results?: T[];
};

export const normalizeListResponse = <T>(payload?: ApiPaginatedResponse<T> | T[] | null): T[] => {
  if (Array.isArray(payload)) return payload as T[];

  if (!payload) return [];

  if (Array.isArray(payload.data)) return payload.data as T[];
  if (Array.isArray(payload.items)) return payload.items as T[];
  if (Array.isArray(payload.results)) return payload.results as T[];

  return [];
};

export const fetchKnownData = async <T = any>(
  date: string,
  hallId: string
): Promise<T[]> => {
  const res = await fetch(`/getData/known-data?date=${encodeURIComponent(date)}&hallId=${encodeURIComponent(hallId)}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  const json = await res.json();
  return normalizeListResponse<T>(json);
};

export const fetchUnknownData = async <T = any>(
  date: string,
  hallId: string
): Promise<T[]> => {
  const res = await fetch(`/getData/unknown-data?date=${encodeURIComponent(date)}&hallId=${encodeURIComponent(hallId)}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  const json = await res.json();
  return normalizeListResponse<T>(json);
};