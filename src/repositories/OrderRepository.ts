import { Order, type IOrder } from '../models/Order.js';
import type { OrderStatusType, PaymentStatusType } from '../types/index.js';

export interface OrderListQuery {
  page: number;
  limit: number;
  userId?: string;
  status?: OrderStatusType;
  paymentStatus?: PaymentStatusType;
}

export class OrderRepository {
  findById(id: string): Promise<IOrder | null> {
    return Order.findById(id).exec();
  }

  findByReference(reference: string): Promise<IOrder | null> {
    return Order.findOne({ paymentReference: reference }).exec();
  }

  async list(query: OrderListQuery): Promise<{ items: IOrder[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (query.userId) filter.userId = query.userId;
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).exec(),
      Order.countDocuments(filter),
    ]);

    return { items, total };
  }

  create(data: Partial<IOrder>, session?: import('mongoose').ClientSession): Promise<IOrder[]> {
    return Order.create([data], { session });
  }

  save(order: IOrder): Promise<IOrder> {
    return order.save();
  }
}
