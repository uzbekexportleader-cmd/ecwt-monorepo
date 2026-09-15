import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CraftCategoryDto } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('craft-categories')
@Controller('craft-categories')
export class CraftCategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Hunar yo‘nalishlari (daraxt ko‘rinishida)' })
  async list(): Promise<CraftCategoryDto[]> {
    const rows = await this.prisma.craftCategory.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { nameUz: 'asc' }],
    });
    const map = new Map<string, CraftCategoryDto>();
    for (const r of rows) {
      map.set(r.id, {
        id: r.id,
        slug: r.slug,
        nameUz: r.nameUz,
        nameRu: r.nameRu,
        nameEn: r.nameEn,
        icon: r.icon,
        parentId: r.parentId,
        isActive: r.isActive,
        children: [],
      });
    }
    const roots: CraftCategoryDto[] = [];
    for (const dto of map.values()) {
      if (dto.parentId && map.has(dto.parentId)) {
        map.get(dto.parentId)!.children!.push(dto);
      } else {
        roots.push(dto);
      }
    }
    return roots;
  }
}
