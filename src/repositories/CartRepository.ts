import { Cart, type ICart } from '../models/Cart.js';

export class CartRepository {
  findByUserId(userId: string): Promise<ICart | null> {
    return Cart.findOne({ userId }).exec();
  }

  async findOrCreate(userId: string): Promise<ICart> {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
    return cart;
  }

  save(cart: ICart): Promise<ICart> {
    return cart.save();
  }

  clearByUserId(userId: string, session?: import('mongoose').ClientSession): Promise<void> {
    return Cart.updateOne({ userId }, { $set: { items: [] } }, { session }).then(() => undefined);
  }
}
