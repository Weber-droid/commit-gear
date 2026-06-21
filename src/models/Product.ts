import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { ProductCategory } from '../types/index.js';

export interface IProduct extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  inventory: number;
  vendorId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 1 },
    category: {
      type: String,
      enum: ['hoodies', 'keycaps', 'desk-pads'],
      required: true,
    },
    images: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length >= 1 && v.length <= 10, 'Invalid images count'],
    },
    inventory: { type: Number, required: true, min: 0 },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, price: 1, isActive: 1 });
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ vendorId: 1, createdAt: -1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
