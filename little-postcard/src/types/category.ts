export interface Category {
  id: string;
  /** URL-safe identifier used in /library?category=… */
  slug: string;
  label: string;
  description: string;
}
