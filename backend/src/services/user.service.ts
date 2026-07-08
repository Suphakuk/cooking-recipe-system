import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildMeta } from '../utils/helpers';

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
};

export const UserService = {
  async updateProfile(userId: number, data: { name?: string; avatarUrl?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl || null } : {}),
      },
      select: SAFE_SELECT,
    });
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw ApiError.badRequest('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Password updated' };
  },

  // ---------- Admin ----------
  async list(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const search = String(query.search ?? '').trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: SAFE_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async getById(id: number) {
    const user = await prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  async adminUpdate(
    id: number,
    data: { name?: string; role?: 'ADMIN' | 'USER'; roleId?: number; isActive?: boolean }
  ) {
    await this.getById(id);

    // Resolve a role name ("ADMIN"/"USER") to its id if provided
    let roleId = data.roleId;
    if (data.role) {
      const role = await prisma.role.findUnique({ where: { name: data.role } });
      if (!role) throw ApiError.badRequest('Invalid role');
      roleId = role.id;
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(roleId !== undefined ? { roleId } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: SAFE_SELECT,
    });
  },

  async remove(id: number) {
    await this.getById(id);
    await prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  },
};
