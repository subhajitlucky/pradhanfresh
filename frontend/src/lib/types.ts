/**
 * Domain types mirroring the PradhanFresh backend (Prisma + Express).
 * Field names match the API exactly — see API_REFERENCE.md.
 */

export type Role = 'USER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentMethod = 'COD' | 'ONLINE' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type DeliverySlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isEmailVerified?: boolean;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive?: boolean;
  /** The API returns both `_count.products` and a flat `productCount`. */
  productCount?: number;
  _count?: { products: number };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  salePrice?: number | null;
  thumbnail: string;
  images: string[];
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isOrganic: boolean;
  sku: string;
  unit: string;
  weight?: number | null;
  categoryId?: number;
  category?: Partial<Category> | null;
  createdBy?: { id: number; name: string; email: string } | null;
  createdAt?: string;
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  subtotal: number;
  stockAvailable?: number;
  hasStockIssue?: boolean;
  product: {
    id: number;
    name: string;
    thumbnail: string;
    unit: string;
    /** Present on GET /cart, absent on POST /cart/add. */
    price?: number;
    salePrice?: number | null;
    stock?: number;
    isAvailable?: boolean;
    slug?: string;
  };
}

export interface Cart {
  id: number;
  items: CartItem[];
  totalAmount: number;
  itemsCount?: number;
}

export interface CartPayload {
  cart: Cart | null;
  itemsCount: number;
  totalAmount: number;
  isEmpty: boolean;
  hasStockIssues?: boolean;
  stockIssues?: Array<{ productId: number; productName: string; issue: string }>;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  price: number;
  subtotal: number;
  unit: string;
  thumbnail?: string | null;
  product?: { id: number; name: string; slug: string; thumbnail: string; unit: string } | null;
}

export interface Address {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  isDefault: boolean;
}

export interface OrderSummary {
  itemsCount: number;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  /** Parsed object on list/detail; a raw JSON string straight from create. */
  deliveryAddress: Address | string | null;
  deliveryDate?: string | null;
  deliverySlot?: DeliverySlot | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string | null;
  orderNotes?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  statusInfo?: {
    label: string;
    description: string;
    color: string;
    canCancel: boolean;
  };
  orderSummary?: OrderSummary;
  canCancel?: boolean;
  canReturn?: boolean;
  estimatedDelivery?: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalProducts?: number;
  totalOrders?: number;
  productsPerPage?: number;
  ordersPerPage?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface ProductListResponse {
  data: Product[];
  pagination: Pagination;
  filters?: {
    totalResults: number;
    appliedFilters: Record<string, unknown>;
  };
}

export interface OrderListResponse {
  data: Order[];
  pagination: Pagination;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  recentOrders: Order[];
  salesData: Array<{ date: string; sales: number }>;
  topProduce: Array<{
    productId: number;
    productName: string;
    _sum: { totalSold: number; revenue: number };
  }>;
}

/** Filters accepted by GET /api/products — all camelCase. */
export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categories?: string;
  minPrice?: number;
  maxPrice?: number;
  isOrganic?: string;
  isFeatured?: string;
  isAvailable?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured first' },
  { value: 'newest', label: 'Newest harvest' },
  { value: 'price_asc', label: 'Price · low to high' },
  { value: 'price_desc', label: 'Price · high to low' },
  { value: 'name', label: 'Name · A to Z' },
  { value: 'popularity', label: 'Most popular' },
] as const;
