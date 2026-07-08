import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/helpers';

export const CategoryService = {
  async list() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { recipes: true } } },
    });
  },

  async getById(id: number) {
    const item = await prisma.category.findUnique({ where: { id } });
    if (!item) throw ApiError.notFound('Category not found');
    return item;
  },

  async create(data: { name: string; description?: string }) {
    return prisma.category.create({
      data: { name: data.name, description: data.description, slug: slugify(data.name) },
    });
  },

  async update(id: number, data: { name?: string; description?: string }) {
    await this.getById(id);
    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name, slug: slugify(data.name) } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
  },

  async remove(id: number) {
    await this.getById(id);
    await prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  },
};
