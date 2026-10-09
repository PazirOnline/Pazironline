import type { Venue } from '../types/catalog'

/**
 * Venues. Five restaurants, one catalog.
 *
 * Themes are a *presentation* choice; the catalog (products, categories,
 * prices, availability) is deliberately shared so a theme switch is provably a
 * pure presentation change. Each venue still needs its own identity and cover,
 * otherwise "MUSE" would be NOIRÉ's furniture in different colours.
 */
export const venues: Venue[] = [
  {
    id: 'noire',
    name: 'نواره',
    latin: 'NOIRÉ',
    monogram: 'N',
    descriptor: 'کافه‌ی تخصصی و کنسالت',
    tagline: 'قهوه‌ی تازه‌رست، هر روز صبح',
    status: 'باز است · تا ۲۲:۰۰',
    location: 'تهران، خیابان کریم‌خان',
    cover: 'cafe-interior',
  },
  {
    id: 'muse',
    name: 'مهتاب',
    latin: 'MUSE',
    monogram: 'M',
    descriptor: 'خانه‌ی شیرینی و دمنوش',
    tagline: 'شیرینی‌های دست‌ساز، هر بعدازظهر',
    status: 'باز است · تا ۲۳:۰۰',
    location: 'تهران، خیابان فردوسی',
    cover: 'dessert-tiramisu',
  },
  {
    id: 'minima',
    name: 'مینیما',
    latin: 'MINIMA',
    monogram: 'M',
    descriptor: 'قهوه‌ی دقیق',
    tagline: 'یک فنجان، بدون شلوغی',
    status: 'باز است · تا ۲۰:۰۰',
    location: 'تهران، خیابان ولیعصر',
    cover: 'cafe-interior-2',
  },
  {
    id: 'verde',
    name: 'سبزینه',
    latin: 'VERDE',
    monogram: 'V',
    descriptor: 'کافه‌ی گیاهی و تازه',
    tagline: 'از باغ تا فنجان',
    status: 'باز است · تا ۲۱:۰۰',
    location: 'تهران، خیابان شریعتی',
    cover: 'breakfast-pancakes',
  },
  {
    id: 'pulse',
    name: 'تپش',
    latin: 'PULSE',
    monogram: 'P',
    descriptor: 'قهوه و برگر، سریع',
    tagline: 'سفارش در چند دقیقه',
    status: 'باز است · تا ۲۴:۰۰',
    location: 'تهران، میدان ونک',
    cover: 'breakfast-eggs',
  },
]

export const getVenue = (id: string): Venue =>
  venues.find((venue) => venue.id === id) ?? venues[0]