import { redirect } from 'next/navigation';

/**
 * Root route. The storefront's main surface is the product grid, so
 * redirect / -> /products. This keeps the "Open storefront" link on
 * the hub landing on a working page instead of a 404.
 */
export default function Home(): never {
  redirect('/products');
}
