import type { CacheProvider } from '../types/index.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { ProductRepository } from '../repositories/ProductRepository.js';
import { ConflictError, NotFoundError } from '../utils/AppError.js';
import { toCategoryResponse } from '../utils/serializers.js';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cacheKeys.js';
import type { ProductCategory } from '../types/index.js';

export class CategoryService {
  constructor(
    private readonly categoryRepo = new CategoryRepository(),
    private readonly productRepo = new ProductRepository(),
    private readonly cache: CacheProvider
  ) {}

  private async evictCaches() {
    await this.cache.del(CACHE_KEYS.categoriesAll);
    await this.cache.delByPattern(CACHE_KEYS.productsListPattern);
  }

  async list() {
    const cached = await this.cache.get<ReturnType<typeof toCategoryResponse>[]>(CACHE_KEYS.categoriesAll);
    if (cached) return cached;

    const categories = await this.categoryRepo.findAll();
    const response = categories.map(toCategoryResponse);
    await this.cache.set(CACHE_KEYS.categoriesAll, response, CACHE_TTL.categories);
    return response;
  }

  async getById(id: string) {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundError('Category not found');
    return toCategoryResponse(category);
  }

  async create(data: { slug: ProductCategory; name: string; description?: string }) {
    const existing = await this.categoryRepo.findBySlug(data.slug);
    if (existing) throw new ConflictError('Category slug already exists', 'SLUG_EXISTS');

    const category = await this.categoryRepo.create({
      ...data,
      productCount: 0,
    });
    await this.evictCaches();
    return toCategoryResponse(category);
  }

  async update(id: string, data: { name?: string; description?: string }) {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundError('Category not found');

    if (data.name) category.name = data.name;
    if (data.description !== undefined) category.description = data.description;
    await this.categoryRepo.save(category);
    await this.evictCaches();
    return toCategoryResponse(category);
  }

  async delete(id: string) {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundError('Category not found');

    const count = await this.productRepo.countByCategory(category.slug);
    if (count > 0) {
      throw new ConflictError('Cannot delete category with active products', 'CATEGORY_HAS_PRODUCTS');
    }

    await this.categoryRepo.deleteById(id);
    await this.evictCaches();
    return { id };
  }
}
