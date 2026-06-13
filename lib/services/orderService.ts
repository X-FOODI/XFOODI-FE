import {
    DownloadableFile,
    getFileNameFromContentDisposition,
} from "@/lib/utils/fileDownload";
import axiosInstance from "./axiosInstance";

// Backend DTOs (mirrors server DTOs)

export interface OrderDetailRequestDto {
  dishId?: string;
  comboId?: string;
  quantity: number;
  note?: string;
}

export interface OrderRequestDto {
  tableId: string;
  customerId?: string;
  orderStatusId?: number;
  paymentStatusId?: number;
  reservationId?: string | null;
  subTotal?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  serviceCharge?: number | null;
  totalAmount?: number | null;
  tableIds?: string[];
  orderDetails: OrderDetailRequestDto[];
}

export interface PreOrderByReservationRequestDto {
  customerId: string;
  orderDetails: OrderDetailRequestDto[];
}

export interface OrderDetailDto {
  id?: string;
  dishId: string;
  comboId?: string | null;
  parentId?: string | null;
  dishName?: string;
  dishPrice?: number;
  unitPrice?: number;
  quantity: number;
  note?: string | null;
  status?: string | null;
}

export interface OrderStatusUpdateRequest {
  statusId: number;
}

export interface OrderDetailsItemDto {
  id: string;
  dishId: string;
  dishName: string;
  dishPrice: number;
  quantity: number;
  note?: string | null;
  status?: string | null;
  orderId: string;
  createdDate?: string | null;
}

export interface OrderDto {
  id?: string;
  reference?: string | null;
  createdDate?: string | null;
  tableId: string;
  customerId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  reservationId?: string | null;
  orderStatusId: number;
  paymentStatusId?: number;
  paymentStatus?: number;
  paymentStatusName?: string | null;
  subTotal?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  serviceCharge?: number | null;
  totalAmount: number;
  completedAt?: string | null;
  cancelledAt?: string | null;
  handledBy?: string | null;
  tableIds?: string[];
  tableSessions?: Array<{
    id?: string;
    tableId?: string | null;
    tableCode?: string | null;
    table?: {
      id?: string;
      code?: string | null;
    } | null;
  }>;
  orderDetails: OrderDetailDto[];
}

const isOrderDtoLike = (value: unknown): value is OrderDto => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<OrderDto>;
  return Array.isArray(candidate.orderDetails);
};

const extractOrders = (data: unknown): OrderDto[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as OrderDto[];

  const record = data as Record<string, unknown>;

  // Common API wrapper support: { data: ... } / { Data: ... }
  const wrappedData = (record.data || record.Data) as unknown;
  if (Array.isArray(wrappedData)) return wrappedData as OrderDto[];
  if (wrappedData && typeof wrappedData === "object") {
    const wrappedRecord = wrappedData as Record<string, unknown>;
    const wrappedOrders = (wrappedRecord.orders ||
      wrappedRecord.Orders) as unknown;
    if (Array.isArray(wrappedOrders)) return wrappedOrders as OrderDto[];
    if (isOrderDtoLike(wrappedData)) {
      return [wrappedData];
    }
  }

  const orders = (record.orders || record.Orders) as unknown;
  if (Array.isArray(orders)) return orders as OrderDto[];

  // Single-order payload support
  if (isOrderDtoLike(data)) {
    return [data];
  }

  return [];
};

export interface OrderFilterParams {
  page?: number;
  itemsPerPage?: number;
  from?: string;
  to?: string;
  status?: number;
  customerName?: string;
  reference?: string;
  itemCount?: number;
  total?: number;
  paymentStatus?: number;
  time?: string;
  sortBy?: string;
}

export interface PaginatedOrderResult {
  orders: OrderDto[];
  totalCount: number;
  page: number;
  itemsPerPage: number;
  totalPages: number;
}

export interface StaffOrderQueryParams {
  Status?: number;
  From?: string;
  To?: string;
}

export interface OrderDetailListItemDto {
  id?: string;
  orderId?: string;
  dishId?: string | null;
  comboId?: string | null;
  parentId?: string | null;
  dishName?: string;
  quantity?: number;
  note?: string | null;
  status?: string | null;
  createdDate?: string | null;
  tableCode?: string[] | string | null;
}

export interface ApplyDiscountRequest {
  promotionCode?: string | null;
  applyMembership: boolean;
}

export interface DiscountBreakdown {
  promotionDiscount: number;
  membershipDiscount: number;
}

export interface AppliedPromotionInfo {
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number;
}

export interface AppliedMembershipInfo {
  level: string;
  discountPercentage: number;
}

export interface ApplyDiscountResponse {
  orderId: string;
  subTotal: number;
  breakdown: DiscountBreakdown;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  appliedPromotion: AppliedPromotionInfo | null;
  promotionError: string | null;
  appliedMembership: AppliedMembershipInfo | null;
}

export interface OrderApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class OrderService {
  async createOrder(payload: OrderRequestDto): Promise<string> {
    const response = await axiosInstance.post<string>("/orders", payload);
    // Backend returns Guid in body, axios will parse as string
    return response.data as unknown as string;
  }

  async preOrderByReservation(
    reservationId: string,
    payload: PreOrderByReservationRequestDto,
  ): Promise<OrderApiResponse<OrderDto>> {
    const response = await axiosInstance.post<OrderApiResponse<OrderDto>>(
      `/orders/reservation/${encodeURIComponent(reservationId)}`,
      payload,
    );
    return response.data;
  }

  async updateOrder(id: string, payload: OrderRequestDto): Promise<void> {
    await axiosInstance.put(`/orders/${id}`, payload);
  }

  async updateOrderStatus(id: string, statusId: number): Promise<void> {
    await axiosInstance.put(`/orders/${id}/status`, statusId);
  }

  async deleteOrder(id: string): Promise<void> {
    await axiosInstance.delete(`/orders/${id}`);
  }

  async updateOrderDetailStatus(
    orderId: string,
    detailId: string,
    statusId: number,
  ): Promise<void> {
    await axiosInstance.put(
      `/orders/${orderId}/order-details-status/${detailId}`,
      statusId,
    );
  }

  async getAllOrders(params?: StaffOrderQueryParams): Promise<OrderDto[]> {
    const response = await axiosInstance.get("/orders", {
      params,
    });
    return extractOrders(response.data);
  }

  async getCurrentOrders(params?: StaffOrderQueryParams): Promise<OrderDto[]> {
    const response = await axiosInstance.get("/orders/current-order", {
      params,
    });
    return extractOrders(response.data);
  }

  async getOrdersByFilter(params: OrderFilterParams): Promise<OrderDto[]> {
    const response = await axiosInstance.get("/orders", {
      params,
    });
    return extractOrders(response.data);
  }

  async getPaginatedOrders(params: OrderFilterParams): Promise<PaginatedOrderResult> {
    const response = await axiosInstance.get("/orders", { params });
    const data = response.data as any;

    const orders = data.orders || data.Orders || extractOrders(data);

    return {
      orders,
      totalCount: data.totalCount ?? data.TotalCount ?? orders.length,
      page: data.page ?? data.Page ?? 1,
      itemsPerPage: data.itemsPerPage ?? data.ItemsPerPage ?? orders.length,
      totalPages: data.totalPages ?? data.TotalPages ?? 1,
    };
  }

  async getOrdersByTable(tableId: string): Promise<OrderDto[]> {
    const response = await axiosInstance.get(
      `/orders/table/${encodeURIComponent(tableId)}`,
    );
    return extractOrders(response.data);
  }

  async getOrderById(id: string): Promise<OrderDto> {
    const response = await axiosInstance.get<OrderDto>(`/orders/${id}`);
    return response.data;
  }

  async getOrderDetailsList(): Promise<OrderDetailListItemDto[]> {
    const response =
      await axiosInstance.get<OrderDetailListItemDto[]>("/orders/details");
    return Array.isArray(response.data) ? response.data : [];
  }

  async exportOrders(
    params: OrderFilterParams | StaffOrderQueryParams = {},
  ): Promise<DownloadableFile> {
    const response = await axiosInstance.get<Blob>("/orders/export/csv", {
      params,
      responseType: "blob",
    });

    const contentDisposition = response.headers?.["content-disposition"] as
      | string
      | undefined;

    return {
      blob: response.data,
      fileName: getFileNameFromContentDisposition(
        contentDisposition,
        `orders_${Date.now()}.xlsx`,
      ),
    };
  }

  async applyDiscount(
    orderId: string,
    request: ApplyDiscountRequest,
  ): Promise<ApplyDiscountResponse> {
    const response = await axiosInstance.put<ApplyDiscountResponse>(
      `/orders/${orderId}/discount`,
      request,
    );
    return response.data;
  }
}

const orderService = new OrderService();

export default orderService;
