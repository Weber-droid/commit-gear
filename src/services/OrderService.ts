import mongoose, { Types } from 'mongoose';
import { CartRepository } from '../repositories/CartRepository.js';
import { ProductRepository } from '../repositories/ProductRepository.js';
import { OrderRepository } from '../repositories/OrderRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../utils/AppError.js';
import { toOrderResponse } from '../utils/serializers.js';
import type { AuthUser, OrderStatusType } from '../types/index.js';
import type { IShippingAddress } from '../models/Order.js';

export class OrderService {
  constructor(
    private readonly cartRepo = new CartRepository(),
    private readonly productRepo = new ProductRepository(),
    private readonly orderRepo = new OrderRepository(),
    private readonly userRepo = new UserRepository()
  ) {}

  async checkout(userId: string, shippingAddress: IShippingAddress) {
    const cart = await this.cartRepo.findOrCreate(userId);
    if (!cart.items.length) {
      throw new AppError('Cart is empty', 400, 'CART_EMPTY');
    }

    const lineItems: Array<{
      productId: string;
      title: string;
      priceAtPurchase: number;
      quantity: number;
      imageSnapshot: string;
    }> = [];

    for (const item of cart.items) {
      const product = await this.productRepo.findActiveById(item.productId.toString());
      if (!product || product.inventory < item.quantity) {
        throw new ConflictError('Insufficient inventory for one or more items', 'INVENTORY_CONFLICT', {
          conflicts: [
            {
              productId: item.productId.toString(),
              requested: item.quantity,
              available: product?.inventory ?? 0,
            },
          ],
        });
      }
      lineItems.push({
        productId: product._id.toString(),
        title: product.title,
        priceAtPurchase: product.price,
        quantity: item.quantity,
        imageSnapshot: product.images[0] ?? '',
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const item of lineItems) {
        const updated = await this.productRepo.decrementInventory(
          item.productId,
          item.quantity,
          session
        );
        if (!updated) {
          throw new ConflictError('Insufficient inventory for one or more items', 'INVENTORY_CONFLICT');
        }
      }

      const totalAmount = lineItems.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );

      const orders = await this.orderRepo.create(
        {
          userId: new Types.ObjectId(userId),
          items: lineItems.map((item) => ({
            ...item,
            productId: new Types.ObjectId(item.productId),
          })),
          totalAmount,
          paymentStatus: 'pending',
          paymentProvider: 'paystack',
          status: 'pending',
          shippingAddress,
        },
        session
      );

      await this.cartRepo.clearByUserId(userId, session);
      await session.commitTransaction();

      return toOrderResponse(orders[0]);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async listForUser(userId: string, page: number, limit: number, status?: OrderStatusType) {
    const { items, total } = await this.orderRepo.list({ page, limit, userId, status });
    return { items: items.map(toOrderResponse), total };
  }

  async listAll(page: number, limit: number, filters: { status?: OrderStatusType; paymentStatus?: string }) {
    const { items, total } = await this.orderRepo.list({
      page,
      limit,
      status: filters.status,
      paymentStatus: filters.paymentStatus as import('../types/index.js').PaymentStatusType | undefined,
    });
    return { items: items.map(toOrderResponse), total };
  }

  async getById(user: AuthUser, orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (user.role !== 'admin' && order.userId.toString() !== user.id) {
      throw new ForbiddenError('Order access denied');
    }

    return toOrderResponse(order);
  }

  async updateStatus(orderId: string, status: OrderStatusType) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    order.status = status;
    await this.orderRepo.save(order);
    return toOrderResponse(order);
  }

  async getOrderForPayment(userId: string, orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.userId.toString() !== userId) throw new ForbiddenError('Order access denied');
    if (order.paymentStatus === 'paid') {
      throw new AppError('Order is not in a payable state', 400, 'ORDER_NOT_PAYABLE');
    }
    return order;
  }

  async findByReference(reference: string) {
    return this.orderRepo.findByReference(reference);
  }

  async saveOrder(order: NonNullable<Awaited<ReturnType<OrderRepository['findById']>>>) {
    return this.orderRepo.save(order);
  }

  async getUserEmail(userId: string) {
    const user = await this.userRepo.findById(userId);
    return user?.email ?? '';
  }
}
