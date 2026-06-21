import crypto from 'crypto';
import type {
  CheckoutInput,
  PaymentProvider,
  PaymentSession,
  PaymentStatus,
  WebhookEvent,
} from '../types/index.js';
import { AppError } from '../utils/AppError.js';

interface PaystackConfig {
  secretKey: string;
  webhookSecret: string;
}

interface PaystackInitResponse {
  status: boolean;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  data: {
    status: string;
    reference: string;
    amount: number;
    metadata?: Record<string, unknown>;
  };
}

export class PaystackProvider implements PaymentProvider {
  readonly name = 'paystack';
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(config: PaystackConfig) {
    this.secretKey = config.secretKey;
    this.webhookSecret = config.webhookSecret;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.paystack.co${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new AppError('Paystack request failed', 502, 'PAYMENT_PROVIDER_ERROR');
    }

    return response.json() as Promise<T>;
  }

  async initializeCheckout(input: CheckoutInput): Promise<PaymentSession> {
    const body = {
      email: input.email,
      amount: input.amount,
      callback_url: input.callbackUrl,
      metadata: {
        orderId: input.orderId,
        ...input.metadata,
      },
    };

    const result = await this.request<PaystackInitResponse>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!result.status) {
      throw new AppError('Failed to initialize payment', 502, 'PAYMENT_INIT_FAILED');
    }

    return {
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
      accessCode: result.data.access_code,
      provider: 'paystack',
    };
  }

  async verifyWebhook(rawBody: Buffer, signature: string): Promise<WebhookEvent> {
    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      throw new AppError('Invalid webhook signature', 401, 'INVALID_SIGNATURE');
    }

    const payload = JSON.parse(rawBody.toString()) as {
      event: string;
      data: {
        reference: string;
        amount: number;
        metadata?: Record<string, unknown>;
      };
    };

    const type =
      payload.event === 'charge.success'
        ? 'charge.success'
        : payload.event === 'charge.failed'
          ? 'charge.failed'
          : null;

    if (!type) {
      throw new AppError('Unsupported webhook event', 400, 'INVALID_PAYLOAD');
    }

    return {
      type,
      reference: payload.data.reference,
      amount: payload.data.amount,
      metadata: payload.data.metadata ?? {},
    };
  }

  async verifyTransaction(reference: string): Promise<PaymentStatus> {
    const result = await this.request<PaystackVerifyResponse>(
      `/transaction/verify/${encodeURIComponent(reference)}`
    );

    const status =
      result.data.status === 'success'
        ? 'paid'
        : result.data.status === 'failed'
          ? 'failed'
          : 'pending';

    return {
      reference: result.data.reference,
      status,
      amount: result.data.amount,
    };
  }
}

export class MockPaystackProvider implements PaymentProvider {
  readonly name = 'paystack';

  async initializeCheckout(input: CheckoutInput): Promise<PaymentSession> {
    const reference = `T${Date.now()}`;
    return {
      authorizationUrl: `https://checkout.paystack.com/mock/${reference}`,
      reference,
      accessCode: reference,
      provider: 'paystack',
    };
  }

  async verifyWebhook(rawBody: Buffer, _signature: string): Promise<WebhookEvent> {
    const payload = JSON.parse(rawBody.toString()) as {
      event: string;
      data: { reference: string; amount: number; metadata?: Record<string, unknown> };
    };
    return {
      type: payload.event as WebhookEvent['type'],
      reference: payload.data.reference,
      amount: payload.data.amount,
      metadata: payload.data.metadata ?? {},
    };
  }

  async verifyTransaction(reference: string): Promise<PaymentStatus> {
    return { reference, status: 'paid', amount: 0 };
  }
}
