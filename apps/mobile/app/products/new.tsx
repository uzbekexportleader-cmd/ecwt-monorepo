import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useCraftCategories, useCreateProduct, useServicePayment } from '../../src/api/queries';
import { Button, InfoBanner, Screen } from '../../src/components/ui';
import { LockedNotice } from '../../src/components/LockedNotice';
import { SelectField, TextField } from '../../src/components/form';
import { colors, layout, radius, spacing, typography } from '../../src/theme';
import { EcwtApiError } from '../../src/api/client';
import { toastError, toastInfo, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';
import {
  clearProductDraft,
  isDraftMeaningful,
  loadProductDraft,
  saveProductDraft,
  type ProductDraft,
} from '../../src/services/product-draft';

export default function NewProductScreen() {
  const t = useT();
  const router = useRouter();
  const crafts = useCraftCategories();
  const create = useCreateProduct();
  const payment = useServicePayment();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [material, setMaterial] = useState('');
  const [productionDays, setProductionDays] = useState('');
  const [stock, setStock] = useState('1');
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /*
   * Qoralama: yozilgani shu qurilmada avtomatik saqlanadi.
   *
   * `restored` — tiklash tugaguncha saqlashni to'xtatib turadi, aks holda
   * birinchi render'dagi bo'sh forma saqlangan qoralamani o'chirib yuborardi.
   */
  const [restored, setRestored] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const draft = await loadProductDraft();
      if (!alive) {
        return;
      }
      if (draft && isDraftMeaningful(draft)) {
        setTitle(draft.title);
        setDescription(draft.description);
        setCategoryId(draft.categoryId);
        setPrice(draft.price);
        setWeight(draft.weight);
        setLength(draft.length);
        setWidth(draft.width);
        setHeight(draft.height);
        setMaterial(draft.material);
        setProductionDays(draft.productionDays);
        setStock(draft.stock);
        toastInfo(t('product.draftRestored'));
      }
      setRestored(true);
    })();
    return () => {
      alive = false;
    };
    // Faqat ekran ochilganda bir marta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored) return;
    const draft: ProductDraft = {
      title,
      description,
      categoryId,
      price,
      weight,
      length,
      width,
      height,
      material,
      productionDays,
      stock,
    };
    // Har bir harfda diskka yozmaymiz — yozishni tindirib turamiz
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (isDraftMeaningful(draft)) void saveProductDraft(draft);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    restored,
    title,
    description,
    categoryId,
    price,
    weight,
    length,
    width,
    height,
    material,
    productionDays,
    stock,
  ]);

  const addPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Ruxsat kerak', 'Rasm tanlash uchun galereyaga ruxsat bering.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (res.canceled) return;
    setImages((prev) => [...prev, ...res.assets.map((a) => a.uri)].slice(0, 10));
  };

  const num = (v: string) => {
    const n = Number(v.replace(/\D/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const save = async () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = 'Mahsulot nomi kamida 3 belgi';
    if (!num(price)) next.price = 'Narxni kiriting';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const product = await create.mutateAsync({
        title: title.trim(),
        description: description || null,
        categoryId,
        price: num(price),
        currency: 'UZS',
        weightGram: num(weight),
        lengthMm: num(length),
        widthMm: num(width),
        heightMm: num(height),
        material: material || null,
        productionDays: num(productionDays),
        stock: Number(stock.replace(/\D/g, '') || '0'),
        imageUrls: images,
      });
      // Mahsulot serverda saqlandi — qoralama endi keraksiz
      await clearProductDraft();
      toastSuccess('Mahsulot qo‘shildi');
      router.replace(`/products/${product.id}`);
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : 'Saqlab bo‘lmadi');
    }
  };

  const options = (crafts.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.icon ?? ''} ${c.nameUz}`.trim(),
  }));

  /*
   * Mahsulot qo'shish ECWT xizmat to'lovi tasdiqlangandan keyin ochiladi.
   * Qoida serverda ham bor — bu yerda faqat formani ko'rsatmaymiz, ya'ni
   * foydalanuvchi bekorga to'ldirib chiqib, oxirida xato olmasin.
   */
  if (payment.data && !payment.data.unlocked) {
    return (
      <Screen>
        <LockedNotice />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={[typography.small, { marginBottom: spacing.lg }]}>
        Xalqaro platformalar og‘irlik va o‘lchamni talab qiladi — ularni to‘ldirsangiz mahsulot tezroq
        chiqariladi.
      </Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>{t('product.draftNote')}</Text>

      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <Text style={typography.label}>{t('product.photos')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            <Pressable onPress={addPhoto} style={styles.addPhoto}>
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={typography.caption}>Qo‘shish</Text>
            </Pressable>
            {images.map((uri) => (
              <View key={uri}>
                <Image source={{ uri }} style={styles.photo} contentFit="cover" />
                <Pressable
                  onPress={() => setImages((p) => p.filter((x) => x !== uri))}
                  style={styles.removePhoto}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        <TextField label={t('product.name')} value={title} onChangeText={setTitle} error={errors.title} />
        <TextField
          label={t('product.description')}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <SelectField
          label={t('product.category')}
          value={categoryId}
          options={options}
          onChange={setCategoryId}
        />
        <TextField
          label={`${t('product.price')} (so‘m)`}
          value={price}
          onChangeText={setPrice}
          keyboardType="number-pad"
          error={errors.price}
        />
        <TextField label={t('product.material')} value={material} onChangeText={setMaterial} />
        <TextField
          label={t('product.weight')}
          value={weight}
          onChangeText={setWeight}
          keyboardType="number-pad"
        />

        <View style={[layout.row, { gap: spacing.md }]}>
          <View style={{ flex: 1 }}>
            <TextField label="Uzunlik" value={length} onChangeText={setLength} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Eni" value={width} onChangeText={setWidth} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Balandlik" value={height} onChangeText={setHeight} keyboardType="number-pad" />
          </View>
        </View>

        <TextField
          label={t('product.productionDays')}
          value={productionDays}
          onChangeText={setProductionDays}
          keyboardType="number-pad"
        />
        <TextField label={t('product.stock')} value={stock} onChangeText={setStock} keyboardType="number-pad" />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <InfoBanner text={t('product.mockNotice')} tone="warning" />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button title={t('common.save')} onPress={save} loading={create.isPending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addPhoto: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photo: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
