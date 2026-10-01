import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './api';
import type {
  AdminStats,
  Address,
  Category,
  Order,
  OrderListResponse,
  OrderStatus,
  PaymentMethod,
  DeliverySlot,
  Product,
  ProductListResponse,
  ProductQuery,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Category[] }>('/categories');
      return data.data ?? [];
    },
    staleTime: 10 * 60_000,
  });
}

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: async () => {
      const { data } = await api.get<ProductListResponse>('/products', {
        params: {
          page: query.page ?? 1,
          limit: query.limit ?? 12,
          ...(query.search ? { search: query.search } : {}),
          ...(query.categories ? { categories: query.categories } : {}),
          ...(query.minPrice != null ? { minPrice: query.minPrice } : {}),
          ...(query.maxPrice != null ? { maxPrice: query.maxPrice } : {}),
          ...(query.isOrganic ? { isOrganic: query.isOrganic } : {}),
          ...(query.isFeatured ? { isFeatured: query.isFeatured } : {}),
          ...(query.sortBy ? { sortBy: query.sortBy } : {}),
          ...(query.sortOrder ? { sortOrder: query.sortOrder } : {}),
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}

export function useProduct(id: number | string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
      return data.data;
    },
    enabled: id != null && id !== '',
    staleTime: 5 * 60_000,
  });
}

export function useRelatedProducts(categoryId?: number) {
  return useQuery({
    queryKey: ['related', categoryId],
    queryFn: async () => {
      const { data } = await api.get<ProductListResponse>('/products', {
        params: { limit: 4, ...(categoryId ? { categories: String(categoryId) } : {}) },
      });
      return data.data ?? [];
    },
    enabled: categoryId != null,
    staleTime: 5 * 60_000,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: async () => {
      const { data } = await api.get<ProductListResponse>('/products', {
        params: { limit, isFeatured: 'true' },
      });
      return data.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                     */
/* -------------------------------------------------------------------------- */

export function useOrders(page = 1, status?: OrderStatus | '') {
  return useQuery({
    queryKey: ['orders', page, status],
    queryFn: async () => {
      const { data } = await api.get<OrderListResponse>('/orders', {
        params: { page, limit: 10, ...(status ? { status } : {}) },
      });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useOrder(orderNumber?: string) {
  return useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Order }>(
        `/orders/${orderNumber}`,
      );
      return data.data;
    },
    enabled: !!orderNumber,
    retry: false,
  });
}

export interface CreateOrderInput {
  deliveryAddress: Omit<Address, 'id' | 'userId' | 'isDefault'>;
  paymentMethod: PaymentMethod;
  deliveryDate?: string;
  deliverySlot?: DeliverySlot;
  orderNotes?: string;
  discount?: number;
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const { data } = await api.post<{
        success: boolean;
        data: {
          order: Order;
          orderNumber: string;
          totalAmount: number;
          itemsCount: number;
          estimatedDelivery: string;
          paymentMethod: string;
        };
      }>('/orders/create', input);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderNumber, reason }: { orderNumber: string; reason?: string }) => {
      const { data } = await api.put<{ success: boolean; data: Order }>(
        `/orders/${orderNumber}/cancel`,
        { reason },
      );
      return data.data;
    },
    onSuccess: (order) => {
      qc.setQueryData(['order', order.orderNumber], order);
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderNumber,
      status,
      adminNotes,
    }: {
      orderNumber: string;
      status: OrderStatus;
      adminNotes?: string;
    }) => {
      const { data } = await api.put<{ success: boolean; data: Order }>(
        `/orders/${orderNumber}/status`,
        { status, adminNotes },
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Account                                                                    */
/* -------------------------------------------------------------------------- */

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Address[] }>('/user/address');
      return data.data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (address: Omit<Address, 'id' | 'userId' | 'isDefault'>) => {
      const { data } = await api.post<{ success: boolean; data: Address }>(
        '/user/address',
        address,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/user/address/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      await api.post('/auth/profile/change-password', input);
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Admin                                                                      */
/* -------------------------------------------------------------------------- */

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: AdminStats }>(
        '/admin/dashboard/stats',
      );
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useLowStock(threshold = 10) {
  return useQuery({
    queryKey: ['admin', 'low-stock', threshold],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: Array<{
          id: number;
          name: string;
          sku: string;
          stock: number;
          unit: string;
          thumbnail: string;
          category?: { name: string } | null;
        }>;
      }>('/admin/inventory/low-stock', { params: { threshold } });
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useAdminProducts(page = 1, search = '') {
  return useQuery({
    queryKey: ['admin', 'products', page, search],
    queryFn: async () => {
      const { data } = await api.get<ProductListResponse>('/products', {
        params: { page, limit: 20, ...(search ? { search } : {}) },
      });
      return data;
    },
    staleTime: 15_000,
  });
}

export interface ProductInput {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number | null;
  categoryId: number;
  thumbnail: string;
  images?: string[];
  stock: number;
  weight?: number;
  sku: string;
  unit: string;
  isFeatured?: boolean;
  isOrganic?: boolean;
}

export function useSaveProduct(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      if (id) {
        const { data } = await api.put<{ success: boolean; data: Product }>(
          `/products/${id}`,
          input,
        );
        return data.data;
      }
      const { data } = await api.post<{ success: boolean; data: Product }>('/products', input);
      return data.data;
    },
    onSuccess: (product) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.setQueryData(['product', product.id], product);
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post<{ success: boolean; data: { url: string } }>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.url;
}

/* -------------------------------------------------------------------------- */
/*  Error helper                                                               */
/* -------------------------------------------------------------------------- */

/** Normalises anything thrown by a query/mutation into a display string. */
export function errText(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
