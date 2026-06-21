import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { OrderStatusType, PaymentStatusType } from '../types/index.js';

export interface IOrderItemSnapshot {
  productId: Types.ObjectId;
  title: string;
  priceAtPurchase: number;
  quantity: number;
  imageSnapshot: string;
}

export interface IShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: IOrderItemSnapshot[];
  totalAmount: number;
  paymentStatus: PaymentStatusType;
  paymentProvider: 'paystack';
  paymentReference?: string | null;
  status: OrderStatusType;
  shippingAddress: IShippingAddress;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItemSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    priceAtPurchase: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    imageSnapshot: { type: String, required: true },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true, validate: [(v: unknown[]) => v.length > 0, 'Order must have items'] },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentProvider: { type: String, enum: ['paystack'], default: 'paystack' },
    paymentReference: { type: String, sparse: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentReference: 1 }, { unique: true, sparse: true });
orderSchema.index({ paymentStatus: 1, status: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
