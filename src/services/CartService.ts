import { CartRepository } from '../repositories/CartRepository.js';
import { ProductRepository } from '../repositories/ProductRepository.js';
import { ConflictError, NotFoundError } from '../utils/AppError.js';

export class CartService {
  constructor(
    private readonly cartRepo = new CartRepository(),
    private readonly productRepo = new ProductRepository()
  ) {}

  private async buildCartResponse(userId: string) {
    const cart = await this.cartRepo.findOrCreate(userId);
    let subtotal = 0;
    let itemCount = 0;

    const items = await Promise.all(
      cart.items.map(async (item) => {
        const product = await this.productRepo.findActiveById(item.productId.toString());
        if (!product) return null;

        const lineTotal = product.price * item.quantity;
        subtotal += lineTotal;
        itemCount += item.quantity;

        return {
          productId: product._id.toString(),
          title: product.title,
          price: product.price,
          quantity: item.quantity,
          image: product.images[0] ?? '',
          inventoryAvailable: product.inventory,
        };
      })
    );

    return {
      id: cart._id.toString(),
      userId,
      items: items.filter(Boolean),
      subtotal,
      itemCount,
      updatedAt: cart.updatedAt.toISOString(),
    };
  }

  async getCart(userId: string) {
    return this.buildCartResponse(userId);
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await this.productRepo.findActiveById(productId);
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');

    const cart = await this.cartRepo.findOrCreate(userId);
    const existing = cart.items.find((i) => i.productId.toString() === productId);
    const newQty = (existing?.quantity ?? 0) + quantity;

    if (newQty > product.inventory) {
      throw new ConflictError('Insufficient inventory', 'INVENTORY_CONFLICT', {
        productId,
        requested: newQty,
        available: product.inventory,
      });
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      cart.items.push({ productId: product._id, quantity });
    }

    await this.cartRepo.save(cart);
    return this.buildCartResponse(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.cartRepo.findOrCreate(userId);
    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) throw new NotFoundError('Item not in cart', 'CART_ITEM_NOT_FOUND');

    const product = await this.productRepo.findActiveById(productId);
    if (!product) throw new NotFoundError('Product not found');

    if (quantity > product.inventory) {
      throw new ConflictError('Insufficient inventory', 'INVENTORY_CONFLICT');
    }

    item.quantity = quantity;
    await this.cartRepo.save(cart);
    return this.buildCartResponse(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.cartRepo.findOrCreate(userId);
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    if (cart.items.length === before) {
      throw new NotFoundError('Item not in cart', 'CART_ITEM_NOT_FOUND');
    }
    await this.cartRepo.save(cart);
    return this.buildCartResponse(userId);
  }

  async clear(userId: string) {
    const cart = await this.cartRepo.findOrCreate(userId);
    cart.items = [];
    await this.cartRepo.save(cart);
    return this.buildCartResponse(userId);
  }
}
