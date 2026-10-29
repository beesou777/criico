import { z } from 'zod';

const positiveInteger = (fallback: number, maximum: number) =>
  z.preprocess(
    (value) =>
      value === undefined
        ? fallback
        : typeof value === 'string' && /^\d+$/.test(value)
          ? Number(value)
          : value,
    z.number().int().min(1).max(maximum),
  );
export const paginationQuerySchema = z.object({
  page: positiveInteger(1, 1_000_000),
  limit: positiveInteger(20, 100),
});
export const playerListQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().trim().max(80).default(''),
    role: z
      .enum(['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'])
      .optional(),
    teamId: z.string().uuid().optional(),
    sort: z
      .enum([
        'impact',
        'name',
        'team',
        'matches',
        'runs',
        'wickets',
        'basePrice',
      ])
      .optional(),
    direction: z.enum(['asc', 'desc']).optional(),
  })
  .strict();
export const matchListQuerySchema = paginationQuerySchema.strict();
export type PaginationInput = z.infer<typeof paginationQuerySchema>;
export type PlayerListQuery = z.infer<typeof playerListQuerySchema>;
export type SearchParams = Record<string, string | string[] | undefined>;
export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().int().positive().nullable(),
  previousPage: z.number().int().positive().nullable(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
export function paginationMeta(
  totalItems: number,
  input: PaginationInput,
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / input.limit);
  const page = Math.min(input.page, Math.max(1, totalPages));
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  return {
    page,
    limit: input.limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? page + 1 : null,
    previousPage: hasPreviousPage ? page - 1 : null,
  };
}
export function urlQuery(
  searchParams: URLSearchParams,
): Record<string, unknown> {
  return Object.fromEntries(
    [...new Set(searchParams.keys())].map((key) => {
      const values = searchParams.getAll(key);
      return [key, values.length === 1 ? values[0] : values];
    }),
  );
}
export function pageHref(
  pathname: string,
  query: URLSearchParams,
  page: number,
  limit?: number,
): string {
  const next = new URLSearchParams(query);
  next.set('page', String(page));
  if (limit !== undefined) next.set('limit', String(limit));
  return `${pathname}?${next.toString()}`;
}
export function pageNumbers(
  page: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  const candidates = [...new Set([1, totalPages, page - 1, page, page + 1])]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  for (const [index, number] of candidates.entries()) {
    const previous = candidates[index - 1];
    if (previous !== undefined && number - previous > 1)
      result.push('ellipsis');
    result.push(number);
  }
  return result;
}
