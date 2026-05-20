// ============================================================
// MOCK DATA for Restaurant Owner Dashboard
// ============================================================

export const MOCK_RESTAURANT_SUMMARY = {
  revenue: { total: 48_500_000, changePercent: 12.4 },
  orders: { total: 312, completed: 289, liveProcessing: 5 },
  reservations: { total: 87, pending: 14 },
  newCustomers: { total: 43, changePercent: 8.7 },
  fromDate: "2026-05-13T00:00:00+07:00",
  toDate: "2026-05-20T00:00:00+07:00",
};

export const MOCK_RESTAURANT_REVENUE_TREND = [
  { date: "2026-05-13", value: 5_200_000, label: "13/05" },
  { date: "2026-05-14", value: 7_800_000, label: "14/05" },
  { date: "2026-05-15", value: 6_100_000, label: "15/05" },
  { date: "2026-05-16", value: 9_400_000, label: "16/05" },
  { date: "2026-05-17", value: 8_200_000, label: "17/05" },
  { date: "2026-05-18", value: 11_800_000, label: "18/05" },
  { date: "2026-05-19", value: 0, label: "19/05" },
];

export const MOCK_RESTAURANT_ORDER_TREND = [
  { date: "2026-05-13", total: 38, label: "13/05" },
  { date: "2026-05-14", total: 52, label: "14/05" },
  { date: "2026-05-15", total: 41, label: "15/05" },
  { date: "2026-05-16", total: 67, label: "16/05" },
  { date: "2026-05-17", total: 58, label: "17/05" },
  { date: "2026-05-18", total: 49, label: "18/05" },
  { date: "2026-05-19", total: 7, label: "19/05" },
];

export const MOCK_TOP_DISHES = [
  { dishId: "1", name: "Phở bò đặc biệt", quantity: 187, revenue: 13_090_000 },
  { dishId: "2", name: "Bún bò Huế", quantity: 142, revenue: 8_520_000 },
  { dishId: "3", name: "Cơm tấm sườn bì", quantity: 126, revenue: 6_300_000 },
  { dishId: "4", name: "Bánh mì thịt nướng", quantity: 98, revenue: 2_940_000 },
  { dishId: "5", name: "Chả cá Thăng Long", quantity: 74, revenue: 7_400_000 },
];

export const MOCK_RESTAURANT_FEEDBACKS = {
  items: [
    {
      id: "1",
      customerName: "Nguyễn Văn An",
      isAnonymous: false,
      rating: 5,
      comment: "Phở ngon tuyệt, nước dùng đậm đà, phục vụ nhiệt tình!",
      createdDate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      customerName: "Trần Thị Bình",
      isAnonymous: false,
      rating: 4,
      comment: "Không gian sạch sẽ, thoáng mát. Món ăn ngon, sẽ quay lại.",
      createdDate: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      customerName: undefined,
      isAnonymous: true,
      rating: 3,
      comment: "Giá hơi cao so với khẩu phần. Đồ ăn ổn.",
      createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      customerName: "Lê Minh Cường",
      isAnonymous: false,
      rating: 5,
      comment: "Bún bò cực ngon, sẽ recommend cho bạn bè!",
      createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  averageRating: 4.25,
  totalCount: 47,
};

// ============================================================
// MOCK DATA for Admin Dashboard (Platform-level)
// ============================================================

export const MOCK_ADMIN_SUMMARY = {
  totalRestaurants: { total: 38, changePercent: 5.2, active: 32 },
  totalRevenue: { total: 1_240_000_000, changePercent: 18.6 },
  totalOrders: { total: 8_432, changePercent: 22.1 },
  totalUsers: { total: 15_784, changePercent: 11.3, newThisMonth: 342 },
  fromDate: "2026-05-13T00:00:00+07:00",
  toDate: "2026-05-20T00:00:00+07:00",
};

export const MOCK_ADMIN_REVENUE_TREND = [
  { date: "2026-05-13", value: 142_000_000, label: "13/05" },
  { date: "2026-05-14", value: 198_000_000, label: "14/05" },
  { date: "2026-05-15", value: 165_000_000, label: "15/05" },
  { date: "2026-05-16", value: 224_000_000, label: "16/05" },
  { date: "2026-05-17", value: 187_000_000, label: "17/05" },
  { date: "2026-05-18", value: 324_000_000, label: "18/05" },
  { date: "2026-05-19", value: 0, label: "19/05" },
];

export const MOCK_ADMIN_ORDER_TREND = [
  { date: "2026-05-13", total: 1042, label: "13/05" },
  { date: "2026-05-14", total: 1387, label: "14/05" },
  { date: "2026-05-15", total: 1156, label: "15/05" },
  { date: "2026-05-16", total: 1524, label: "16/05" },
  { date: "2026-05-17", total: 1298, label: "17/05" },
  { date: "2026-05-18", total: 2025, label: "18/05" },
  { date: "2026-05-19", total: 0, label: "19/05" },
];

export const MOCK_TOP_RESTAURANTS = [
  {
    id: "r1",
    name: "Phở Hà Nội - Quận 1",
    slug: "pho-ha-noi-q1",
    revenue: 285_000_000,
    orders: 1842,
    rating: 4.8,
    status: "active" as const,
  },
  {
    id: "r2",
    name: "Cơm Tấm Sài Gòn",
    slug: "com-tam-sai-gon",
    revenue: 198_000_000,
    orders: 1356,
    rating: 4.6,
    status: "active" as const,
  },
  {
    id: "r3",
    name: "Bún Bò Huế Đặc Biệt",
    slug: "bun-bo-hue",
    revenue: 167_000_000,
    orders: 1124,
    rating: 4.7,
    status: "active" as const,
  },
  {
    id: "r4",
    name: "Nhà Hàng Hải Sản Tươi",
    slug: "hai-san-tuoi",
    revenue: 142_000_000,
    orders: 987,
    rating: 4.5,
    status: "active" as const,
  },
  {
    id: "r5",
    name: "Lẩu Thái Authentic",
    slug: "lau-thai",
    revenue: 118_000_000,
    orders: 823,
    rating: 4.4,
    status: "inactive" as const,
  },
];

export const MOCK_RECENT_TENANT_REQUESTS = [
  {
    id: "req1",
    restaurantName: "Quán Ăn Mẹ Nấu",
    ownerName: "Phạm Thị Dung",
    email: "dungpham@gmail.com",
    phone: "0912345678",
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "pending" as const,
  },
  {
    id: "req2",
    restaurantName: "Pizza House Sài Gòn",
    ownerName: "Nguyễn Hoàng Nam",
    email: "namnh@email.com",
    phone: "0987654321",
    requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: "pending" as const,
  },
  {
    id: "req3",
    restaurantName: "BBQ Garden",
    ownerName: "Trần Minh Khoa",
    email: "khoatm@gmail.com",
    phone: "0978123456",
    requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "approved" as const,
  },
];
