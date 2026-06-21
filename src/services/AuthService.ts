import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/AppError.js';
import { generateRefreshToken, hashToken } from '../utils/tokens.js';
import { toUserPublic, toUserResponse } from '../utils/serializers.js';
import type { AuthUser, UserRole } from '../types/index.js';

const MAX_REFRESH_TOKENS = 5;
const BCRYPT_ROUNDS = 12;

export class AuthService {
  constructor(private readonly userRepo = new UserRepository()) {}

  private signAccessToken(user: { _id: { toString(): string }; role: UserRole }) {
    return jwt.sign(
      { sub: user._id.toString(), role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );
  }

  private issueRefreshToken(user: Awaited<ReturnType<UserRepository['findById']>>) {
    if (!user) throw new UnauthorizedError();
    const raw = generateRefreshToken();
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN * 1000);

    user.refreshTokens.push({ tokenHash, expiresAt, createdAt: new Date() });
    if (user.refreshTokens.length > MAX_REFRESH_TOKENS) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS);
    }

    return raw;
  }

  async register(name: string, email: string, password: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('Email already in use', 'EMAIL_EXISTS');

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.userRepo.create({
      name,
      email,
      password: hashed,
      role: 'buyer',
      emailVerified: false,
      refreshTokens: [],
    });

    const refreshToken = this.issueRefreshToken(user);
    await this.userRepo.save(user);

    return {
      user: toUserPublic(user),
      tokens: {
        accessToken: this.signAccessToken(user),
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      },
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email, true);
    if (!user) throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');

    const refreshToken = this.issueRefreshToken(user);
    await this.userRepo.save(user);

    return {
      user: toUserPublic(user),
      tokens: {
        accessToken: this.signAccessToken(user),
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      },
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const { User } = await import('../models/User.js');
    const user = await User.findOne({
      refreshTokens: {
        $elemMatch: {
          tokenHash,
          expiresAt: { $gt: new Date() },
        },
      },
    }).exec();

    if (!user) {
      throw new UnauthorizedError('Refresh token invalid or expired', 'REFRESH_TOKEN_INVALID');
    }

    user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== tokenHash);
    const newRefresh = this.issueRefreshToken(user);
    await this.userRepo.save(user);

    return {
      tokens: {
        accessToken: this.signAccessToken(user),
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      },
      refreshToken: newRefresh,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) return;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== tokenHash);
    } else {
      user.refreshTokens = [];
    }

    await this.userRepo.save(user);
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError();
    return toUserResponse(user);
  }

  verifyAccessToken(token: string): AuthUser {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: UserRole };
      return { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedError();
    }
  }

  async promoteToVendor(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError();
    user.role = 'vendor';
    await this.userRepo.save(user);
    return toUserPublic(user);
  }
}
