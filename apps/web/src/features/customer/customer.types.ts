export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  imageUrl?: string | null;
};

export type MenuCategory = {
  id: string;
  name: string;
  products: Product[];
};

export type MenuResponse = {
  table: { name: string; branch: { name: string }; tenant: { name: string } };
  categories: MenuCategory[];
};
