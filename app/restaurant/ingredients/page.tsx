"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { message, Modal, Input, Select, Button, Tooltip } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  EditOutlined,
  WarningOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";

const { Option } = Select;

interface IngredientCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface InventoryStock {
  id: string;
  currentQuantity: number;
  lastRestockDate?: string;
  lastUpdated: string;
}

interface Ingredient {
  id: string;
  name: string;
  code: string;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  supplierId?: string;
  type?: string;
  isActive: boolean;
  ingredientCategoryId?: string;
  status: number;
  category?: IngredientCategory;
  supplier?: Supplier;
  inventoryStock?: InventoryStock;
}

export default function IngredientsPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, LOW, OUT, NORMAL

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [ingredientForm, setIngredientForm] = useState({
    id: "",
    name: "",
    code: "",
    unit: "Kg",
    minStockLevel: 5,
    maxStockLevel: 100,
    supplierId: "",
    ingredientCategoryId: "",
    currentQuantity: 0,
  });

  const [transactionForm, setTransactionForm] = useState({
    ingredientId: "",
    transactionType: "IMPORT", // IMPORT, EXPORT
    quantity: 1,
    unitPrice: 0,
    reference: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Guard routing
  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.replace("/login-email?redirect=/restaurant/ingredients");
  }, [isAuthReady, user, router]);

  // Fetch ingredients data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ingredientsRes, categoriesRes, suppliersRes] = await Promise.all([
        axiosInstance.get("/ingredients"),
        axiosInstance.get("/ingredients/categories"),
        axiosInstance.get("/ingredients/suppliers"),
      ]);

      if (ingredientsRes.data?.success) setIngredients(ingredientsRes.data.data);
      if (categoriesRes.data?.success) setCategories(categoriesRes.data.data);
      if (suppliersRes.data?.success) setSuppliers(suppliersRes.data.data);
    } catch {
      message.error("Lỗi khi tải dữ liệu nguyên liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    fetchData();
  }, [fetchData, isAuthReady, user]);

  // Filter logic
  const filteredIngredients = ingredients.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "ALL" || item.ingredientCategoryId === categoryFilter;
    const matchSupplier =
      supplierFilter === "ALL" || item.supplierId === supplierFilter;

    const currentQty = item.inventoryStock?.currentQuantity ?? 0;
    let matchStatus = true;
    if (statusFilter === "LOW") {
      matchStatus = currentQty > 0 && currentQty <= item.minStockLevel;
    } else if (statusFilter === "OUT") {
      matchStatus = currentQty <= 0;
    } else if (statusFilter === "NORMAL") {
      matchStatus = currentQty > item.minStockLevel;
    }

    return matchSearch && matchCategory && matchSupplier && matchStatus;
  });

  // Stats calculation
  const totalItems = ingredients.length;
  const outOfStockCount = ingredients.filter(
    (i) => (i.inventoryStock?.currentQuantity ?? 0) <= 0
  ).length;
  const lowStockCount = ingredients.filter((i) => {
    const qty = i.inventoryStock?.currentQuantity ?? 0;
    return qty > 0 && qty <= i.minStockLevel;
  }).length;

  // Add / Edit ingredient submission
  const handleIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (ingredientForm.id) {
        // Edit mode
        await axiosInstance.patch(`/ingredients/${ingredientForm.id}`, ingredientForm);
        message.success("Cập nhật nguyên liệu thành công");
      } else {
        // Create mode
        await axiosInstance.post("/ingredients", ingredientForm);
        message.success("Thêm nguyên liệu thành công");
      }
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Lưu nguyên liệu thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete ingredient
  const handleDeleteIngredient = (item: Ingredient) => {
    Modal.confirm({
      title: `Xóa nguyên liệu ${item.name}?`,
      content: "Các giao dịch kho liên quan cũng sẽ bị xóa. Hành động không thể hoàn tác.",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axiosInstance.delete(`/ingredients/${item.id}`);
          message.success("Xóa nguyên liệu thành công");
          fetchData();
        } catch {
          message.error("Lỗi khi xóa nguyên liệu");
        }
      },
    });
  };

  // Transaction submission (Import/Export)
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosInstance.post("/ingredients/transactions", transactionForm);
      message.success(
        transactionForm.transactionType === "IMPORT"
          ? "Nhập kho thành công"
          : "Xuất kho thành công"
      );
      setIsTransactionModalOpen(false);
      fetchData();
    } catch {
      message.error("Thực hiện giao dịch kho thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // Category submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axiosInstance.post("/ingredients/categories", categoryForm);
      message.success("Tạo danh mục nguyên liệu thành công");
      setCategories((prev) => [...prev, res.data.data]);
      setIngredientForm((prev) => ({
        ...prev,
        ingredientCategoryId: res.data.data.id,
      }));
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: "", code: "", description: "" });
    } catch {
      message.error("Lỗi tạo danh mục");
    } finally {
      setSubmitting(false);
    }
  };

  // Supplier submission
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axiosInstance.post("/ingredients/suppliers", supplierForm);
      message.success("Tạo nhà cung cấp thành công");
      setSuppliers((prev) => [...prev, res.data.data]);
      setIngredientForm((prev) => ({
        ...prev,
        supplierId: res.data.data.id,
      }));
      setIsSupplierModalOpen(false);
      setSupplierForm({ name: "", phone: "", email: "", address: "" });
    } catch {
      message.error("Lỗi tạo nhà cung cấp");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <DashboardHeader
        role="restaurant"
        restaurantName={tenant?.name ?? "Cửa hàng"}
        userName={user?.name ?? ""}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="restaurant"
          restaurantName={tenant?.name ?? "Cửa hàng"}
          userName={user?.name ?? ""}
          userEmail={user?.email ?? ""}
        />

        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          style={{ background: "var(--bg-base)" }}
        >
          <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
            
            {/* Header */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 border-b pb-5"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Quản lý Nguyên liệu & Kho
                </h1>
                <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
                  Theo dõi danh sách nguyên liệu, quản lý tồn kho cảnh báo hết và nhập xuất kho.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-zinc-700"
                >
                  <ReloadOutlined />
                  Làm mới
                </button>
                <button
                  onClick={() => {
                    setIngredientForm({
                      id: "",
                      name: "",
                      code: "",
                      unit: "Kg",
                      minStockLevel: 5,
                      maxStockLevel: 100,
                      supplierId: "",
                      ingredientCategoryId: "",
                      currentQuantity: 0,
                    });
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-[#FF5A2C] hover:bg-[#ff7a53] shadow-md shadow-[#FF5A2C]/20"
                >
                  <PlusOutlined />
                  Thêm nguyên liệu
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl p-5 border flex items-center justify-between bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Tổng loại mặt hàng</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalItems}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 text-lg">
                  <InboxOutlined />
                </div>
              </div>
              <div className="rounded-2xl p-5 border flex items-center justify-between bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cảnh báo sắp hết</p>
                  <h3 className="text-2xl font-black text-amber-500 mt-1">{lowStockCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 text-lg">
                  <WarningOutlined />
                </div>
              </div>
              <div className="rounded-2xl p-5 border flex items-center justify-between bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Hết hàng tồn</p>
                  <h3 className="text-2xl font-black text-red-500 mt-1">{outOfStockCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 text-lg">
                  <WarningOutlined />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Input
                  placeholder="Tìm theo tên, mã..."
                  prefix={<SearchOutlined className="text-slate-450" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg"
                  allowClear
                />
              </div>
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ minWidth: 160 }}
                className="rounded-lg"
              >
                <Option value="ALL">Tất cả danh mục</Option>
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
              <Select
                value={supplierFilter}
                onChange={setSupplierFilter}
                style={{ minWidth: 160 }}
                className="rounded-lg"
              >
                <Option value="ALL">Tất cả nhà cung cấp</Option>
                {suppliers.map((s) => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ minWidth: 160 }}
                className="rounded-lg"
              >
                <Option value="ALL">Tất cả trạng thái tồn</Option>
                <Option value="NORMAL">Đầy đủ (Đang an toàn)</Option>
                <Option value="LOW">Cảnh báo sắp hết</Option>
                <Option value="OUT">Hết hàng</Option>
              </Select>
            </div>

            {/* Grid List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850">
                      <th className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Mã nguyên liệu</th>
                      <th className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Tên mặt hàng</th>
                      <th className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Danh mục</th>
                      <th className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Lượng tồn</th>
                      <th className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Ngưỡng cảnh báo</th>
                      <th className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Nhà cung cấp</th>
                      <th className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={7} className="py-5 px-5">
                            <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-full" />
                          </td>
                        </tr>
                      ))
                    ) : filteredIngredients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-450 dark:text-zinc-500">
                          Chưa có thông tin nguyên liệu phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredIngredients.map((item) => {
                        const currentQty = item.inventoryStock?.currentQuantity ?? 0;
                        const isOutOfStock = currentQty <= 0;
                        const isLowStock = !isOutOfStock && currentQty <= item.minStockLevel;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 transition-colors">
                            <td className="py-4 px-5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {item.code}
                            </td>
                            <td className="py-4 px-5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {item.name}
                            </td>
                            <td className="py-4 px-5 text-sm text-slate-500 dark:text-slate-400">
                              {item.category?.name || "—"}
                            </td>
                            <td className="py-4 px-5 text-sm">
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-xs ${
                                  isOutOfStock
                                    ? "bg-red-500/10 text-red-500"
                                    : isLowStock
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-emerald-500/10 text-emerald-500"
                                }`}
                              >
                                {currentQty} {item.unit}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-sm text-slate-500 dark:text-slate-400">
                              Dưới {item.minStockLevel} {item.unit}
                            </td>
                            <td className="py-4 px-5 text-sm text-slate-500 dark:text-slate-400">
                              {item.supplier?.name || "—"}
                            </td>
                            <td className="py-4 px-5 text-sm">
                              <div className="flex gap-2.5">
                                <Tooltip title="Nhập / Xuất kho">
                                  <button
                                    onClick={() => {
                                      setTransactionForm({
                                        ingredientId: item.id,
                                        transactionType: "IMPORT",
                                        quantity: 10,
                                        unitPrice: 0,
                                        reference: "",
                                      });
                                      setSelectedIngredient(item);
                                      setIsTransactionModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                                  >
                                    <ArrowUpOutlined />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Chỉnh sửa">
                                  <button
                                    onClick={() => {
                                      setIngredientForm({
                                        id: item.id,
                                        name: item.name,
                                        code: item.code,
                                        unit: item.unit,
                                        minStockLevel: item.minStockLevel,
                                        maxStockLevel: item.maxStockLevel,
                                        supplierId: item.supplierId || "",
                                        ingredientCategoryId: item.ingredientCategoryId || "",
                                        currentQuantity: currentQty,
                                      });
                                      setIsAddModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                                  >
                                    <EditOutlined />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Xóa">
                                  <button
                                    onClick={() => handleDeleteIngredient(item)}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                  >
                                    <DeleteOutlined />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ─── ADD/EDIT INGREDIENT MODAL ─── */}
      <Modal
        title={ingredientForm.id ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu mới"}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        width={500}
      >
        <form onSubmit={handleIngredientSubmit} className="space-y-4 pt-3 text-slate-800 dark:text-slate-200">
          <div>
            <label className="text-xs font-bold block mb-1">Tên nguyên liệu *</label>
            <Input
              required
              placeholder="Ví dụ: Thịt bò phi lê, Trứng gà..."
              value={ingredientForm.name}
              onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1">Mã nguyên liệu *</label>
              <Input
                required
                placeholder="Ví dụ: BEEF_FILLET"
                value={ingredientForm.code}
                onChange={(e) => setIngredientForm({ ...ingredientForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Đơn vị tính *</label>
              <Input
                required
                placeholder="Ví dụ: Kg, Quả, Lít..."
                value={ingredientForm.unit}
                onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1">Ngưỡng cảnh báo tối thiểu *</label>
              <Input
                type="number"
                required
                value={ingredientForm.minStockLevel}
                onChange={(e) => setIngredientForm({ ...ingredientForm, minStockLevel: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Số lượng tồn kho ban đầu</label>
              <Input
                type="number"
                disabled={!!ingredientForm.id}
                value={ingredientForm.currentQuantity}
                onChange={(e) => setIngredientForm({ ...ingredientForm, currentQuantity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold">Danh mục nguyên liệu</label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  + Tạo danh mục mới
                </button>
              </div>
              <Select
                value={ingredientForm.ingredientCategoryId}
                onChange={(v) => setIngredientForm({ ...ingredientForm, ingredientCategoryId: v })}
                className="w-full"
                placeholder="Chọn danh mục"
              >
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold">Nhà cung cấp</label>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  + Tạo nhà cung cấp mới
                </button>
              </div>
              <Select
                value={ingredientForm.supplierId}
                onChange={(v) => setIngredientForm({ ...ingredientForm, supplierId: v })}
                className="w-full"
                placeholder="Chọn nhà cung cấp"
              >
                {suppliers.map((s) => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {ingredientForm.id ? "Lưu thay đổi" : "Tạo nguyên liệu"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── TRANSACTION (IMPORT/EXPORT) MODAL ─── */}
      <Modal
        title={`Điều chỉnh kho: ${selectedIngredient?.name}`}
        open={isTransactionModalOpen}
        onCancel={() => setIsTransactionModalOpen(false)}
        footer={null}
      >
        <form onSubmit={handleTransactionSubmit} className="space-y-4 pt-3 text-slate-800 dark:text-slate-200">
          <div>
            <label className="text-xs font-bold block mb-1">Loại giao dịch</label>
            <Select
              value={transactionForm.transactionType}
              onChange={(v) => setTransactionForm({ ...transactionForm, transactionType: v })}
              className="w-full"
            >
              <Option value="IMPORT">Nhập kho (+)</Option>
              <Option value="EXPORT">Xuất kho (-)</Option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1">Số lượng ({selectedIngredient?.unit}) *</label>
              <Input
                type="number"
                required
                min={0.1}
                step="any"
                value={transactionForm.quantity}
                onChange={(e) => setTransactionForm({ ...transactionForm, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Đơn giá nhập/xuất (đ)</label>
              <Input
                type="number"
                value={transactionForm.unitPrice}
                onChange={(e) => setTransactionForm({ ...transactionForm, unitPrice: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1">Tham chiếu / Ghi chú</label>
            <Input
              placeholder="Ví dụ: Nhập từ Big C, Xuất làm bánh ngọt..."
              value={transactionForm.reference}
              onChange={(e) => setTransactionForm({ ...transactionForm, reference: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button onClick={() => setIsTransactionModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Xác nhận
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── ADD CATEGORY QUICK MODAL ─── */}
      <Modal
        title="Tạo danh mục nguyên liệu mới"
        open={isCategoryModalOpen}
        onCancel={() => setIsCategoryModalOpen(false)}
        footer={null}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4 pt-3 text-slate-800 dark:text-slate-200">
          <div>
            <label className="text-xs font-bold block mb-1">Tên danh mục *</label>
            <Input
              required
              placeholder="Ví dụ: Hải sản, Rau củ, Gia vị..."
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">Mã danh mục *</label>
            <Input
              required
              placeholder="Ví dụ: SPICES, VEGGIES"
              value={categoryForm.code}
              onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">Mô tả</label>
            <Input
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button onClick={() => setIsCategoryModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Tạo danh mục
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── ADD SUPPLIER QUICK MODAL ─── */}
      <Modal
        title="Tạo nhà cung cấp mới"
        open={isSupplierModalOpen}
        onCancel={() => setIsSupplierModalOpen(false)}
        footer={null}
      >
        <form onSubmit={handleSupplierSubmit} className="space-y-4 pt-3 text-slate-800 dark:text-slate-200">
          <div>
            <label className="text-xs font-bold block mb-1">Tên nhà cung cấp *</label>
            <Input
              required
              placeholder="Ví dụ: Đại lý thịt bò sạch, Vườn rau VietGAP..."
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1">Số điện thoại</label>
              <Input
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Email</label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">Địa chỉ</label>
            <Input
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button onClick={() => setIsSupplierModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Tạo nhà cung cấp
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
