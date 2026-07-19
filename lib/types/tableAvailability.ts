export interface TableAvailabilityStatus {
  id: string;
  code: string;
  seatingCapacity: number;
  floor: string;
  status: 'FULLY_AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'OCCUPIED' | 'PENDING_CHECKIN';
  nextReservation: string | null;
  usableUntil: string | null;
  pendingReservation: {
    time: string;
    expectedEndTime: string;
    status: string;
  } | null;
}