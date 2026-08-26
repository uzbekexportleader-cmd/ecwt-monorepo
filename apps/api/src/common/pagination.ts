import type { Paginated, PaginationQuery } from '@ecwt/contracts';

export function toSkipTake(query: PaginationQuery): { skip: number; take: number } {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  };
}

export function paginate<T>(items: T[], total: number, query: PaginationQuery): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    items,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNext: query.page < totalPages,
    },
  };
}
