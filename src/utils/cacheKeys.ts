import crypto from 'crypto';

export const CACHE_TTL = {
  categories: 3600,
  productsList: 300,
  productDetail: 600,
} as const;

export function buildProductListCacheKey(params: {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
}): string {
  const normalized = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    category: params.category ?? null,
    minPrice: params.minPrice ?? null,
    maxPrice: params.maxPrice ?? null,
    q: params.q ?? null,
  };
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')
    .slice(0, 16);
  return `products:list:${hash}`;
}

export const CACHE_KEYS = {
  categoriesAll: 'categories:all',
  productDetail: (id: string) => `products:detail:${id}`,
  productsListPattern: 'products:list:*',
  productDetailPattern: (id: string) => `products:detail:${id}`,
} as const;
