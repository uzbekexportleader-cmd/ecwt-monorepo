import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodTypeAny } from 'zod';
import { AppError } from '../errors';

/**
 * Zod sxemasi orqali kiruvchi ma'lumotni tekshiradi va tozalaydi.
 * Sxemalar @ecwt/contracts paketidan olinadi — shu bilan web, mobil va API
 * bir xil qoidalar bo'yicha ishlaydi.
 *
 * Foydalanish:
 *   @Post()
 *   create(@Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductInput) {}
 */
@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);

    if (result.success) return result.data;

    throw AppError.validation('Kiritilgan ma’lumotlarda xato bor', zodToDetails(result.error));
  }
}

/** Zod xatolarini `{ maydon: ["xabar"] }` ko'rinishiga o'giradi */
export function zodToDetails(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_';
    const bucket = details[key];
    if (bucket) {
      bucket.push(issue.message);
    } else {
      details[key] = [issue.message];
    }
  }

  return details;
}
