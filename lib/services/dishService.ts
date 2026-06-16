import axiosInstance from "./axiosInstance";
import { API_ROUTES } from "../constants/apiRoutes";

// Interfaces from HEAD
export interface DishCreateDto {
  name: string;
  categoryId: string;
  price: number;
  description: string;
  unit: string;
  quantity: number;
  isActive: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  autoDisableByStock: boolean;
  images?: Array<{
    id?: string; // For existing images
    file?: File; // For new images
    imageType: number;
    displayOrder: number;
    isActive: boolean;
  }>;
}

export interface DishUpdateDto extends DishCreateDto {}

export interface DishImageDto {
  id: string;
  file: null;
  imageUrl: string;
  imageType: number;
  displayOrder: number;
  isActive: boolean;
}

export interface DishResponseDto {
  id: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  price: number;
  description: string;
  unit: string;
  quantity: number;
  isActive: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  autoDisableByStock: boolean;
  images?: DishImageDto[];
  mainImageUrl?: string;
  imageUrl?: string;
  image?: string;
}

export interface MenuItem extends Partial<DishResponseDto> {
  id: string;
  categoryId: string;
  categoryName: string;
  imageUrl?: string;
  name?: string;
  price?: number;
  description?: string;
  unit?: string;
  quantity?: number;
  isActive?: boolean;
}

export interface MenuCategory {
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
}

export interface DishListResponseDto {
  dishes?: DishResponseDto[];
  data?: DishResponseDto[];
  items?: DishResponseDto[];
  totalCount?: number;
  page?: number;
  itemsPerPage?: number;
}

export interface ComboDetailItemDto {
  id?: string;
  dishId: string;
  dishName?: string;
  dishPrice?: number;
  quantity: number;
}

export interface ComboSummaryDto {
  id: string;
  name: string;
  code?: string;
  description: string;
  imageUrl?: string;
  baseCost: number;
  price: number;
  isActive: boolean;
  details: ComboDetailItemDto[];
}

export interface ComboCreateDto {
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  details: ComboDetailItemDto[];
  file?: File;
}

export interface ComboUpdateDto extends ComboCreateDto {}

// Interfaces from dev branch
export interface Dish {
  id: string;
  categoryId: string;
  restaurantId: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  imageUrl?: string | null;
  isVegetarian: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  autoDisableByStock: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
}

export interface CreateDishData {
  categoryId: string;
  name: string;
  description: string;
  price: number | string;
  unit: string;
  imageUrl?: string | null;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  autoDisableByStock?: boolean;
}

export interface UpdateDishData {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: number | string;
  unit?: string;
  imageUrl?: string | null;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  autoDisableByStock?: boolean;
}

export interface DishListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isBestSeller?: boolean;
  restaurantId?: string;
}

export interface DishListResponse {
  success: boolean;
  data: Dish[];
  total: number;
  page: number;
  limit: number;
}

class DishService {
  private dishListCache = new Map<string, DishListResponseDto>();
  private dishListInFlight = new Map<string, Promise<DishListResponseDto>>();
  private dishByIdCache = new Map<string, DishResponseDto>();
  private dishByIdInFlight = new Map<string, Promise<DishResponseDto>>();
  private menuCache: MenuCategory[] | null = null;
  private menuInFlight: Promise<MenuCategory[]> | null = null;
  private comboListCache: ComboSummaryDto[] | null = null;
  private comboListInFlight: Promise<ComboSummaryDto[]> | null = null;
  private activeComboListCache: ComboSummaryDto[] | null = null;
  private activeComboListInFlight: Promise<ComboSummaryDto[]> | null = null;
  private comboByIdCache = new Map<string, ComboSummaryDto>();
  private comboByIdInFlight = new Map<string, Promise<ComboSummaryDto>>();

  private getDishListCacheKey(page: number, itemsPerPage: number): string {
    return `${page}:${itemsPerPage}`;
  }

  private invalidateDishCache(id?: string): void {
    this.dishListCache.clear();
    this.dishListInFlight.clear();
    this.menuCache = null;
    this.menuInFlight = null;
    this.invalidateComboCache();

    if (id) {
      this.dishByIdCache.delete(id);
      this.dishByIdInFlight.delete(id);
      return;
    }

    this.dishByIdCache.clear();
    this.dishByIdInFlight.clear();
  }

  private invalidateComboCache(id?: string): void {
    this.comboListCache = null;
    this.comboListInFlight = null;

    if (id) {
      this.comboByIdCache.delete(id);
      this.comboByIdInFlight.delete(id);
      return;
    }

    this.comboByIdCache.clear();
    this.comboByIdInFlight.clear();
  }

  private normalizeComboDetail(raw: any): ComboDetailItemDto {
    const quantity = Number(raw?.quantity ?? raw?.Quantity ?? 1);
    const dishPrice = Number(raw?.dishPrice ?? raw?.DishPrice ?? 0);

    return {
      id: raw?.id ?? raw?.Id,
      dishId: String(raw?.dishId ?? raw?.DishId ?? ""),
      dishName: raw?.dishName ?? raw?.DishName,
      dishPrice: Number.isNaN(dishPrice) ? 0 : dishPrice,
      quantity:
        Number.isNaN(quantity) || quantity <= 0 ? 1 : Math.floor(quantity),
    };
  }

  private normalizeCombo(raw: any): ComboSummaryDto {
    const baseCost = Number(raw?.baseCost ?? raw?.BaseCost ?? 0);
    const price = Number(raw?.price ?? raw?.Price ?? 0);
    const details = Array.isArray(raw?.details)
      ? raw.details
      : Array.isArray(raw?.Details)
        ? raw.Details
        : [];

    return {
      id: String(raw?.id ?? raw?.Id ?? ""),
      name: raw?.name ?? raw?.Name ?? "",
      code: raw?.code ?? raw?.Code ?? "",
      description: raw?.description ?? raw?.Description ?? "",
      imageUrl: raw?.imageUrl ?? raw?.ImageUrl ?? "",
      baseCost: Number.isNaN(baseCost) ? 0 : baseCost,
      price: Number.isNaN(price) ? 0 : price,
      isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? false),
      details: details.map((detail: any) => this.normalizeComboDetail(detail)),
    };
  }

  private extractArrayData(raw: any): any[] {
    if (Array.isArray(raw)) {
      return raw;
    }

    if (Array.isArray(raw?.data)) {
      return raw.data;
    }

    if (Array.isArray(raw?.items)) {
      return raw.items;
    }

    return [];
  }

  private extractId(raw: any): string {
    if (typeof raw === "string") {
      return raw;
    }

    const id = raw?.id ?? raw?.Id ?? raw?.data?.id ?? raw?.data?.Id;
    return typeof id === "string" ? id : "";
  }

  // --- REST Methods from dev branch ---
  async list(params: DishListParams): Promise<DishListResponse> {
    const res = await axiosInstance.get<DishListResponse>(API_ROUTES.DISHES.LIST, { params });
    return res.data;
  }

  async getDetail(id: string, restaurantId?: string): Promise<Dish> {
    const res = await axiosInstance.get<{ success: boolean; data: Dish }>(
      API_ROUTES.DISHES.DETAIL(id),
      { params: { restaurantId } }
    );
    return res.data.data;
  }

  async create(data: CreateDishData, restaurantId?: string): Promise<Dish> {
    const res = await axiosInstance.post<{ success: boolean; data: Dish }>(
      API_ROUTES.DISHES.CREATE,
      { ...data, restaurantId }
    );
    this.invalidateDishCache();
    return res.data.data;
  }

  async update(id: string, data: UpdateDishData, restaurantId?: string): Promise<Dish> {
    const res = await axiosInstance.put<{ success: boolean; data: Dish }>(
      API_ROUTES.DISHES.UPDATE(id),
      { ...data, restaurantId }
    );
    this.invalidateDishCache(id);
    return res.data.data;
  }

  async delete(id: string, restaurantId?: string): Promise<void> {
    await axiosInstance.delete(API_ROUTES.DISHES.DELETE(id), { params: { restaurantId } });
    this.invalidateDishCache(id);
  }

  // --- Methods from HEAD branch ---
  async getDishes(
    page: number = 1,
    itemsPerPage: number = 100,
  ): Promise<DishListResponseDto> {
    const cacheKey = this.getDishListCacheKey(page, itemsPerPage);

    const cached = this.dishListCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const inFlight = this.dishListInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const request = axiosInstance
      .get("/dishes", {
        params: { page, itemsPerPage },
      })
      .then((response) => {
        const data = response.data as DishListResponseDto;
        this.dishListCache.set(cacheKey, data);
        return data;
      })
      .finally(() => {
        this.dishListInFlight.delete(cacheKey);
      });

    this.dishListInFlight.set(cacheKey, request);
    return request;
  }

  async getDishById(id: string): Promise<DishResponseDto> {
    const cached = this.dishByIdCache.get(id);
    if (cached) {
      return cached;
    }

    const inFlight = this.dishByIdInFlight.get(id);
    if (inFlight) {
      return inFlight;
    }

    const request = axiosInstance
      .get(`/dishes/${id}`)
      .then((response) => {
        const data = response.data as DishResponseDto;
        this.dishByIdCache.set(id, data);
        return data;
      })
      .finally(() => {
        this.dishByIdInFlight.delete(id);
      });

    this.dishByIdInFlight.set(id, request);
    return request;
  }

  async getMenu(): Promise<MenuCategory[]> {
    if (this.menuCache) {
      return this.menuCache;
    }

    if (this.menuInFlight) {
      return this.menuInFlight;
    }

    const request = axiosInstance
      .get("/dishes/menu")
      .then((response) => {
        const data = response.data as MenuCategory[];
        this.menuCache = data;
        return data;
      })
      .finally(() => {
        this.menuInFlight = null;
      });

    this.menuInFlight = request;
    return request;
  }

  async createDish(dish: DishCreateDto): Promise<DishResponseDto> {
    const formData = this.buildFormData(dish);
    const response = await axiosInstance.post("/dishes", formData);
    this.invalidateDishCache();
    return response.data;
  }

  async updateDish(id: string, dish: DishUpdateDto): Promise<DishResponseDto> {
    const formData = this.buildFormData(dish);
    const response = await axiosInstance.put(`/dishes/${id}`, formData);
    this.invalidateDishCache(id);
    return response.data;
  }

  private buildFormData(dish: DishCreateDto | DishUpdateDto): FormData {
    const formData = new FormData();

    if ("id" in dish && dish.id) {
      formData.append("id", dish.id.toString());
    }

    formData.append("name", dish.name || "");
    formData.append("categoryId", dish.categoryId || "");
    formData.append("price", (dish.price || 0).toString());
    formData.append("description", dish.description || "");
    formData.append("unit", dish.unit || "");
    formData.append("quantity", (dish.quantity || 0).toString());
    formData.append("isActive", String(dish.isActive));
    formData.append("isVegetarian", String(dish.isVegetarian));
    formData.append("isSpicy", String(dish.isSpicy));
    formData.append("isBestSeller", String(dish.isBestSeller));
    formData.append("autoDisableByStock", String(dish.autoDisableByStock));

    if (dish.images && dish.images.length > 0) {
      dish.images.forEach((img, index) => {
        if (img.id) {
          formData.append(`Images[${index}].Id`, img.id);
        }
        if (img.file) {
          formData.append(`Images[${index}].File`, img.file);
        }
        formData.append(`Images[${index}].ImageType`, img.imageType.toString());
        formData.append(
          `Images[${index}].DisplayOrder`,
          img.displayOrder.toString(),
        );
        formData.append(`Images[${index}].IsActive`, String(img.isActive));
      });
    }

    return formData;
  }

  async deleteDish(id: string): Promise<void> {
    await axiosInstance.delete(`/dishes/${id}`);
    this.invalidateDishCache(id);
  }

  async uploadDishImage(
    id: string,
    imageFile: File,
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await axiosInstance.post(
      `/dishes/${id}/image`,
      formData,
      {},
    );
    return response.data;
  }

  async toggleDishStatus(
    id: string,
    isActive: boolean,
  ): Promise<DishResponseDto> {
    const currentDish = await this.getDishById(id);

    const response = await this.updateDish(id, {
      name: currentDish.name,
      categoryId: currentDish.categoryId || "",
      price: currentDish.price,
      description: currentDish.description,
      unit: currentDish.unit,
      quantity: currentDish.quantity,
      isActive,
      isVegetarian: currentDish.isVegetarian,
      isSpicy: currentDish.isSpicy,
      isBestSeller: currentDish.isBestSeller,
      autoDisableByStock: currentDish.autoDisableByStock,
      images: (currentDish.images || []).map((img) => ({
        id: img.id,
        imageType: img.imageType,
        displayOrder: img.displayOrder,
        isActive: img.isActive,
      })),
    });

    this.invalidateDishCache(id);
    return response;
  }

  private buildComboFormData(combo: ComboCreateDto | ComboUpdateDto): FormData {
    const formData = new FormData();

    formData.append("Name", (combo.name || "").trim());
    formData.append("Description", (combo.description || "").trim());
    formData.append("Price", (combo.price || 0).toString());
    formData.append("IsActive", String(combo.isActive));

    if (combo.file) {
      formData.append("File", combo.file);
    }

    (combo.details || []).forEach((detail, index) => {
      formData.append(`Details[${index}].DishId`, detail.dishId);
      formData.append(
        `Details[${index}].Quantity`,
        String(detail.quantity > 0 ? Math.floor(detail.quantity) : 1),
      );
    });

    return formData;
  }

  async getCombos(forceRefresh: boolean = false): Promise<ComboSummaryDto[]> {
    if (!forceRefresh && this.comboListCache) {
      return this.comboListCache;
    }

    if (!forceRefresh && this.comboListInFlight) {
      return this.comboListInFlight;
    }

    const request = axiosInstance
      .get("/dishes/combos")
      .then((response) => {
        const normalized = this.extractArrayData(response.data).map((item) =>
          this.normalizeCombo(item),
        );

        this.comboListCache = normalized;
        normalized.forEach((combo) => {
          if (combo.id) {
            this.comboByIdCache.set(combo.id, combo);
          }
        });

        return normalized;
      })
      .finally(() => {
        this.comboListInFlight = null;
      });

    this.comboListInFlight = request;
    return request;
  }

  async getActiveCombos(): Promise<ComboSummaryDto[]> {
    if (this.activeComboListCache) {
      return this.activeComboListCache;
    }
    if (this.activeComboListInFlight) {
      return this.activeComboListInFlight;
    }
    const request = axiosInstance
      .get("/dishes/combos/active")
      .then((response) => {
        const normalized = this.extractArrayData(response.data).map((item) =>
          this.normalizeCombo(item),
        );
        this.activeComboListCache = normalized;
        return normalized;
      })
      .finally(() => {
        this.activeComboListInFlight = null;
      });
    this.activeComboListInFlight = request;
    return request;
  }

  clearActiveComboCache() {
    this.activeComboListCache = null;
  }

  async getComboById(id: string): Promise<ComboSummaryDto> {
    const cached = this.comboByIdCache.get(id);
    if (cached) {
      return cached;
    }

    const inFlight = this.comboByIdInFlight.get(id);
    if (inFlight) {
      return inFlight;
    }

    const request = axiosInstance
      .get(`/dishes/combos/${id}`)
      .then((response) => {
        const normalized = this.normalizeCombo(response.data);
        this.comboByIdCache.set(id, normalized);
        return normalized;
      })
      .finally(() => {
        this.comboByIdInFlight.delete(id);
      });

    this.comboByIdInFlight.set(id, request);
    return request;
  }

  async createCombo(combo: ComboCreateDto): Promise<string> {
    const formData = this.buildComboFormData(combo);
    const response = await axiosInstance.post("/dishes/combos", formData);
    this.invalidateComboCache();
    return this.extractId(response.data);
  }

  async updateCombo(id: string, combo: ComboUpdateDto): Promise<string> {
    const formData = this.buildComboFormData(combo);
    const response = await axiosInstance.put(`/dishes/combos/${id}`, formData);
    this.invalidateComboCache(id);
    return this.extractId(response.data);
  }

  async deleteCombo(id: string): Promise<void> {
    await axiosInstance.delete(`/dishes/combos/${id}`);
    this.invalidateComboCache(id);
  }

  async toggleComboStatus(id: string, isActive: boolean): Promise<string> {
    const currentCombo = await this.getComboById(id);

    return this.updateCombo(id, {
      name: currentCombo.name,
      description: currentCombo.description,
      price: currentCombo.price,
      isActive,
      details: (currentCombo.details || []).map((detail) => ({
        id: detail.id,
        dishId: detail.dishId,
        quantity: detail.quantity,
      })),
    });
  }
}

export const dishService = new DishService();
export default dishService;
