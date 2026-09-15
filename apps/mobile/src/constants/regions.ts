/**
 * Hududlar klassifikatori.
 * Keyinchalik backend'dan (`/reference/regions`) olinadi — hozircha ilova ichida,
 * chunki ro'yxat kamdan-kam o'zgaradi va offline ham kerak bo'ladi.
 */
export interface Region {
  name: string;
  districts: string[];
}

export const REGIONS: Region[] = [
  { name: 'Toshkent shahri', districts: ['Bektemir', 'Chilonzor', 'Mirobod', 'Mirzo Ulug‘bek', 'Olmazor', 'Sergeli', 'Shayxontohur', 'Uchtepa', 'Yakkasaroy', 'Yashnobod', 'Yunusobod'] },
  { name: 'Toshkent viloyati', districts: ['Angren', 'Bekobod', 'Bo‘ka', 'Chirchiq', 'Ohangaron', 'Parkent', 'Piskent', 'Yangiyo‘l', 'Zangiota'] },
  { name: 'Andijon', districts: ['Andijon sh.', 'Asaka', 'Baliqchi', 'Xonobod', 'Marhamat', 'Shahrixon'] },
  { name: 'Buxoro', districts: ['Buxoro sh.', 'G‘ijduvon', 'Kogon', 'Olot', 'Peshku', 'Vobkent'] },
  { name: 'Farg‘ona', districts: ['Farg‘ona sh.', 'Marg‘ilon', 'Quva', 'Qo‘qon', 'Rishton', 'Oltiariq'] },
  { name: 'Jizzax', districts: ['Jizzax sh.', 'Do‘stlik', 'G‘allaorol', 'Zomin', 'Sharof Rashidov'] },
  { name: 'Namangan', districts: ['Namangan sh.', 'Chust', 'Kosonsoy', 'Pop', 'To‘raqo‘rg‘on', 'Uychi'] },
  { name: 'Navoiy', districts: ['Navoiy sh.', 'Karmana', 'Konimex', 'Nurota', 'Zarafshon'] },
  { name: 'Qashqadaryo', districts: ['Qarshi', 'Shahrisabz', 'Kitob', 'Koson', 'G‘uzor', 'Kasbi'] },
  { name: 'Qoraqalpog‘iston', districts: ['Nukus', 'Beruniy', 'Chimboy', 'Xo‘jayli', 'Mo‘ynoq', 'To‘rtko‘l'] },
  { name: 'Samarqand', districts: ['Samarqand sh.', 'Bulung‘ur', 'Ishtixon', 'Kattaqo‘rg‘on', 'Payariq', 'Urgut'] },
  { name: 'Sirdaryo', districts: ['Guliston', 'Boyovut', 'Sayxunobod', 'Shirin', 'Yangiyer'] },
  { name: 'Surxondaryo', districts: ['Termiz', 'Boysun', 'Denov', 'Sherobod', 'Sho‘rchi'] },
  { name: 'Xorazm', districts: ['Urganch', 'Xiva', 'Xonqa', 'Shovot', 'Yangiariq', 'Bog‘ot'] },
];

export const REGION_OPTIONS = REGIONS.map((r) => ({ value: r.name, label: r.name }));

export function districtOptions(region?: string | null): { value: string; label: string }[] {
  const found = REGIONS.find((r) => r.name === region);
  return (found?.districts ?? []).map((d) => ({ value: d, label: d }));
}
