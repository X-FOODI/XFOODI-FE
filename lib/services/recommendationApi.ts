import axiosInstance from "./axiosInstance";

export interface RecommendedDish {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryName?: string | null;
  reason?: string;
  coOccurrenceCount?: number;
  flavors?: {
    sweet: number;
    spicy: number;
    savory: number;
    alcohol: number;
  };
}

/** "Thường được gọi kèm" — data-driven, không cần đăng nhập. */
export async function fetchFrequentlyBought(
  restaurantId: string,
  dishId: string
): Promise<RecommendedDish[]> {
  const res = await axiosInstance.get("/ai/recommendations/frequently-bought", {
    params: { restaurantId, dishId },
  });
  return res.data?.success ? res.data.data : [];
}

/** "Gợi ý cho bạn" — AI dựa trên giỏ hàng, có fallback phía backend. */
export async function fetchMenuRecommendations(
  restaurantId: string,
  cartDishIds: string[]
): Promise<RecommendedDish[]> {
  const res = await axiosInstance.post("/ai/recommendations/menu", {
    restaurantId,
    cartDishIds,
  });
  return res.data?.success ? res.data.data : [];
}
