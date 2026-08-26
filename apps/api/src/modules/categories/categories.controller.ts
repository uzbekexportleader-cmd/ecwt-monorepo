import { Body, Controller, Get, Post } from '@nestjs/common';
import { z } from 'zod';
import type { Category } from '@ecwt/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public, Roles } from '../../common/decorators';
import { AppError } from '../../common/errors';

const createCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug faqat kichik harf, raqam va tiredan iborat bo‘lsin'),
  nameUz: z.string().trim().min(2).max(120),
  nameRu: z.string().trim().max(120).optional(),
  nameEn: z.string().trim().min(2).max(120),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  /** Ochiq — sayt katalogida va mahsulot qo'shish formasida ishlatiladi */
  @Public()
  @Get()
  async list(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
    });

    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameUz: c.nameUz,
      nameRu: c.nameRu,
      nameEn: c.nameEn,
      parentId: c.parentId,
    }));
  }

  @Roles('ADMIN')
  @Post()
  async create(
    @Body(new ZodValidationPipe(createCategorySchema)) dto: z.infer<typeof createCategorySchema>,
  ): Promise<Category> {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        select: { id: true },
      });
      if (!parent) throw AppError.validation('Ota kategoriya topilmadi', { parentId: ['Topilmadi'] });
    }

    const category = await this.prisma.category.create({
      data: {
        slug: dto.slug,
        nameUz: dto.nameUz,
        nameRu: dto.nameRu ?? null,
        nameEn: dto.nameEn,
        parentId: dto.parentId ?? null,
        sortOrder: dto.sortOrder,
      },
    });

    return {
      id: category.id,
      slug: category.slug,
      nameUz: category.nameUz,
      nameRu: category.nameRu,
      nameEn: category.nameEn,
      parentId: category.parentId,
    };
  }
}
