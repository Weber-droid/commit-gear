import { Category, type ICategory } from '../models/Category.js';
import type { ProductCategory } from '../types/index.js';

export class CategoryRepository {
  findAll(): Promise<ICategory[]> {
    return Category.find().sort({ name: 1 }).exec();
  }

  findById(id: string): Promise<ICategory | null> {
    return Category.findById(id).exec();
  }

  findBySlug(slug: ProductCategory): Promise<ICategory | null> {
    return Category.findOne({ slug }).exec();
  }

  create(data: Partial<ICategory>): Promise<ICategory> {
    return Category.create(data);
  }

  save(category: ICategory): Promise<ICategory> {
    return category.save();
  }

  deleteById(id: string): Promise<ICategory | null> {
    return Category.findByIdAndDelete(id).exec();
  }

  updateProductCount(slug: ProductCategory, count: number): Promise<void> {
    return Category.updateOne({ slug }, { $set: { productCount: count } }).then(() => undefined);
  }
}
