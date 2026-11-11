export type Pagination = {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
};

export type DashboardApiResponse<T> = {
  success?: boolean;
  pagination?: Pagination;
  data?: T[];
  items?: T[];
  results?: T[];
};

export const normalizeDashboardResponse = <T>(
  payload?: DashboardApiResponse<T> | null
) => {
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.results)
        ? payload.results
        : [];

  const pagination: Pagination = payload?.pagination ?? {
    currentPage: 1,
    totalPages: 1,
    totalRecords: rows.length,
    recordsPerPage: rows.length || 10,
  };

  return {
    success: !!payload?.success,
    rows,
    pagination,
  };
};