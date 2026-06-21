import type { PaymentProvider } from '../types/index.js';
import { OrderService } from './OrderService.js';
import { AppError, NotFoundError } from '../utils/AppError.js';
import { toOrderResponse } from '../utils/serializers.js';

export class PaymentService {
  constructor(
    private readonly paymentProvider: PaymentProvider,
    private readonly orderService: OrderService
  ) {}

  async initialize(userId: string, orderId: string, callbackUrl?: string) {
    const order = await this.orderService.getOrderForPayment(userId, orderId);
    const email = await this.orderService.getUserEmail(userId);

    if (order.paymentReference) {
      return {
        authorizationUrl: `https://checkout.paystack.com/${order.paymentReference}`,
        reference: order.paymentReference,
        accessCode: order.paymentReference,
        provider: 'paystack' as const,
      };
    }

    const session = await this.paymentProvider.initializeCheckout({
      orderId: order._id.toString(),
      amount: order.totalAmount,
      email,
      callbackUrl,
      metadata: { orderId: order._id.toString() },
    });

    order.paymentReference = session.reference;
    await this.orderService.saveOrder(order);

    return session;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const event = await this.paymentProvider.verifyWebhook(rawBody, signature);
    const order = await this.orderService.findByReference(event.reference);

    if (!order) return { received: true, processed: false };

    if (event.type === 'charge.success') {
      if (order.paymentStatus === 'paid') {
        return { received: true, processed: false };
      }
      if (event.amount !== order.totalAmount) {
        throw new AppError('Payment amount mismatch', 400, 'AMOUNT_MISMATCH');
      }
      order.paymentStatus = 'paid';
      order.status = 'processing';
    } else if (event.type === 'charge.failed') {
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
      }
    }

    await this.orderService.saveOrder(order);
    return { received: true, processed: true };
  }

  async verify(userId: string, reference: string) {
    const order = await this.orderService.findByReference(reference);
    if (!order) throw new NotFoundError('Payment reference not found');

    if (order.userId.toString() !== userId) {
      throw new AppError('Order access denied', 403, 'FORBIDDEN');
    }

    if (order.paymentStatus === 'pending') {
      const status = await this.paymentProvider.verifyTransaction(reference);
      if (status.status === 'paid') {
        order.paymentStatus = 'paid';
        order.status = 'processing';
        await this.orderService.saveOrder(order);
      }
    }

    return {
      reference,
      paymentStatus: order.paymentStatus,
      orderId: order._id.toString(),
    };
  }
}
