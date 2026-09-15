import { Module } from '@nestjs/common';
import { CraftCategoriesController } from './craft-categories.controller';

@Module({ controllers: [CraftCategoriesController] })
export class CraftCategoriesModule {}
