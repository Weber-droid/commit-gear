import { User, type IUser } from '../models/User.js';

export class UserRepository {
  findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+password');
    return query.exec();
  }

  findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  save(user: IUser): Promise<IUser> {
    return user.save();
  }

  findBuyersPendingVendor(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return Promise.all([
      User.find({ role: 'buyer' }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      User.countDocuments({ role: 'buyer' }),
    ]);
  }
}
