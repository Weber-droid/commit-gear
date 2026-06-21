import type { CacheProvider } from '../types/index.js';
import { ProductRepository, type ProductListQuery } from '../repositories/ProductRepository.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { ForbiddenError, NotFoundError } from '../utils/AppError.js';
import { toProductResponse } from '../utils/serializers.js';
import {
  buildProductListCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
} from '../utils/cacheKeys.js';
import type { AuthUser, ProductCategory } from '../types/index.js';
import type { IProduct } from '../models/Product.js';

export class ProductService {
  constructor(
    private readonly productRepo = new ProductRepository(),
    private readonly categoryRepo = new CategoryRepository(),
    private readonly cache: CacheProvider
  ) {}

  private async evictProductCaches(productId?: string) {
    await this.cache.delByPattern(CACHE_KEYS.productsListPattern);
    if (productId) await this.cache.del(CACHE_KEYS.productDetail(productId));
  }

  async list(query: ProductListQuery) {
    const cacheKey = buildProductListCacheKey({ ...query });
    const cached = await this.cache.get<{ items: ReturnType<typeof toProductResponse>[]; total: number }>(cacheKey);
    if (cached) return cached;

    const { items, total } = await this.productRepo.list(query);
    const result = {
      items: items.map(toProductResponse),
      total,
    };
    await this.cache.set(cacheKey, result, CACHE_TTL.productsList);
    return result;
  }

  async getById(id: string) {
    const cacheKey = CACHE_KEYS.productDetail(id);
    const cached = await this.cache.get<ReturnType<typeof toProductResponse>>(cacheKey);
    if (cached) return cached;

    const product = await this.productRepo.findActiveById(id);
    if (!product) throw new NotFoundError('Product not found');

    const response = toProductResponse(product);
    await this.cache.set(cacheKey, response, CACHE_TTL.productDetail);
    return response;
  }

  async create(user: AuthUser, data: Partial<IProduct>) {
    if (user.role !== 'vendor' && user.role !== 'admin') {
      throw new ForbiddenError();
    }

    const product = await this.productRepo.create({
      ...data,
      vendorId: data.vendorId ?? user.id,
      isActive: true,
    } as IProduct);

    await this.evictProductCaches();
    await this.categoryRepo.updateProductCount(product.category, await this.productRepo.countByCategory(product.category));

    return toProductResponse(product);
  }

  async update(user: AuthUser, id: string, data: Partial<IProduct>) {
    const product = await this.productRepo.findById(id);
    if (!product || !product.isActive) throw new NotFoundError('Product not found');

    if (user.role === 'vendor' && product.vendorId.toString() !== user.id) {
      throw new ForbiddenError();
    }
    if (user.role !== 'vendor' && user.role !== 'admin') throw new ForbiddenError();

    Object.assign(product, data);
    await this.productRepo.save(product);
    await this.evictProductCaches(id);

    return toProductResponse(product);
  }

  async softDelete(user: AuthUser, id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Product not found');

    if (user.role === 'vendor' && product.vendorId.toString() !== user.id) {
      throw new ForbiddenError();
    }
    if (user.role !== 'vendor' && user.role !== 'admin') throw new ForbiddenError();

    product.isActive = false;
    await this.productRepo.save(product);
    await this.evictProductCaches(id);
    await this.categoryRepo.updateProductCount(
      product.category as ProductCategory,
      await this.productRepo.countByCategory(product.category as ProductCategory)
    );

    return { id: product._id.toString(), isActive: false };
  }

  async overrideInventory(id: string, inventory: number) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    product.inventory = inventory;
    await this.productRepo.save(product);
    await this.evictProductCaches(id);
    return toProductResponse(product);
  }
}
