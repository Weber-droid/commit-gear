import { Product, type IProduct } from '../models/Product.js';
import type { ProductCategory } from '../types/index.js';
import type { ClientSession } from 'mongoose';

export interface ProductListQuery {
  page: number;
  limit: number;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
}

export class ProductRepository {
  findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).exec();
  }

  findActiveById(id: string): Promise<IProduct | null> {
    return Product.findOne({ _id: id, isActive: true }).exec();
  }

  async list(query: ProductListQuery): Promise<{ items: IProduct[]; total: number }> {
    const filter: Record<string, unknown> = { isActive: true };

    if (query.category) filter.category = query.category;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) (filter.price as Record<string, number>).$gte = query.minPrice;
      if (query.maxPrice !== undefined) (filter.price as Record<string, number>).$lte = query.maxPrice;
    }
    if (query.q) {
      filter.$text = { $search: query.q };
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      Product.find(filter, query.q ? { score: { $meta: 'textScore' } } : {})
        .sort(query.q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      Product.countDocuments(filter),
    ]);

    return { items, total };
  }

  create(data: Partial<IProduct>): Promise<IProduct> {
    return Product.create(data);
  }

  save(product: IProduct): Promise<IProduct> {
    return product.save();
  }

  decrementInventory(
    productId: string,
    quantity: number,
    session?: ClientSession
  ): Promise<IProduct | null> {
    return Product.findOneAndUpdate(
      { _id: productId, inventory: { $gte: quantity }, isActive: true },
      { $inc: { inventory: -quantity } },
      { new: true, session }
    ).exec();
  }

  countByCategory(category: ProductCategory): Promise<number> {
    return Product.countDocuments({ category, isActive: true });
  }
}
