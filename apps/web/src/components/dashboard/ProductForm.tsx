'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import {
  createProductSchema,
  type Category,
  type Locale,
  type Product,
} from '@ecwt/contracts';
import { ApiError, apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

const TEXT = {
  uz: {
    basics: 'Asosiy ma’lumot',
    basicsHint: 'Inglizcha nom AQSH marketplace’i uchun majburiy',
    pricing: 'Narx va ombor',
    pricingHint: 'Narxni so‘mda kiriting — dollardagi narxni biz hisoblaymiz',
    dimensions: 'O‘lchamlar',
    dimensionsHint: 'Yetkazib berish narxini hisoblash uchun kerak',
    images: 'Rasmlar',
    imagesHint:
      'Hozircha rasm havolasini (URL) kiriting. To‘g‘ridan-to‘g‘ri yuklash fayl xotirasi ulangach ishlaydi.',
    sku: 'SKU (ichki kod)',
    skuHint: 'Masalan: TS-COTTON-001',
    nameUz: 'Nomi (o‘zbekcha)',
    nameRu: 'Nomi (ruscha)',
    nameEn: 'Nomi (inglizcha)',
    descUz: 'Tavsif (o‘zbekcha)',
    descEn: 'Tavsif (inglizcha)',
    category: 'Kategoriya',
    brand: 'Brend',
    hsCode: 'HS kod',
    hsCodeHint: 'Eksport hujjatlari uchun (6–10 raqam)',
    basePrice: 'Narx (so‘m)',
    suggestedPrice: 'Taklif etilgan narx (USD)',
    moq: 'Minimal partiya',
    stock: 'Ombordagi qoldiq',
    weight: 'Og‘irlik (gramm)',
    length: 'Uzunlik (mm)',
    width: 'Kenglik (mm)',
    height: 'Balandlik (mm)',
    imageUrl: 'Rasm havolasi',
    addImage: 'Rasm qo‘shish',
    removeImage: 'O‘chirish',
    save: 'Saqlash',
    saving: 'Saqlanmoqda...',
    selectCategory: 'Tanlang',
    noImages: 'Kamida bitta rasm qo‘shing — rasmsiz mahsulotni marketplace’ga chiqarib bo‘lmaydi.',
  },
  ru: {
    basics: 'Основная информация',
    basicsHint: 'Английское название обязательно для маркетплейсов США',
    pricing: 'Цена и склад',
    pricingHint: 'Укажите цену в сумах — цену в долларах рассчитаем мы',
    dimensions: 'Габариты',
    dimensionsHint: 'Нужны для расчёта стоимости доставки',
    images: 'Фото',
    imagesHint:
      'Пока укажите ссылку (URL) на фото. Прямая загрузка заработает после подключения файлового хранилища.',
    sku: 'Артикул',
    skuHint: 'Например: TS-COTTON-001',
    nameUz: 'Название (узбекский)',
    nameRu: 'Название (русский)',
    nameEn: 'Название (английский)',
    descUz: 'Описание (узбекский)',
    descEn: 'Описание (английский)',
    category: 'Категория',
    brand: 'Бренд',
    hsCode: 'Код ТН ВЭД',
    hsCodeHint: 'Для экспортных документов (6–10 цифр)',
    basePrice: 'Цена (сум)',
    suggestedPrice: 'Рекомендуемая цена (USD)',
    moq: 'Минимальная партия',
    stock: 'Остаток на складе',
    weight: 'Вес (грамм)',
    length: 'Длина (мм)',
    width: 'Ширина (мм)',
    height: 'Высота (мм)',
    imageUrl: 'Ссылка на фото',
    addImage: 'Добавить фото',
    removeImage: 'Удалить',
    save: 'Сохранить',
    saving: 'Сохраняем...',
    selectCategory: 'Выберите',
    noImages: 'Добавьте хотя бы одно фото — без фото товар нельзя вывести на маркетплейс.',
  },
  en: {
    basics: 'Basic information',
    basicsHint: 'The English name is required for US marketplaces',
    pricing: 'Price and stock',
    pricingHint: 'Enter the price in UZS — we calculate the USD price',
    dimensions: 'Dimensions',
    dimensionsHint: 'Needed to calculate shipping cost',
    images: 'Images',
    imagesHint:
      'For now, paste an image URL. Direct upload becomes available once file storage is connected.',
    sku: 'SKU',
    skuHint: 'E.g. TS-COTTON-001',
    nameUz: 'Name (Uzbek)',
    nameRu: 'Name (Russian)',
    nameEn: 'Name (English)',
    descUz: 'Description (Uzbek)',
    descEn: 'Description (English)',
    category: 'Category',
    brand: 'Brand',
    hsCode: 'HS code',
    hsCodeHint: 'For export documentation (6–10 digits)',
    basePrice: 'Price (UZS)',
    suggestedPrice: 'Suggested price (USD)',
    moq: 'Minimum order quantity',
    stock: 'Stock on hand',
    weight: 'Weight (grams)',
    length: 'Length (mm)',
    width: 'Width (mm)',
    height: 'Height (mm)',
    imageUrl: 'Image URL',
    addImage: 'Add image',
    removeImage: 'Remove',
    save: 'Save',
    saving: 'Saving...',
    selectCategory: 'Select',
    noImages: 'Add at least one image — a product without images cannot be listed.',
  },
} as const;

export function ProductForm({
  locale,
  categories,
}: {
  locale: Locale;
  categories: Category[];
}) {
  const router = useRouter();
  const t = TEXT[locale];

  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const data = new FormData(event.currentTarget);
    const num = (key: string): number | undefined => {
      const raw = String(data.get(key) ?? '').trim();
      return raw ? Number(raw) : undefined;
    };

    const images = imageUrls
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 }));

    const parsed = createProductSchema.safeParse({
      sku: String(data.get('sku') ?? '').trim(),
      nameUz: String(data.get('nameUz') ?? '').trim(),
      nameRu: String(data.get('nameRu') ?? '').trim() || undefined,
      nameEn: String(data.get('nameEn') ?? '').trim(),
      descriptionUz: String(data.get('descriptionUz') ?? '').trim() || undefined,
      descriptionEn: String(data.get('descriptionEn') ?? '').trim() || undefined,
      categoryId: String(data.get('categoryId') ?? '') || undefined,
      brand: String(data.get('brand') ?? '').trim() || undefined,
      hsCode: String(data.get('hsCode') ?? '').trim() || undefined,
      basePriceUzs: num('basePriceUzs') ?? 0,
      suggestedPriceUsd: num('suggestedPriceUsd'),
      moq: num('moq') ?? 1,
      stock: num('stock') ?? 0,
      weightGrams: num('weightGrams'),
      lengthMm: num('lengthMm'),
      widthMm: num('widthMm'),
      heightMm: num('heightMm'),
      countryOfOrigin: 'UZ',
      images,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);

    try {
      const product = await apiFetch<Product>('/products', {
        method: 'POST',
        body: parsed.data,
      });

      router.push(`/${locale}/dashboard/products/${product.id}`);
      router.refresh();
    } catch (error) {
      setSaving(false);

      if (error instanceof ApiError) {
        if (error.details) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(error.details)) {
            if (messages[0]) fieldErrors[key] = messages[0];
          }
          setErrors(fieldErrors);
        }
        setFormError(error.message);
      } else {
        setFormError('Kutilmagan xato yuz berdi');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader title={t.basics} description={t.basicsHint} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label={t.sku} htmlFor="sku" error={errors.sku} hint={t.skuHint} required>
            <Input id="sku" name="sku" hasError={Boolean(errors.sku)} />
          </Field>

          <Field label={t.category} htmlFor="categoryId" error={errors.categoryId}>
            <Select id="categoryId" name="categoryId" hasError={Boolean(errors.categoryId)}>
              <option value="">{t.selectCategory}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {locale === 'en'
                    ? category.nameEn
                    : locale === 'ru'
                      ? (category.nameRu ?? category.nameUz)
                      : category.nameUz}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t.nameUz} htmlFor="nameUz" error={errors.nameUz} required>
            <Input id="nameUz" name="nameUz" hasError={Boolean(errors.nameUz)} />
          </Field>

          <Field label={t.nameEn} htmlFor="nameEn" error={errors.nameEn} required>
            <Input id="nameEn" name="nameEn" hasError={Boolean(errors.nameEn)} />
          </Field>

          <Field label={t.nameRu} htmlFor="nameRu" error={errors.nameRu}>
            <Input id="nameRu" name="nameRu" hasError={Boolean(errors.nameRu)} />
          </Field>

          <Field label={t.brand} htmlFor="brand" error={errors.brand}>
            <Input id="brand" name="brand" hasError={Boolean(errors.brand)} />
          </Field>

          <div className="sm:col-span-2">
            <Field label={t.descUz} htmlFor="descriptionUz" error={errors.descriptionUz}>
              <Textarea id="descriptionUz" name="descriptionUz" rows={3} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label={t.descEn} htmlFor="descriptionEn" error={errors.descriptionEn}>
              <Textarea id="descriptionEn" name="descriptionEn" rows={3} />
            </Field>
          </div>

          <Field label={t.hsCode} htmlFor="hsCode" error={errors.hsCode} hint={t.hsCodeHint}>
            <Input id="hsCode" name="hsCode" inputMode="numeric" hasError={Boolean(errors.hsCode)} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.pricing} description={t.pricingHint} />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t.basePrice} htmlFor="basePriceUzs" error={errors.basePriceUzs} required>
            <Input
              id="basePriceUzs"
              name="basePriceUzs"
              type="number"
              min={0}
              step="0.01"
              hasError={Boolean(errors.basePriceUzs)}
            />
          </Field>

          <Field
            label={t.suggestedPrice}
            htmlFor="suggestedPriceUsd"
            error={errors.suggestedPriceUsd}
          >
            <Input
              id="suggestedPriceUsd"
              name="suggestedPriceUsd"
              type="number"
              min={0}
              step="0.01"
              hasError={Boolean(errors.suggestedPriceUsd)}
            />
          </Field>

          <Field label={t.moq} htmlFor="moq" error={errors.moq}>
            <Input id="moq" name="moq" type="number" min={1} defaultValue={1} />
          </Field>

          <Field label={t.stock} htmlFor="stock" error={errors.stock}>
            <Input id="stock" name="stock" type="number" min={0} defaultValue={0} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.dimensions} description={t.dimensionsHint} />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t.weight} htmlFor="weightGrams" error={errors.weightGrams}>
            <Input id="weightGrams" name="weightGrams" type="number" min={1} />
          </Field>
          <Field label={t.length} htmlFor="lengthMm" error={errors.lengthMm}>
            <Input id="lengthMm" name="lengthMm" type="number" min={1} />
          </Field>
          <Field label={t.width} htmlFor="widthMm" error={errors.widthMm}>
            <Input id="widthMm" name="widthMm" type="number" min={1} />
          </Field>
          <Field label={t.height} htmlFor="heightMm" error={errors.heightMm}>
            <Input id="heightMm" name="heightMm" type="number" min={1} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.images} description={t.imagesHint} />
        <CardBody className="space-y-3">
          {imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input
                aria-label={`${t.imageUrl} ${index + 1}`}
                value={url}
                onChange={(event) => {
                  const next = [...imageUrls];
                  next[index] = event.target.value;
                  setImageUrls(next);
                }}
                placeholder="https://..."
                type="url"
              />
              {imageUrls.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                  aria-label={t.removeImage}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          ))}

          {imageUrls.length < 12 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setImageUrls([...imageUrls, ''])}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.addImage}
            </Button>
          )}

          <p className="text-xs text-brand-400">{t.noImages}</p>
        </CardBody>
      </Card>

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={saving}>
        <Save className="h-4 w-4" aria-hidden="true" />
        {saving ? t.saving : t.save}
      </Button>
    </form>
  );
}
