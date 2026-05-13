/**
 * Common types for RestX Frontend
 */

// User types
export interface User {
  id: string;
  email: string;
  userName: string;
  fullName?: string;
  role: UserRole;
  tenantId?: string;
}

export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  RestaurantAdmin = 'RestaurantAdmin',
  Staff = 'Staff',
  Customer = 'Customer',
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  primaryColor?: string;
  isActive: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Menu types
export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  isAvailable: boolean;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string;
  customerId?: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export enum OrderStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Preparing = 'Preparing',
  Ready = 'Ready',
  Served = 'Served',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface OrderItem {
  id: string;
  dishId: string;
  dishName: string;
  quantity: number;
  price: number;
  notes?: string;
}

// Reservation types
export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  numberOfGuests: number;
  reservationDate: string;
  reservationTime: string;
  status: ReservationStatus;
  tableId?: string;
  notes?: string;
}

export enum ReservationStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  CheckedIn = 'CheckedIn',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow',
}

// Table types
export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  floorId: string;
  status: TableStatus;
  qrCode?: string;
}

export enum TableStatus {
  Available = 'Available',
  Occupied = 'Occupied',
  Reserved = 'Reserved',
  Cleaning = 'Cleaning',
}
