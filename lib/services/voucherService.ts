/**
 * Voucher Service — XFOODI FE
 * Bao gồm tất cả các API call liên quan đến voucher cho:
 *  - Customer: xem danh sách, nhập mã riêng, đổi voucher
 *  - Owner: CRUD voucher theo sân
 *  - Admin: xem toàn hệ thống, khóa voucher
 */

import axiosInstance from './axiosInstance';

// ── Shared Types ────────────────────────────────────────────────────────────────

export type DiscountType = 'percentage' | 'fixed';
export type VoucherScope = 'platform' | 'owner';
export type VoucherStatus = 'active' | 'disabled' | 'expired';
export type DistributionMode = 'public' | 'private';
export type ApplicableService = 'all' | 'booking' | 'shop';

export interface VoucherVenueApplication {
  scope: string;
  label: string;
  venues?: { _id: string; name: string }[];
}

export interface Voucher {
  _id: string;
  id?: string;
  code: string;
  title?: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usedCount?: number;
  voucherScope: VoucherScope;
  status: VoucherStatus;
  distributionMode?: DistributionMode;
  applicableService?: ApplicableService;
  paymentMethodScope?: string;
  startDate?: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
  applicableTargets?: string[];
  venueApplication?: VoucherVenueApplication | null;
  bookingTimeFromMin?: number;
  bookingTimeToMin?: number;
  pointsRequired?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

// ── Request Payloads ────────────────────────────────────────────────────────────

export interface CreateOwnerVoucherPayload {
  code: string;
  title?: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  usageLimit?: number;
  applicableService?: ApplicableService;
  startDate: string;
  endDate: string;
  bookingTimeFrom?: string;
  bookingTimeTo?: string;
  venueScope: 'all' | 'single';
  venueId?: string;
  distributionMode: DistributionMode;
}

export interface UpdateOwnerVoucherPayload extends Partial<CreateOwnerVoucherPayload> {
  // Tất cả fields đều optional khi update
}

export interface CreateAdminVoucherPayload {
  code: string;
  title?: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  usageLimit?: number;
  applicableService?: ApplicableService;
  startDate: string;
  endDate: string;
  distributionMode: DistributionMode;
}

export interface EligibleVouchersResult {
  platformVouchers: Voucher[];
  ownerVouchers: Voucher[];
}

export interface ResolveVoucherPayload {
  code: string;
  applicableService?: ApplicableService;
  targetIds?: string[];
  cartTotal?: number;
  catalogMode?: boolean;
}

export interface RedeemVoucherPayload {
  /** Database ID của voucher — BE yêu cầu trường này */
  voucherId?: string;
  /** Fallback: gửi kèm code nếu cần */
  code?: string;
  orderId?: string;
  applicableService?: ApplicableService;
  cartTotal?: number;
  targetIds?: string[];
}

// ── Normalizer ──────────────────────────────────────────────────────────────────
// BE trả về `expiryDate` / `quantity` / `id` — FE dùng `endDate` / `usageLimit` / `_id`
// Hàm này bridge cả 2 chiều, giữ nguyên các field đã đúng.
function normalizeVoucher(v: any): Voucher {
  return {
    ...v,
    _id:         v._id ?? v.id ?? '',
    endDate:     v.endDate ?? v.expiryDate ?? '',
    startDate:   v.startDate ?? '',
    usageLimit:  v.usageLimit ?? v.quantity ?? undefined,
    usedCount:   v.usedCount ?? v.usedQuantity ?? 0,
    minOrderValue: v.minOrderValue ?? v.pointsRequired ?? 0,
    voucherScope: v.voucherScope ?? (v.restaurantId ? 'owner' : 'platform'),
    status:      v.status ?? (v.isActive ? 'active' : 'disabled'),
  } as Voucher;
}

function normalizeList(arr: any[]): Voucher[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeVoucher);
}

// ── Service Class ───────────────────────────────────────────────────────────────

class VoucherService {
  // ── Customer APIs ─────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách voucher công khai còn hiệu lực của khách hàng
   * (phân loại theo platform / owner)
   */
  async getEligibleVouchers(params?: {
    applicableService?: ApplicableService;
    cartTotal?: number;
    targetIds?: string[];
  }): Promise<EligibleVouchersResult> {
    try {
      const response = await axiosInstance.get<ApiResponse<any>>('/vouchers/eligible');
      const data = response.data?.data ?? response.data;

      // BE trả về { platformVouchers: [...], ownerVouchers: [...] }
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return {
          platformVouchers: normalizeList(data.platformVouchers),
          ownerVouchers: normalizeList(data.ownerVouchers),
        };
      }
      // Fallback nếu trả về array phẳng
      if (Array.isArray(data)) {
        const all = normalizeList(data);
        return {
          platformVouchers: all.filter(v => v.voucherScope === 'platform'),
          ownerVouchers: all.filter(v => v.voucherScope !== 'platform'),
        };
      }
      return { platformVouchers: [], ownerVouchers: [] };
    } catch {
      return { platformVouchers: [], ownerVouchers: [] };
    }
  }

  /**
   * Tra cứu voucher theo mã (dành cho mã riêng / private)
   */
  async resolveVoucherCode(payload: ResolveVoucherPayload): Promise<ApiResponse<Voucher>> {
    const response = await axiosInstance.post<ApiResponse<Voucher>>(
      '/vouchers/resolve',
      payload
    );
    return response.data;
  }

  /**
   * Đổi / áp dụng voucher vào đơn hàng (Customer checkout)
   * BE yêu cầu `voucherId` (database ID)
   */
  async redeemVoucher(payload: RedeemVoucherPayload): Promise<ApiResponse<Voucher>> {
    const response = await axiosInstance.post<ApiResponse<Voucher>>(
      '/vouchers/redeem',
      payload
    );
    return response.data;
  }

  /**
   * Lấy danh sách voucher đã đổi của tôi (khách hàng)
   */
  async getMyVouchers(restaurantId?: string, onlyUnused?: boolean): Promise<ApiResponse<any[]>> {
    const response = await axiosInstance.get<ApiResponse<any[]>>('/vouchers/my', {
      params: { restaurantId, onlyUnused },
    });
    return response.data;
  }

  /**
   * Áp dụng voucher vào đơn hàng
   */
  async applyVoucherToOrder(orderId: string, userVoucherId: string | null): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post<ApiResponse<any>>(`/orders/${orderId}/apply-voucher`, {
      userVoucherId,
    });
    return response.data;
  }

  // ── Owner APIs ────────────────────────────────────────────────────────────────

  /**
   * Lấy tất cả voucher của owner (có thể bao gồm cả platform tùy backend)
   */
  async getAllVouchers(restaurantId?: string): Promise<Voucher[]> {
    try {
      const response = await axiosInstance.get<any>(`/vouchers/restaurant/${restaurantId ?? ''}`);
      const data = response.data?.data ?? response.data;
      if (Array.isArray(data)) return normalizeList(data);
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Tạo voucher mới (Owner)
   */
  async createOwnerVoucher(payload: CreateOwnerVoucherPayload): Promise<ApiResponse<Voucher>> {
    const response = await axiosInstance.post<ApiResponse<Voucher>>('/vouchers', payload);
    return response.data;
  }

  /**
   * Chỉnh sửa voucher (Owner)
   */
  async updateVoucher(
    id: string,
    payload: UpdateOwnerVoucherPayload
  ): Promise<ApiResponse<Voucher>> {
    const response = await axiosInstance.patch<ApiResponse<Voucher>>(`/vouchers/${id}`, payload);
    return response.data;
  }

  /**
   * Xóa voucher (Owner) — chỉ khi usedCount = 0
   */
  async deleteVoucher(id: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/vouchers/${id}`);
    return response.data;
  }

  // ── Admin APIs ────────────────────────────────────────────────────────────────

  /**
   * [Admin] Lấy toàn bộ voucher hệ thống — phân tách platform/owner
   * Gọi GET /vouchers/eligible không có restaurantId (trả về tất cả active)
   */
  async getAllAdminVouchers(): Promise<Voucher[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<any>>('/vouchers/eligible');
      const data = response.data?.data ?? response.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return normalizeList([
          ...(data.platformVouchers ?? []),
          ...(data.ownerVouchers ?? []),
        ]);
      }
      if (Array.isArray(data)) return normalizeList(data);
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Tạo voucher BOOCA (Admin / Platform scope)
   */
  async createAdminVoucher(payload: CreateAdminVoucherPayload): Promise<ApiResponse<Voucher>> {
    const response = await axiosInstance.post<ApiResponse<Voucher>>('/vouchers', {
      ...payload,
      voucherScope: 'platform',
    });
    return response.data;
  }

  /**
   * Khóa / vô hiệu hóa voucher (Admin)
   */
  async disableVoucher(id: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.patch<ApiResponse<void>>(`/vouchers/${id}/disable`);
    return response.data;
  }

  /**
   * Kích hoạt lại voucher (Admin / Owner)
   */
  async enableVoucher(id: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.patch<ApiResponse<void>>(`/vouchers/${id}/enable`);
    return response.data;
  }
}

const voucherService = new VoucherService();
export default voucherService;
