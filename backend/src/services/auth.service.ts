import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getExpiryDate,
  JwtPayload,
} from '../utils/jwt';
import { env } from '../config/env';

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
};

async function issueTokens(payload: JwtPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: payload.sub,
      expiresAt: getExpiryDate(env.jwt.refreshExpires),
    },
  });

  return { accessToken, refreshToken };
}

export const AuthService = {
  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict('Email is already registered');

    // Default role: USER
    const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
    if (!userRole) throw ApiError.internal('Default USER role not found. Run seed first.');

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, roleId: userRole.id },
      select: SAFE_USER_SELECT,
    });

    const tokens = await issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    return { user, ...tokens };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.isActive) throw ApiError.forbidden('Account is disabled');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw ApiError.unauthorized('Invalid email or password');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
        role: { id: user.role.id, name: user.role.name },
      },
      ...tokens,
    };
  },

  async refresh(oldToken: string) {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(oldToken);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token expired or revoked');
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const newPayload: JwtPayload = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return issueTokens(newPayload);
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
    return { message: 'Logged out' };
  },

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },
};
