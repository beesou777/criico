import { describe, expect, it } from 'vitest';
import {
  pageHref,
  pageNumbers,
  paginationMeta,
  playerListQuerySchema,
  urlQuery,
} from '../src/lib/pagination';
describe('Pagination contract', () => {
  it('returns the requested metadata shape', () => {
    expect(paginationMeta(156, { page: 1, limit: 20 })).toEqual({
      page: 1,
      limit: 20,
      totalItems: 156,
      totalPages: 8,
      hasNextPage: true,
      hasPreviousPage: false,
      nextPage: 2,
      previousPage: null,
    });
  });
  it('handles empty, exact-boundary, last, and stale pages', () => {
    expect(paginationMeta(0, { page: 99, limit: 20 })).toMatchObject({
      page: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: null,
      previousPage: null,
    });
    expect(paginationMeta(40, { page: 2, limit: 20 })).toMatchObject({
      page: 2,
      totalPages: 2,
      nextPage: null,
      previousPage: 1,
    });
    expect(paginationMeta(41, { page: 99, limit: 20 })).toMatchObject({
      page: 3,
      totalPages: 3,
      previousPage: 2,
    });
  });
  it('validates pagination, repeated query keys, and role filters', () => {
    expect(playerListQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
      search: '',
    });
    for (const page of ['0', '-1', '1.5', 'abc', '', ['1', '2'], '1000001'])
      expect(playerListQuerySchema.safeParse({ page }).success).toBe(false);
    expect(playerListQuerySchema.safeParse({ limit: '101' }).success).toBe(
      false,
    );
    expect(playerListQuerySchema.safeParse({ role: 'Captain' }).success).toBe(
      false,
    );
    expect(
      playerListQuerySchema.safeParse(
        urlQuery(new URLSearchParams('page=1&page=2')),
      ).success,
    ).toBe(false);
  });
  it('preserves filters when navigating and resets page when changing size', () => {
    const query = new URLSearchParams(
      'search=Aarav&role=Bowler&page=3&limit=20',
    );
    expect(pageHref('/dashboard/players', query, 4)).toBe(
      '/dashboard/players?search=Aarav&role=Bowler&page=4&limit=20',
    );
    expect(pageHref('/dashboard/players', query, 1, 50)).toContain(
      'page=1&limit=50',
    );
    expect(pageNumbers(4, 8)).toEqual([1, 'ellipsis', 3, 4, 5, 'ellipsis', 8]);
    expect(pageNumbers(1, 0)).toEqual([]);
  });
});
