import type { IUser } from '../models/User.js';
import type { IProduct } from '../models/Product.js';
import type { ICategory } from '../models/Category.js';
import type { IOrder } from '../models/Order.js';

export function toUserResponse(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toUserPublic(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function toProductResponse(product: IProduct) {
  return {
    id: product._id.toString(),
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    images: product.images,
    inventory: product.inventory,
    vendorId: product.vendorId.toString(),
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toCategoryResponse(category: ICategory) {
  return {
    id: category._id.toString(),
    slug: category.slug,
    name: category.name,
    description: category.description,
    productCount: category.productCount,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function toOrderResponse(order: IOrder) {
  return {
    id: order._id.toString(),
    userId: order.userId.toString(),
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      title: item.title,
      priceAtPurchase: item.priceAtPurchase,
      quantity: item.quantity,
      imageSnapshot: item.imageSnapshot,
    })),
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference ?? null,
    status: order.status,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
