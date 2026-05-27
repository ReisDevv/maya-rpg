export const MAX_PAGE_SIZE = 100;

export function clampPagination(
  page: number,
  pageSize: number,
  maxPageSize: number = MAX_PAGE_SIZE,
): { page: number; pageSize: number } {
  return {
    page: Math.max(1, page),
    pageSize: Math.min(Math.max(1, pageSize), maxPageSize),
  };
}
