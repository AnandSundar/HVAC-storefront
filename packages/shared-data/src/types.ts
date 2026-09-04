export type ProductCategory =
  | 'Furnaces'
  | 'Filters'
  | 'Thermostats'
  | 'Motors'
  | 'Controls'
  | 'Ductwork';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  manufacturer: string;
  specs?: Record<string, string>;
  /**
   * Public CDN URL for a real product photo (typically images.unsplash.com).
   * Optional: legacy fixtures or admin-created products may omit it.
   */
  imageUrl?: string;
}

export interface Category {
  slug: string;
  name: ProductCategory;
  description: string;
  icon: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  manufacturer: string;
}
