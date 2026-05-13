export interface BreakdownEntry {
  date: string;
  revenue: number;
  discountAmount: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  newCustomers: number;
  newReservations: number;
}

export interface TenantSummary {
  tenantId: string;
  periodStart: string;
  periodType: string;
  revenue: number;
  discountAmount: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  newCustomers: number;
  newReservations: number;
}

export interface AllTenantsSnapshot {
  periodStart: string;
  periodType: string;
  totalRevenue: number;
  totalDiscountAmount: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  newCustomers: number;
  newReservations: number;
  tenants: TenantSummary[];
}

export interface TenantDetailSnapshot extends TenantSummary {
  breakdown: BreakdownEntry[];
}

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface CustomDateRange {
  start: string;
  end: string;
}

export interface SnapshotState {
  periodType: PeriodType;
  customRange: CustomDateRange | null;
  selectedTenantId: string | null;
  allTenantsData: AllTenantsSnapshot | null;
  tenantDetailData: TenantDetailSnapshot | null;
  loading: boolean;
  error: string | null;
}
