import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ReservationTable {
  id: string;
  code: string;
  seatingCapacity: number;
  floorId?: string;
}

export interface ReservationStatus {
  id: string;
  code: string;
  name: string;
  colorCode?: string;
}

export interface ReservationCustomer {
  id: string;
  loyaltyPoints: number;
  membershipLevel?: string;
  user: {
    id: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
}

export interface Reservation {
  id: string;
  confirmationCode: string;
  restaurantId: string;
  customerId: string;
  numberOfGuests: number;
  time: string;
  specialRequests?: string;
  depositAmount: number;
  checkedInAt?: string;
  completedAt?: string;
  metadata?: {
    qrCodeUrl?: string | null;
    statusHistory?: any[];

    mustLeaveBy?: string | null;
    cancellationInfo?: { cancelledReason?: string; at?: string; requestedAt?: string; rejectedAt?: string } | null;
    isCancellationManualReviewPending?: boolean;
    noShowAutoPending?: boolean;
  };
  refunds?: RefundInfo[];
  createdAt: string;
  updatedAt: string;
  reservationStatusId: string;
  paymentDeadline?: string;
  statusValue: ReservationStatus;
  customer: ReservationCustomer;
  tables: Array<{ id: string; tableId: string; table: ReservationTable }>;
  payments?: Array<{
    id: string;
    amount: number;
    status: number;
    paymentDate: string;
    paymentMethod: { code: string; name: string };
  }>;
}

export interface ReservationListResult {
  items: Reservation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateReservationDto {
  restaurantId: string;
  numberOfGuests: number;
  time: string;
  specialRequests?: string;
  tableIds?: string[];
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  bankRefund?: {
    bankBin: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface AvailableTable {
  id: string;
  code: string;
  seatingCapacity: number;
  type: string;
  floorId: string;
  floor: { id: string; name: string };
  tableStatus: { id: string; code: string; name: string };
  isAvailable?: boolean;
  conflictTime?: string | null;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  rotation?: number;
  shape?: string;
}

export interface ReservationFilterParams {
  restaurantId?: string;
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface UpdateReservationDto {
  numberOfGuests?: number;
  time?: string;
  tableIds?: string[];
  specialRequests?: string;
}

export type StatsPeriod = 'today' | 'this_week' | 'this_month';

export interface ReservationStats {
  totalReservations: number;
  confirmedCount: number;
  checkedInCount: number;
  completedCount: number;
  cancelledCount: number;
  checkInRate: number;
  totalDepositCollected: number;
}

export interface RefundInfo {
  id: string;
  amount: number;
  status: string;
  metadata?: any;
  createdAt: string;
}

// ── Service ───────────────────────────────────────────────────────────────────
function unwrap<T>(data: any): T {
  return (data?.data ?? data) as T;
}

const reservationService = {
  async create(dto: CreateReservationDto): Promise<Reservation> {
    const res = await axiosInstance.post(API_ROUTES.RESERVATIONS.CREATE, dto);
    return unwrap<Reservation>(res.data);
  },

  async list(params: ReservationFilterParams): Promise<ReservationListResult> {
    const res = await axiosInstance.get(API_ROUTES.RESERVATIONS.LIST, { params });
    return unwrap<ReservationListResult>(res.data);
  },

  async getById(id: string): Promise<Reservation> {
    const res = await axiosInstance.get(API_ROUTES.RESERVATIONS.DETAIL(id));
    return unwrap<Reservation>(res.data);
  },

  async getByCode(code: string): Promise<Reservation> {
    const res = await axiosInstance.get(API_ROUTES.RESERVATIONS.BY_CODE(code));
    return unwrap<Reservation>(res.data);
  },

  async getMy(restaurantId: string): Promise<Reservation[]> {
    const res = await axiosInstance.get(API_ROUTES.RESERVATIONS.MY, { params: { restaurantId } });
    return unwrap<Reservation[]>(res.data);
  },

  async checkTables(params: {
    restaurantId: string;
    time: string;
    numberOfGuests: number;
  }): Promise<AvailableTable[]> {
    const res = await axiosInstance.get(API_ROUTES.RESERVATIONS.CHECK_TABLES, { params });
    return unwrap<AvailableTable[]>(res.data);
  },

  async updateStatus(id: string, status: string): Promise<Reservation> {
    const res = await axiosInstance.patch(API_ROUTES.RESERVATIONS.UPDATE_STATUS(id), { status });
    return unwrap<Reservation>(res.data);
  },

  async checkIn(code: string): Promise<Reservation> {
    const res = await axiosInstance.post(API_ROUTES.RESERVATIONS.CHECKIN(code));
    return unwrap<Reservation>(res.data);
  },

  async cancel(id: string, approveReview?: boolean, reason?: string): Promise<Reservation> {
    const res = await axiosInstance.post(API_ROUTES.RESERVATIONS.CANCEL(id), { approveReview, reason });
    return unwrap<Reservation>(res.data);
  },

  async update(id: string, dto: UpdateReservationDto): Promise<Reservation> {
    const res = await axiosInstance.patch(API_ROUTES.RESERVATIONS.UPDATE(id), dto);
    return unwrap<Reservation>(res.data);
  },

  async getStats(restaurantId: string, period: StatsPeriod): Promise<ReservationStats> {
    const res = await axiosInstance.get(API_ROUTES.RESERVATIONS.STATS, { params: { restaurantId, period } });
    return unwrap<ReservationStats>(res.data);
  },

  async complete(id: string): Promise<Reservation> {
    const res = await axiosInstance.post(API_ROUTES.RESERVATIONS.COMPLETE(id));
    return unwrap<Reservation>(res.data);
  },

  async resolveNoShow(id: string): Promise<Reservation> {
    const res = await axiosInstance.post(`/reservations/${id}/resolve-noshow`);
    return unwrap<Reservation>(res.data);
  },
};

export default reservationService;
