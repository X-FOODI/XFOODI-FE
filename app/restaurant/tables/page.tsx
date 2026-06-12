"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { message, Modal, Input, Select, InputNumber, Button, Tooltip } from "antd";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Floor {
  id: string;
  name: string;
  width: number;
  height: number;
  imageUrl: string | null;
}

interface TableSession {
  id: string;
  startedAt: string;
  order: {
    id: string;
    reference: string;
    totalAmount: number;
  } | null;
}

interface Table {
  id: string;
  code: string;
  seatingCapacity: number;
  type: string; // 'Normal' | 'VIP'
  shape: string; // 'Square' | 'Round' | 'Rectangle'
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  status: string; // 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
  statusName: string;
  statusColor: string;
  qrCodeUrl: string;
  floorId: string;
  floorName?: string;
  activeSession: TableSession | null;
}

export default function TablesManagementPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [tables, setTables] = useState<Table[]>([]);
  const [allTablesList, setAllTablesList] = useState<Table[]>([]); // For list/grid view

  // View Mode: 'view' (Operating / Realtime map), 'edit' (Layout position editor), 'list' (List grid CRUD)
  const [viewMode, setViewMode] = useState<"view" | "edit" | "list">("view");

  // Selection & drag states
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  // Modals visibility
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Form states
  const [floorForm, setFloorForm] = useState({ id: "", name: "", width: 600, height: 400 });
  const [tableForm, setTableForm] = useState({
    id: "",
    code: "",
    seatingCapacity: 4,
    type: "Normal",
    shape: "Square",
    floorId: "",
  });
  const [sessionActionTable, setSessionActionTable] = useState<Table | null>(null);
  const [transferTargetTableId, setTransferTargetTableId] = useState<string>("");
  const [mergeTargetTableId, setMergeTargetTableId] = useState<string>("");

  const canvasRef = useRef<HTMLDivElement>(null);

  // 1. Initial Page Authorization & Data Loading
  useEffect(() => {
    if (!isAuthReady || tenantLoading) return;
    if (!user) {
      router.replace("/login?redirect=/restaurant/tables");
      return;
    }
    setLoading(false);
    loadFloors();
  }, [isAuthReady, user, router, tenantLoading]);

  // Load floors
  const loadFloors = async () => {
    try {
      const res = await axiosInstance.get("/floors");
      if (res.data.success) {
        setFloors(res.data.data);
        if (res.data.data.length > 0 && !selectedFloorId) {
          setSelectedFloorId(res.data.data[0].id);
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể tải danh sách tầng");
    }
  };

  // Load tables for selected floor
  const loadFloorLayout = async (floorId: string) => {
    if (!floorId) return;
    try {
      const res = await axiosInstance.get(`/floors/${floorId}/layout`);
      if (res.data.success) {
        setTables(res.data.data.tables);
        setIsModified(false);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể tải sơ đồ tầng");
    }
  };

  // Load all tables (for grid/list view)
  const loadAllTables = async () => {
    try {
      const res = await axiosInstance.get("/tables");
      if (res.data.success) {
        setAllTablesList(res.data.data);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể tải danh sách bàn");
    }
  };

  useEffect(() => {
    if (selectedFloorId) {
      loadFloorLayout(selectedFloorId);
    }
  }, [selectedFloorId]);

  useEffect(() => {
    if (viewMode === "list") {
      loadAllTables();
    } else if (selectedFloorId) {
      loadFloorLayout(selectedFloorId);
    }
  }, [viewMode, selectedFloorId]);

  // 2. Realtime Updates via Socket.io
  useEffect(() => {
    if (!user?.restaurantId) return;

    const newSocket = io(BACKEND_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("[Tables] Socket connected:", newSocket.id);
      newSocket.emit("join_restaurant", user.restaurantId);
    });

    const handleRealtimeRefresh = () => {
      if (selectedFloorId) {
        loadFloorLayout(selectedFloorId);
      }
      if (viewMode === "list") {
        loadAllTables();
      }
    };

    // Socket listeners
    newSocket.on("TABLE_CREATED", handleRealtimeRefresh);
    newSocket.on("TABLE_UPDATED", handleRealtimeRefresh);
    newSocket.on("TABLE_DELETED", handleRealtimeRefresh);
    newSocket.on("TABLE_SESSION_STARTED", handleRealtimeRefresh);
    newSocket.on("TABLE_SESSIONS_MERGED", handleRealtimeRefresh);
    newSocket.on("TABLE_SESSION_TRANSFERRED", handleRealtimeRefresh);
    newSocket.on("TABLE_SESSION_CLOSED", handleRealtimeRefresh);
    newSocket.on("FLOOR_LAYOUT_CHANGED", (data) => {
      if (data.floorId === selectedFloorId) {
        loadFloorLayout(selectedFloorId);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.restaurantId, selectedFloorId, viewMode]);

  // 3. Drag and Drop Layout Editor Logic
  const handleTableMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (viewMode !== "edit") return;
    e.preventDefault();
    setSelectedTableId(tableId);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const startPosX = table.positionX;
    const startPosY = table.positionY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Restrict within canvas boundary
      const newX = Math.max(0, Math.min(canvas.clientWidth - table.width, startPosX + deltaX));
      const newY = Math.max(0, Math.min(canvas.clientHeight - table.height, startPosY + deltaY));

      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, positionX: newX, positionY: newY } : t))
      );
      setIsModified(true);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const saveLayout = async () => {
    try {
      const layoutData = tables.map((t) => ({
        id: t.id,
        positionX: t.positionX,
        positionY: t.positionY,
        width: t.width,
        height: t.height,
        rotation: t.rotation,
      }));
      const res = await axiosInstance.put(`/floors/${selectedFloorId}/layout`, { layout: layoutData });
      if (res.data.success) {
        message.success("Lưu sơ đồ bàn thành công");
        setIsModified(false);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Lỗi khi lưu sơ đồ bàn");
    }
  };

  // 4. Floor Management CRUD Actions
  const handleOpenFloorModal = (floor?: Floor) => {
    if (floor) {
      setFloorForm({ id: floor.id, name: floor.name, width: floor.width, height: floor.height });
    } else {
      setFloorForm({ id: "", name: "", width: 600, height: 400 });
    }
    setIsFloorModalOpen(true);
  };

  const handleSaveFloor = async () => {
    if (!floorForm.name.trim()) {
      message.warning("Vui lòng nhập tên tầng");
      return;
    }
    try {
      if (floorForm.id) {
        // Update
        const res = await axiosInstance.put(`/floors/${floorForm.id}`, floorForm);
        if (res.data.success) {
          message.success("Cập nhật tầng thành công");
          loadFloors();
        }
      } else {
        // Create
        const res = await axiosInstance.post("/floors", floorForm);
        if (res.data.success) {
          message.success("Tạo tầng mới thành công");
          loadFloors();
          setSelectedFloorId(res.data.data.id);
        }
      }
      setIsFloorModalOpen(false);
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể lưu thông tin tầng");
    }
  };

  const handleDeleteFloor = (floorId: string) => {
    Modal.confirm({
      title: "Xóa tầng",
      content: "Bạn có chắc chắn muốn xóa tầng này? Thao tác này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const res = await axiosInstance.delete(`/floors/${floorId}`);
          if (res.data.success) {
            message.success("Xóa tầng thành công");
            setSelectedFloorId("");
            loadFloors();
          }
        } catch (err: any) {
          message.error(err.response?.data?.message || "Không thể xóa tầng");
        }
      },
    });
  };

  // 5. Table Management CRUD Actions
  const handleOpenTableModal = (table?: Table) => {
    if (table) {
      setTableForm({
        id: table.id,
        code: table.code,
        seatingCapacity: table.seatingCapacity,
        type: table.type,
        shape: table.shape,
        floorId: table.floorId,
      });
    } else {
      setTableForm({
        id: "",
        code: "",
        seatingCapacity: 4,
        type: "Normal",
        shape: "Square",
        floorId: selectedFloorId,
      });
    }
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async () => {
    if (!tableForm.code.trim()) {
      message.warning("Vui lòng nhập số bàn/mã bàn");
      return;
    }
    if (!tableForm.floorId) {
      message.warning("Vui lòng chọn tầng");
      return;
    }
    try {
      if (tableForm.id) {
        // Update
        const res = await axiosInstance.put(`/tables/${tableForm.id}`, tableForm);
        if (res.data.success) {
          message.success("Cập nhật bàn thành công");
          if (viewMode === "list") loadAllTables();
          else loadFloorLayout(selectedFloorId);
        }
      } else {
        // Create
        const res = await axiosInstance.post("/tables", {
          ...tableForm,
          positionX: 50,
          positionY: 50,
        });
        if (res.data.success) {
          message.success("Tạo bàn thành công");
          if (viewMode === "list") loadAllTables();
          else loadFloorLayout(selectedFloorId);
        }
      }
      setIsTableModalOpen(false);
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể lưu thông tin bàn");
    }
  };

  const handleDeleteTable = (tableId: string) => {
    Modal.confirm({
      title: "Xóa bàn",
      content: "Bạn có chắc chắn muốn xóa bàn này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const res = await axiosInstance.delete(`/tables/${tableId}`);
          if (res.data.success) {
            message.success("Xóa bàn thành công");
            if (viewMode === "list") loadAllTables();
            else loadFloorLayout(selectedFloorId);
          }
        } catch (err: any) {
          message.error(err.response?.data?.message || "Không thể xóa bàn");
        }
      },
    });
  };

  // 6. Table Session Control Actions
  const handleTableClick = (table: Table) => {
    if (viewMode === "edit") {
      setSelectedTableId(table.id);
      return;
    }
    setSessionActionTable(table);
    setIsSessionModalOpen(true);
  };

  const startSession = async () => {
    if (!sessionActionTable) return;
    try {
      const res = await axiosInstance.post("/tables/sessions", {
        tableId: sessionActionTable.id,
      });
      if (res.data.success) {
        message.success(`Đã mở bàn ${sessionActionTable.code}`);
        setIsSessionModalOpen(false);
        loadFloorLayout(selectedFloorId);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể mở bàn");
    }
  };

  const closeSession = async () => {
    if (!sessionActionTable) return;
    Modal.confirm({
      title: `Thanh toán & Đóng bàn ${sessionActionTable.code}`,
      content: "Bạn muốn kết thúc phiên và thanh toán cho bàn này?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const res = await axiosInstance.post("/tables/sessions/close", {
            tableId: sessionActionTable.id,
          });
          if (res.data.success) {
            message.success(`Đã thanh toán bàn ${sessionActionTable.code}`);
            setIsSessionModalOpen(false);
            loadFloorLayout(selectedFloorId);
          }
        } catch (err: any) {
          message.error(err.response?.data?.message || "Không thể đóng bàn");
        }
      },
    });
  };

  const handleOpenTransfer = () => {
    setTransferTargetTableId("");
    setIsTransferModalOpen(true);
  };

  const executeTransfer = async () => {
    if (!sessionActionTable || !transferTargetTableId) return;
    try {
      const res = await axiosInstance.post("/tables/sessions/transfer", {
        fromTableId: sessionActionTable.id,
        toTableId: transferTargetTableId,
      });
      if (res.data.success) {
        message.success("Chuyển bàn thành công");
        setIsTransferModalOpen(false);
        setIsSessionModalOpen(false);
        loadFloorLayout(selectedFloorId);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể chuyển bàn");
    }
  };

  const handleOpenMerge = () => {
    setMergeTargetTableId("");
    setIsMergeModalOpen(true);
  };

  const executeMerge = async () => {
    if (!sessionActionTable || !mergeTargetTableId) return;
    try {
      const res = await axiosInstance.post("/tables/sessions/merge", {
        sourceTableId: sessionActionTable.id,
        targetTableId: mergeTargetTableId,
      });
      if (res.data.success) {
        message.success("Gộp bàn thành công");
        setIsMergeModalOpen(false);
        setIsSessionModalOpen(false);
        loadFloorLayout(selectedFloorId);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể gộp bàn");
    }
  };

  const updateSelectedTableProperty = (property: string, value: any) => {
    if (!selectedTableId) return;
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTableId ? { ...t, [property]: value } : t))
    );
    setIsModified(true);
  };

  const activeSelectedTable = tables.find((t) => t.id === selectedTableId);

  // 7. Render Layout Coordinates logic
  const activeFloor = floors.find((f) => f.id === selectedFloorId);
  const canvasWidth = activeFloor?.width || 600;
  const canvasHeight = activeFloor?.height || 400;

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E14]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin border-[#FF5A2C] border-t-transparent" />
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

        <main className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6 lg:p-8" style={{ background: "var(--bg-base)" }}>
          <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full flex-1">
            
            {/* Header section with view toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border)" }}>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Sơ đồ bàn ăn</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Quản lý khu vực bàn ăn, sơ đồ mặt bằng và trạng thái bàn realtime.
                </p>
              </div>

              {/* View mode toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={() => setViewMode("view")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    viewMode === "view"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Vận hành
                </button>
                <button
                  onClick={() => setViewMode("edit")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    viewMode === "edit"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sơ đồ
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    viewMode === "list"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Danh sách bàn
                </button>
              </div>
            </div>

            {/* Main Area: Split by Mode */}
            {viewMode !== "list" ? (
              <div className="flex flex-col gap-6">
                
                {/* Floor select tabs */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {floors.map((f) => (
                      <div
                        key={f.id}
                        className={`group relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                          selectedFloorId === f.id
                            ? "bg-[#FF5A2C] border-[#FF5A2C] text-white shadow-sm"
                            : "bg-white dark:bg-[#1E293B] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                        }`}
                        onClick={() => setSelectedFloorId(f.id)}
                      >
                        <span>{f.name}</span>
                        {/* Edit / Delete hover actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFloorModal(f);
                            }}
                            className="p-0.5 rounded hover:bg-black/10 text-xs"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFloor(f.id);
                            }}
                            className="p-0.5 rounded hover:bg-black/10 text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleOpenFloorModal()}
                      className="px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-[#FF5A2C] dark:hover:border-[#FF5A2C] text-gray-500 hover:text-[#FF5A2C] text-sm font-semibold transition-colors flex items-center gap-1.5"
                    >
                      ➕ Thêm tầng
                    </button>
                  </div>

                  {/* Actions for active floor */}
                  {viewMode === "edit" && selectedFloorId && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="primary"
                        onClick={() => handleOpenTableModal()}
                        style={{ background: "#22c55e", borderColor: "#22c55e" }}
                      >
                        ➕ Thêm bàn ăn
                      </Button>
                      <Button
                        type="primary"
                        onClick={saveLayout}
                        disabled={!isModified}
                        style={{ background: isModified ? "#FF5A2C" : "gray", borderColor: isModified ? "#FF5A2C" : "gray" }}
                      >
                        💾 Lưu vị trí bàn
                      </Button>
                    </div>
                  )}
                </div>

                {/* The Map Editor/Operating Canvas */}
                {floors.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border flex flex-col items-center justify-center p-6" style={{ borderColor: "var(--border)" }}>
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chưa cấu hình khu vực tầng</h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1">
                      Vui lòng nhấp vào nút "Thêm tầng" phía trên để khởi tạo sơ đồ tầng đầu tiên của nhà hàng.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    
                    {/* The Visual map container */}
                    <div className="flex-1 w-full overflow-auto bg-gray-50 dark:bg-[#0E131F] rounded-2xl border p-4 flex justify-center items-center" style={{ borderColor: "var(--border)", minHeight: "500px" }}>
                      <div
                        ref={canvasRef}
                        className="relative bg-white dark:bg-[#181F2E] rounded-xl shadow-md border overflow-hidden transition-all duration-300"
                        style={{
                          width: `${canvasWidth}px`,
                          height: `${canvasHeight}px`,
                          borderColor: "var(--border)",
                          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }}
                      >
                        {/* Floor Name Label indicator */}
                        <div className="absolute top-3 left-3 bg-black/5 dark:bg-white/5 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-gray-500 pointer-events-none">
                          {activeFloor?.name} ({canvasWidth}px x {canvasHeight}px)
                        </div>

                        {/* Rendering positioned tables */}
                        {tables.length === 0 ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-gray-400 dark:text-gray-500 pointer-events-none">
                            <span className="text-sm">Không có bàn ăn trên tầng này</span>
                            {viewMode === "edit" && <span className="text-xs mt-1">Chọn "Thêm bàn ăn" để bắt đầu đặt bàn</span>}
                          </div>
                        ) : (
                          tables.map((t) => {
                            const isSelected = selectedTableId === t.id && viewMode === "edit";
                            const isOccupied = t.status === "OCCUPIED";
                            const isReserved = t.status === "RESERVED";
                            const isVip = t.type === "VIP";

                            // Color map
                            let statusBg = "rgba(34, 197, 94, 0.1)"; // Available green soft
                            let statusBorder = "#22c55e";
                            let glowShadow = "rgba(34, 197, 94, 0.2) 0px 0px 15px";

                            if (isOccupied) {
                              statusBg = "rgba(239, 68, 68, 0.1)"; // Occupied red soft
                              statusBorder = "#ef4444";
                              glowShadow = "rgba(239, 68, 68, 0.3) 0px 0px 15px";
                            } else if (isReserved) {
                              statusBg = "rgba(245, 158, 11, 0.1)"; // Reserved orange soft
                              statusBorder = "#f59e0b";
                              glowShadow = "rgba(245, 158, 11, 0.3) 0px 0px 15px";
                            }

                            if (isSelected) {
                              statusBorder = "#FF5A2C";
                              glowShadow = "rgba(255, 90, 44, 0.6) 0px 0px 20px";
                            }

                            const shapeStyle =
                              t.shape === "Round" ? { borderRadius: "9999px" } : { borderRadius: "8px" };

                            return (
                              <div
                                key={t.id}
                                onMouseDown={(e) => handleTableMouseDown(e, t.id)}
                                onClick={() => handleTableClick(t)}
                                className={`absolute select-none flex flex-col items-center justify-center p-1 cursor-pointer transition-shadow border-2 ${
                                  isSelected ? "z-20 scale-105" : "z-10"
                                }`}
                                style={{
                                  left: `${t.positionX}px`,
                                  top: `${t.positionY}px`,
                                  width: `${t.width}px`,
                                  height: `${t.height}px`,
                                  transform: `rotate(${t.rotation}deg)`,
                                  background: statusBg,
                                  borderColor: statusBorder,
                                  boxShadow: glowShadow,
                                  ...shapeStyle,
                                }}
                              >
                                {isVip && (
                                  <div className="absolute -top-3 text-[10px] bg-yellow-500 text-white font-black px-1 py-0.5 rounded leading-none">
                                    VIP
                                  </div>
                                )}
                                <span className="text-xs font-black text-gray-900 dark:text-white">
                                  {t.code}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {t.seatingCapacity} chỗ
                                </span>

                                {/* pulsing dot inside table */}
                                <span className="relative flex h-2 w-2 mt-1">
                                  {isOccupied && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  )}
                                  <span
                                    className={`relative inline-flex rounded-full h-2 w-2 ${
                                      isOccupied
                                        ? "bg-red-500"
                                        : isReserved
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                  ></span>
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Properties panel on the right (only for Edit Mode) */}
                    {viewMode === "edit" && activeSelectedTable && (
                      <div className="w-full lg:w-80 bg-white dark:bg-[#1E293B] rounded-2xl border p-5 flex flex-col gap-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Cài đặt Bàn {activeSelectedTable.code}</h3>
                          <button onClick={() => setSelectedTableId(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Mã bàn ăn</label>
                          <Input
                            value={activeSelectedTable.code}
                            onChange={(e) => updateSelectedTableProperty("code", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Số chỗ ngồi</label>
                            <InputNumber
                              min={1}
                              max={30}
                              value={activeSelectedTable.seatingCapacity}
                              onChange={(val) => updateSelectedTableProperty("seatingCapacity", val)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Phân loại</label>
                            <Select
                              value={activeSelectedTable.type}
                              onChange={(val) => updateSelectedTableProperty("type", val)}
                              options={[
                                { value: "Normal", label: "Thường" },
                                { value: "VIP", label: "VIP" },
                              ]}
                              className="w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Hình dáng</label>
                          <Select
                            value={activeSelectedTable.shape}
                            onChange={(val) => updateSelectedTableProperty("shape", val)}
                            options={[
                              { value: "Square", label: "Hình vuông" },
                              { value: "Round", label: "Hình tròn" },
                              { value: "Rectangle", label: "Hình chữ nhật" },
                            ]}
                            className="w-full"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Chiều rộng (px)</label>
                            <InputNumber
                              min={40}
                              max={200}
                              value={activeSelectedTable.width}
                              onChange={(val) => updateSelectedTableProperty("width", val)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Chiều cao (px)</label>
                            <InputNumber
                              min={40}
                              max={200}
                              value={activeSelectedTable.height}
                              onChange={(val) => updateSelectedTableProperty("height", val)}
                              className="w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Xoay bàn (độ)</label>
                          <InputNumber
                            min={0}
                            max={360}
                            value={activeSelectedTable.rotation}
                            onChange={(val) => updateSelectedTableProperty("rotation", val)}
                            className="w-full"
                          />
                        </div>

                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                          <Button
                            danger
                            onClick={() => handleDeleteTable(activeSelectedTable.id)}
                            className="flex-1"
                          >
                            🗑️ Xóa bàn ăn
                          </Button>
                          <Button
                            onClick={() => {
                              // Open detail table edit modal
                              handleOpenTableModal(activeSelectedTable);
                            }}
                            className="flex-1"
                          >
                            ⚙️ Nâng cao
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* GRID LIST VIEW (CRUD interface) */
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border p-6 shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white text-md">Danh sách bàn ăn ({allTablesList.length})</h3>
                  <Button type="primary" onClick={() => handleOpenTableModal()} style={{ background: "#FF5A2C", borderColor: "#FF5A2C" }}>
                    ➕ Thêm bàn ăn mới
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Số bàn/Mã bàn</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Khu vực tầng</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Số chỗ ngồi</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Loại bàn</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Hình dáng</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">QR Code</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTablesList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">Không có bàn ăn nào được ghi nhận.</td>
                        </tr>
                      ) : (
                        allTablesList.map((t) => (
                          <tr key={t.id} className="border-b hover:bg-gray-50/50 dark:hover:bg-gray-800/30" style={{ borderColor: "var(--border)" }}>
                            <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">{t.code}</td>
                            <td className="py-3.5 px-4 text-sm text-gray-600 dark:text-gray-300">{t.floorName || "Chưa gắn"}</td>
                            <td className="py-3.5 px-4 text-sm text-gray-600 dark:text-gray-300">{t.seatingCapacity} người</td>
                            <td className="py-3.5 px-4 text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.type === "VIP" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-sm text-gray-600 dark:text-gray-300">{t.shape}</td>
                            <td className="py-3.5 px-4 text-sm">
                              <span className="flex items-center gap-1.5 font-bold" style={{ color: t.statusColor }}>
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.statusColor }} />
                                {t.statusName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-sm">
                              <Tooltip title="Tải xuống QR Code cho bàn này">
                                <a
                                  href={`${BACKEND_URL}/api/upload/qr?text=${encodeURIComponent(t.qrCodeUrl)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline text-xs flex items-center gap-1 font-bold"
                                >
                                  📥 QR Code
                                </a>
                              </Tooltip>
                            </td>
                            <td className="py-3.5 px-4 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenTableModal(t)}
                                  className="text-blue-500 hover:text-blue-700 text-xs font-bold"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteTable(t.id)}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 8. Modals Section */}

      {/* Floor Modal (Add/Edit) */}
      <Modal
        title={floorForm.id ? "Chỉnh sửa thông tin Tầng" : "Thêm Tầng mới"}
        open={isFloorModalOpen}
        onOk={handleSaveFloor}
        onCancel={() => setIsFloorModalOpen(false)}
        okText="Lưu lại"
        cancelText="Hủy bỏ"
      >
        <div className="space-y-4 pt-3">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Tên khu vực/Tầng *</label>
            <Input
              value={floorForm.name}
              onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
              placeholder="Ví dụ: Tầng 1, Sân thượng, VIP Lounge..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Chiều ngang sơ đồ (px)</label>
              <InputNumber
                min={400}
                max={2000}
                value={floorForm.width}
                onChange={(val) => setFloorForm({ ...floorForm, width: val ?? 600 })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Chiều dọc sơ đồ (px)</label>
              <InputNumber
                min={300}
                max={2000}
                value={floorForm.height}
                onChange={(val) => setFloorForm({ ...floorForm, height: val ?? 400 })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Table Modal (Add/Edit) */}
      <Modal
        title={tableForm.id ? "Chỉnh sửa bàn ăn" : "Thêm bàn ăn mới"}
        open={isTableModalOpen}
        onOk={handleSaveTable}
        onCancel={() => setIsTableModalOpen(false)}
        okText="Lưu lại"
        cancelText="Hủy bỏ"
      >
        <div className="space-y-4 pt-3">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Số bàn / Mã bàn *</label>
            <Input
              value={tableForm.code}
              onChange={(e) => setTableForm({ ...tableForm, code: e.target.value })}
              placeholder="Ví dụ: Bàn 01, Bàn 12, VIP-01..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Số chỗ ngồi *</label>
              <InputNumber
                min={1}
                max={30}
                value={tableForm.seatingCapacity}
                onChange={(val) => setTableForm({ ...tableForm, seatingCapacity: val ?? 4 })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Khu vực / Tầng *</label>
              <Select
                value={tableForm.floorId}
                onChange={(val) => setTableForm({ ...tableForm, floorId: val })}
                options={floors.map((f) => ({ value: f.id, label: f.name }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Phân loại</label>
              <Select
                value={tableForm.type}
                onChange={(val) => setTableForm({ ...tableForm, type: val })}
                options={[
                  { value: "Normal", label: "Thường" },
                  { value: "VIP", label: "VIP" },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Hình dáng</label>
              <Select
                value={tableForm.shape}
                onChange={(val) => setTableForm({ ...tableForm, shape: val })}
                options={[
                  { value: "Square", label: "Hình vuông" },
                  { value: "Round", label: "Hình tròn" },
                  { value: "Rectangle", label: "Hình chữ nhật" },
                ]}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Table Session Action Modal */}
      <Modal
        title={`Điều khiển Bàn ${sessionActionTable?.code}`}
        open={isSessionModalOpen}
        onCancel={() => setIsSessionModalOpen(false)}
        footer={null}
        width={420}
      >
        {sessionActionTable && (
          <div className="space-y-6 pt-3">
            
            {/* Status overview */}
            <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Trạng thái hiện tại</p>
                <h4 className="font-bold text-lg mt-0.5" style={{ color: sessionActionTable.statusColor }}>
                  {sessionActionTable.statusName}
                </h4>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${sessionActionTable.type === "VIP" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>
                {sessionActionTable.type === "VIP" ? "Bàn VIP" : "Bàn thường"}
              </span>
            </div>

            {/* Session details */}
            {sessionActionTable.status === "OCCUPIED" && sessionActionTable.activeSession && (
              <div className="space-y-2.5">
                <h5 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Thông tin phiên ăn</h5>
                <div className="bg-gray-50 dark:bg-gray-800/20 p-3.5 rounded-xl border space-y-1.5" style={{ borderColor: "var(--border)" }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giờ bắt đầu:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {new Date(sessionActionTable.activeSession.startedAt).toLocaleTimeString("vi-VN")}
                    </span>
                  </div>
                  {sessionActionTable.activeSession.order && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Mã đơn hàng:</span>
                      <span className="font-bold text-primary">
                        #{sessionActionTable.activeSession.order.reference}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Buttons grid based on status */}
            <div className="flex flex-col gap-2.5 pt-2">
              {sessionActionTable.status === "AVAILABLE" ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={startSession}
                  className="w-full flex items-center justify-center gap-2"
                  style={{ background: "#22c55e", borderColor: "#22c55e", height: "48px", fontWeight: "bold" }}
                >
                  🟢 Mở khóa / Sử dụng bàn ăn
                </Button>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      size="large"
                      onClick={handleOpenTransfer}
                      className="flex items-center justify-center gap-1.5"
                      style={{ height: "44px", fontWeight: "bold" }}
                    >
                      🔄 Chuyển bàn
                    </Button>
                    <Button
                      size="large"
                      onClick={handleOpenMerge}
                      className="flex items-center justify-center gap-1.5"
                      style={{ height: "44px", fontWeight: "bold" }}
                    >
                      🔗 Gộp bàn
                    </Button>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    danger
                    onClick={closeSession}
                    className="w-full flex items-center justify-center gap-2 mt-1"
                    style={{ height: "48px", fontWeight: "bold" }}
                  >
                    🔴 Thanh toán & Trả bàn
                  </Button>
                </>
              )}

              {/* Advanced info: QR Code detail */}
              <div className="text-center pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <a
                  href={`${BACKEND_URL}/api/upload/qr?text=${encodeURIComponent(sessionActionTable.qrCodeUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline font-bold"
                >
                  📥 Nhấp để tải xuống QR Code của bàn ăn này
                </a>
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Transfer Table Modal */}
      <Modal
        title="Chuyển phiên sang bàn khác"
        open={isTransferModalOpen}
        onOk={executeTransfer}
        onCancel={() => setIsTransferModalOpen(false)}
        okText="Xác nhận chuyển"
        cancelText="Hủy bỏ"
      >
        <div className="space-y-4 pt-3">
          <p className="text-sm text-gray-500">
            Chọn một bàn ăn đang trống để chuyển toàn bộ phiên sử dụng và đơn hàng (nếu có) từ bàn{" "}
            <strong>{sessionActionTable?.code}</strong> sang.
          </p>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Chọn bàn trống đích *</label>
            <Select
              placeholder="Chọn bàn trống"
              value={transferTargetTableId}
              onChange={(val) => setTransferTargetTableId(val)}
              className="w-full"
              options={tables
                .filter((t) => t.status === "AVAILABLE" && t.id !== sessionActionTable?.id)
                .map((t) => ({ value: t.id, label: `${t.code} (${t.seatingCapacity} chỗ) - ${t.type}` }))}
            />
          </div>
        </div>
      </Modal>

      {/* Merge Table Modal */}
      <Modal
        title="Gộp bàn ăn"
        open={isMergeModalOpen}
        onOk={executeMerge}
        onCancel={() => setIsMergeModalOpen(false)}
        okText="Xác nhận gộp"
        cancelText="Hủy bỏ"
      >
        <div className="space-y-4 pt-3">
          <p className="text-sm text-gray-500">
            Chọn một bàn ăn đang được sử dụng để gộp phiên của bàn{" "}
            <strong>{sessionActionTable?.code}</strong> vào đó. Cả hai bàn sẽ cùng liên kết tới một đơn hàng chung.
          </p>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Chọn bàn gộp đích *</label>
            <Select
              placeholder="Chọn bàn đang hoạt động"
              value={mergeTargetTableId}
              onChange={(val) => setMergeTargetTableId(val)}
              className="w-full"
              options={tables
                .filter((t) => t.status === "OCCUPIED" && t.id !== sessionActionTable?.id)
                .map((t) => ({ value: t.id, label: `${t.code} (Bàn đang bận)` }))}
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
