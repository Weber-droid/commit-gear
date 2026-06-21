import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { ProductCategory } from '../types/index.js';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  slug: ProductCategory;
  name: string;
  description?: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    slug: {
      type: String,
      enum: ['hoodies', 'keycaps', 'desk-pads'],
      required: true,
      unique: true,
    },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    productCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
