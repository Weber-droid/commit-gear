import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { Category } from './models/Category.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { logger } from './utils/logger.js';

async function seed() {
  await connectDatabase();

  const categories = [
    { slug: 'hoodies', name: 'Hoodies', description: 'Premium developer hoodies', productCount: 0 },
    { slug: 'keycaps', name: 'Keycaps', description: 'Mechanical keyboard keycap sets', productCount: 0 },
    { slug: 'desk-pads', name: 'Desk Pads', description: 'Extended mouse pads for your battlestation', productCount: 0 },
  ] as const;

  for (const cat of categories) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
  }

  let admin = await User.findOne({ role: 'admin' });
  if (!admin && env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_PASSWORD) {
    admin = await User.create({
      name: 'Commit Gear Admin',
      email: env.SEED_ADMIN_EMAIL,
      password: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12),
      role: 'admin',
      emailVerified: true,
      refreshTokens: [],
    });
    logger.info('Admin user created', { email: env.SEED_ADMIN_EMAIL });
  }

  if (admin && (await Product.countDocuments()) === 0) {
    const demoProducts = [
      {
        title: 'Commit Gear Hoodie — Graphite',
        description: 'Premium heavyweight hoodie with embroidered logo',
        price: 4500000,
        category: 'hoodies',
        images: ['https://res.cloudinary.com/commitgear/image/upload/v1/hoodie-graphite.webp'],
        inventory: 42,
        vendorId: admin._id,
        isActive: true,
      },
      {
        title: 'Mechanical Keycap Set — Terminal',
        description: 'Cherry MX compatible PBT keycaps with Commit Gear legends',
        price: 2800000,
        category: 'keycaps',
        images: ['https://res.cloudinary.com/commitgear/image/upload/v1/keycap-terminal.webp'],
        inventory: 100,
        vendorId: admin._id,
        isActive: true,
      },
      {
        title: 'Desk Pad — Dark Mode',
        description: '900x400mm extended mouse pad with stitched edges',
        price: 1500000,
        category: 'desk-pads',
        images: ['https://res.cloudinary.com/commitgear/image/upload/v1/deskpad-dark.webp'],
        inventory: 75,
        vendorId: admin._id,
        isActive: true,
      },
    ];

    await Product.insertMany(demoProducts);

    for (const slug of ['hoodies', 'keycaps', 'desk-pads'] as const) {
      const count = await Product.countDocuments({ category: slug, isActive: true });
      await Category.updateOne({ slug }, { $set: { productCount: count } });
    }

    logger.info('Demo products seeded');
  }

  await disconnectDatabase();
  logger.info('Seed complete');
}

seed().catch((err) => {
  logger.error('Seed failed', { error: err });
  process.exit(1);
});
