"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { message, Spin, Button, Tooltip, Modal } from "antd";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";
import { TableMap2D, Layout, Floor } from "./components/TableMap2D";
import { TableData as Map2DTableData } from "./components/DraggableTable";
import { AddTableModal } from "./components/AddTableModal";
import { AddAreaModal } from "./components/AddAreaModal";
import { TableDetailsDrawer } from "./components/TableDetailsDrawer";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import TablePreview3DModal from "./components/TablePreview3DModal";
import { tableService, floorService, TableStatus } from "@/lib/services/tableService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { useTranslation } from "react-i18next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const getQrDownloadUrl = (qrText: string) => {
  const base = BACKEND_URL.endsWith("/api") ? BACKEND_URL.slice(0, -4) : BACKEND_URL;
  return `${base}/api/upload/qr?text=${encodeURIComponent(qrText)}`;
};

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: "available" | "occupied";
  area: string;
  floorId?: string;
  currentOrder?: string;
  reservationTime?: string;
  shape: "Square" | "Circle" | "Rectangle" | "Oval";
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  isActive: boolean;
  has3DView?: boolean;
  viewDescription?: string;
  defaultViewUrl?: string;
  qrCodeUrl?: string;
  cubeFrontImageUrl?: string;
  cubeBackImageUrl?: string;
  cubeLeftImageUrl?: string;
  cubeRightImageUrl?: string;
  cubeTopImageUrl?: string;
  cubeBottomImageUrl?: string;
}

export default function TablesManagementPage() {
  const { t } = useTranslation();
  const { user, isAuthReady } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [beFloors, setBeFloors] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [tables, setTables] = useState<Table[]>([]);
  
  // View Mode: 'view' (Operating / Realtime map), 'edit' (Layout position editor), 'list' (List grid CRUD)
  const [viewMode, setViewMode] = useState<"view" | "edit" | "list">("view");

  // Selection & modal states
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  // Floor Modals
  const [addAreaModalOpen, setAddAreaModalOpen] = useState(false);
  const [editAreaModalOpen, setEditAreaModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  // Table Delete Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Session Operational Modals
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [sessionActionTable, setSessionActionTable] = useState<Table | null>(null);
  const [transferTargetTableId, setTransferTargetTableId] = useState<string>("");
  const [mergeTargetTableId, setMergeTargetTableId] = useState<string>("");

  // List search & filters
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "occupied">("all");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [keyword, setKeyword] = useState("");

  const [isUploadingPanorama, setIsUploadingPanorama] = useState(false);

  // 360° Preview modal state
  const [preview3DOpen, setPreview3DOpen] = useState(false);
  const [preview3DTable, setPreview3DTable] = useState<{ id: string; name: string; seats: number; shape: string; status: string; imageUrl?: string; cubeUrls?: string[] } | null>(null);

  // 1. Load Data
  const fetchTables = async () => {
    try {
      const [tablesData, floorsData] = await Promise.all([
        tableService.getAllTables(),
        floorService.getAllFloors(),
      ]);

      setBeFloors(floorsData);

      const cacheBust = Date.now();
      const withCacheBust = (url?: string) => {
        if (!url) return undefined;
        return `${url}${url.includes('?') ? '&' : '?'}v=${cacheBust}`;
      };

      const mappedTables: Table[] = tablesData.map(item => {
        let status: Table['status'] = 'available';
        if (item.tableStatusId === TableStatus.Occupied) status = 'occupied';

        return {
          id: item.id,
          number: item.code || '',
          capacity: item.seatingCapacity || 4,
          status: status,
          area: item.floorName || item.type || 'Indoor',
          floorId: item.floorId,
          shape: (item.shape as any) || 'Square',
          positionX: Number(item.positionX) || 50,
          positionY: Number(item.positionY) || 50,
          width: Number(item.width) || 80,
          height: Number(item.height) || 80,
          rotation: Number(item.rotation) || 0,
          isActive: item.isActive !== false,
          has3DView: item.has3DView,
          viewDescription: item.viewDescription,
          defaultViewUrl: item.defaultViewUrl,
          qrCodeUrl: item.qrCodeUrl,
          cubeFrontImageUrl: withCacheBust(item.cubeFrontImageUrl),
          cubeBackImageUrl: withCacheBust(item.cubeBackImageUrl),
          cubeLeftImageUrl: withCacheBust(item.cubeLeftImageUrl),
          cubeRightImageUrl: withCacheBust(item.cubeRightImageUrl),
          cubeTopImageUrl: withCacheBust(item.cubeTopImageUrl),
          cubeBottomImageUrl: withCacheBust(item.cubeBottomImageUrl),
        };
      });

      setTables(mappedTables);
      
      if (floorsData.length > 0 && !selectedFloorId) {
        setSelectedFloorId(floorsData[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    }
  };

  // Initial authentication & fetch
  useEffect(() => {
    if (!isAuthReady || tenantLoading) return;
    if (!user) {
      router.replace("/login?redirect=/restaurant/tables");
      return;
    }
    setLoading(false);
    fetchTables();
  }, [isAuthReady, user, router, tenantLoading]);

  // Realtime Socket updates
  useEffect(() => {
    if (!user?.restaurantId) return;

    const socketUrl = BACKEND_URL.replace(/\/api\/?$/, "");
    const newSocket = io(socketUrl, {
      transports: ["polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("[Tables] Socket connected:", newSocket.id);
      newSocket.emit("join_restaurant", user.restaurantId);
    });

    const handleRealtimeRefresh = () => {
      fetchTables();
    };

    newSocket.on("TABLE_CREATED", handleRealtimeRefresh);
    newSocket.on("TABLE_UPDATED", handleRealtimeRefresh);
    newSocket.on("TABLE_DELETED", handleRealtimeRefresh);
    newSocket.on("TABLE_SESSION_STARTED", handleRealtimeRefresh);
    newSocket.on("TABLE_SESSIONS_MERGED", handleRealtimeRefresh);
    newSocket.on("TABLE_SESSION_TRANSFERRED", handleRealtimeRefresh);
    newSocket.on("TABLE_SESSION_CLOSED", handleRealtimeRefresh);
    newSocket.on("FLOOR_LAYOUT_CHANGED", handleRealtimeRefresh);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.restaurantId]);

  // Layout synchronization
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    if (beFloors.length === 0 && tables.length === 0) return;

    const floorsMapped: Floor[] = beFloors.map(bf => {
      const floorTables = tables
        .filter(table => table.floorId === bf.id && table.isActive)
        .map(table => ({
          id: table.id,
          tenantId: 'tenant-1',
          name: table.number,
          seats: table.capacity,
          status: table.status === 'available' ? 'AVAILABLE' : 'OCCUPIED',
          area: table.area,
          position: { x: table.positionX, y: table.positionY },
          shape: table.shape as any,
          width: table.width || 80,
          height: table.height || 80,
          rotation: table.rotation,
        } as Map2DTableData));

      return {
        id: bf.id,
        name: bf.name,
        width: Number(bf.width) || 1200,
        height: Number(bf.height) || 800,
        backgroundImage: bf.imageUrl || undefined,
        tables: floorTables,
      };
    });

    if (floorsMapped.length === 0) return;

    setLayout({
      id: 'be-layout',
      name: tenant?.name || 'Restaurant',
      activeFloorId: selectedFloorId && floorsMapped.some(f => f.id === selectedFloorId) ? selectedFloorId : floorsMapped[0].id,
      floors: floorsMapped,
    });
  }, [tables, beFloors, selectedFloorId, tenant]);

  const handleLayoutChange = (newLayout: Layout) => {
    setLayout(newLayout);
  };

  // Immediate drag update on database
  const handleMap2DTablePositionChange = async (tableId: string, position: { x: number; y: number; zoneId?: string }) => {
    try {
      const tableToUpdate = tables.find(t => t.id === tableId);
      if (!tableToUpdate) return;

      const effectiveFloorId = tableToUpdate.floorId || selectedFloorId;

      const apiData: any = {
        id: tableToUpdate.id,
        code: tableToUpdate.number,
        seatingCapacity: tableToUpdate.capacity,
        type: tableToUpdate.area,
        floorId: effectiveFloorId,
        shape: tableToUpdate.shape,
        positionX: position.x,
        positionY: position.y,
        width: tableToUpdate.width,
        height: tableToUpdate.height,
        rotation: tableToUpdate.rotation,
        isActive: tableToUpdate.isActive,
        tableStatusId: tableToUpdate.status === 'occupied' ? TableStatus.Occupied : TableStatus.Available
      };

      await tableService.updateTable(tableId, apiData);
      
      // Update local state optimistically
      setTables(prev => prev.map(t =>
        t.id === tableId ? { ...t, positionX: position.x, positionY: position.y, floorId: effectiveFloorId } : t
      ));
    } catch (err) {
      console.error("Failed to move table:", err);
      message.error(extractApiErrorMessage(err, "Không thể di chuyển bàn"));
      fetchTables();
    }
  };

  // Immediate resize update on database
  const handleMap2DTableResize = async (tableId: string, size: { width: number; height: number }) => {
    try {
      const tableToUpdate = tables.find(t => t.id === tableId);
      if (!tableToUpdate) return;

      const apiData: any = {
        id: tableToUpdate.id,
        code: tableToUpdate.number,
        seatingCapacity: tableToUpdate.capacity,
        type: tableToUpdate.area,
        floorId: tableToUpdate.floorId || selectedFloorId,
        shape: tableToUpdate.shape,
        positionX: tableToUpdate.positionX,
        positionY: tableToUpdate.positionY,
        width: size.width,
        height: size.height,
        rotation: tableToUpdate.rotation,
        isActive: tableToUpdate.isActive,
        tableStatusId: tableToUpdate.status === 'occupied' ? TableStatus.Occupied : TableStatus.Available
      };

      await tableService.updateTable(tableId, apiData);
      
      // Update local state optimistically
      setTables(prev => prev.map(t =>
        t.id === tableId ? { ...t, width: size.width, height: size.height } : t
      ));
    } catch (err) {
      console.error("Failed to resize table:", err);
      message.error(extractApiErrorMessage(err, "Không thể thay đổi kích thước bàn"));
      fetchTables();
    }
  };

  // Table click Router/Session/Details trigger
  const handleTableClick = (table: Table) => {
    const isDeco = table.number.startsWith("DECO_");
    if (isDeco) {
      if (viewMode === "edit") {
        setSelectedTable(table);
        setDrawerOpen(true);
      }
      return;
    }

    if (viewMode === "edit") {
      setSelectedTable(table);
      setDrawerOpen(true);
    } else {
      setSessionActionTable(table);
      setIsSessionModalOpen(true);
    }
  };

  const handleMap2DTableClick = (mapTable: Map2DTableData) => {
    const table = tables.find(t => t.id === mapTable.id);
    if (table) {
      handleTableClick(table);
    }
  };

  // Table CRUD Handlers
  const handleAddTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const selectedFloorId = (formData.get('area') as string)?.trim();
      if (!selectedFloorId || !beFloors.some((f) => f.id === selectedFloorId)) {
        message.error("Vui lòng chọn khu vực hợp lệ trước khi tạo bàn.");
        return;
      }
      const selectedFloor = beFloors.find(f => f.id === selectedFloorId);
      const floorName = selectedFloor?.name || 'Indoor';
      const code = formData.get('number') as string;
      const seatingCapacity = parseInt(formData.get('capacity') as string, 10);

      const isDeco = code.startsWith("DECO_");

      const newTableData = {
        code,
        seatingCapacity: isDeco ? 0 : seatingCapacity,
        type: floorName,
        floorId: selectedFloorId,
        tableStatusId: TableStatus.Available,
        isActive: true,
        shape: isDeco ? 'Rectangle' : 'Square',
        positionX: 50,
        positionY: 50,
        width: isDeco ? 60 : 80,
        height: isDeco ? 60 : 80,
        rotation: 0
      };

      await tableService.createTable(newTableData);
      message.success("Tạo bàn ăn thành công");
      setAddModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error("Failed to add table:", err);
      message.error(extractApiErrorMessage(err, "Không thể tạo bàn ăn"));
    }
  };

  const handleUpdateTable = async (values: Partial<Table>) => {
    if (!selectedTable) return;
    try {
      const selectedFloor = beFloors.find(f => f.id === values.area);
      
      const apiData: any = {
        id: selectedTable.id,
        code: values.number,
        seatingCapacity: values.capacity,
        type: selectedFloor ? selectedFloor.name : selectedTable.area,
        floorId: values.area,
        shape: values.shape,
        width: values.width,
        height: values.height,
        rotation: values.rotation,
        isActive: selectedTable.isActive,
        tableStatusId: selectedTable.status === 'occupied' ? TableStatus.Occupied : TableStatus.Available
      };

      await tableService.updateTable(selectedTable.id, apiData);
      message.success("Cập nhật bàn thành công");
      fetchTables();
    } catch (err) {
      console.error("Failed to update table:", err);
      message.error(extractApiErrorMessage(err, "Không thể cập nhật thông tin"));
    }
  };

  const handleDeleteTable = () => {
    if (selectedTable) {
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteTable = async () => {
    if (selectedTable) {
      try {
        await tableService.deleteTable(selectedTable.id);
        setTables(prev => prev.filter(t => t.id !== selectedTable.id));
        setDrawerOpen(false);
        setSelectedTable(null);
        message.success("Xóa bàn thành công");
      } catch (err) {
        console.error("Delete failed", err);
        message.error(extractApiErrorMessage(err, "Không thể xóa bàn ăn này"));
      } finally {
        setDeleteConfirmOpen(false);
      }
    }
  };

  // Upload Background Image for Floor
  const handleFloorImageUpload = async (floorId: string, file: File) => {
    try {
      const floor = beFloors.find(f => f.id === floorId);
      await floorService.updateFloor(floorId, {
        name: floor?.name ?? 'Floor',
        width: floor?.width ?? 1200,
        height: floor?.height ?? 800,
        image: file,
      });
      message.success("Tải lên ảnh nền thành công");
      fetchTables();
    } catch (err) {
      console.error('Failed to upload background image:', err);
      message.error(extractApiErrorMessage(err, "Tải lên ảnh nền thất bại"));
    }
  };

  // Upload Panorama Image
  const handleSavePanorama = async (tableId: string, files: Record<string, File | null>, clear: boolean) => {
    const tableToUpdate = tables.find(t => t.id === tableId);
    if (!tableToUpdate) return;

    try {
      const fd = new FormData();
      fd.append('ClearCubemap', String(clear));

      if (!clear) {
        Object.entries(files).forEach(([face, file]) => {
          if (file) {
            fd.append(`Cube${face}Image`, file);
          }
        });
      }

      setIsUploadingPanorama(true);
      await axiosInstance.put(`/tables/${tableId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsUploadingPanorama(false);
      message.success("Lưu ảnh panorama thành công");
      fetchTables();
    } catch (err) {
      setIsUploadingPanorama(false);
      console.error('Failed to save panorama:', err);
      message.error(extractApiErrorMessage(err, "Lưu ảnh panorama thất bại"));
    }
  };


  // Floor CRUD handlers
  const handleAddArea = async (values: { name: string; width: number; height: number }) => {
    try {
      const newId = await floorService.createFloor({ name: values.name, width: values.width, height: values.height });
      message.success("Thêm tầng mới thành công");
      setSelectedFloorId(newId);
      setAddAreaModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error("Failed to add floor:", err);
      message.error(extractApiErrorMessage(err, "Không thể thêm tầng mới"));
    }
  };

  const handleEditArea = async (values: { name: string; width: number; height: number }) => {
    if (!selectedFloorId) return;
    try {
      await floorService.updateFloor(selectedFloorId, {
        name: values.name,
        width: values.width,
        height: values.height,
      });
      message.success("Cập nhật tầng thành công");
      setEditAreaModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error("Failed to update floor:", err);
      message.error(extractApiErrorMessage(err, "Không thể cập nhật tầng"));
    }
  };

  const confirmDeleteFloor = async () => {
    if (zoneToDelete) {
      try {
        await floorService.deleteFloor(zoneToDelete);
        message.success("Xóa tầng thành công");
        setSelectedFloorId("");
        setZoneToDelete(null);
        fetchTables();
      } catch (err) {
        console.error("Failed to delete floor:", err);
        message.error(extractApiErrorMessage(err, "Không thể xóa tầng này"));
      }
    }
  };

  // Table Session Operations (Vận hành)
  const startSession = async () => {
    if (!sessionActionTable) return;
    try {
      await tableService.createTableSession(sessionActionTable.id);
      message.success(`Đã mở khóa bàn ${sessionActionTable.number}`);
      setIsSessionModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error("Failed to start session:", err);
      message.error(extractApiErrorMessage(err, "Không thể mở khóa bàn ăn"));
    }
  };

  const closeSession = async () => {
    if (!sessionActionTable) return;
    try {
      await tableService.closeTableSession([sessionActionTable.id]);
      message.success(`Đã đóng bàn ăn và thanh toán thành công`);
      setIsSessionModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error("Failed to close session:", err);
      message.error(extractApiErrorMessage(err, "Không thể đóng bàn ăn"));
    }
  };

  const executeTransfer = async () => {
    if (!sessionActionTable || !transferTargetTableId) return;
    try {
      await tableService.moveTable({
        sourceTableId: sessionActionTable.id,
        targetTableId: transferTargetTableId,
      });
      message.success("Chuyển bàn thành công");
      setIsTransferModalOpen(false);
      setIsSessionModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error("Failed to transfer table:", err);
      message.error(extractApiErrorMessage(err, "Không thể chuyển bàn ăn"));
    }
  };

  const executeMerge = async () => {
    if (!sessionActionTable || !mergeTargetTableId) return;
    try {
      const response = await tableService.mergeTables({
        tableIds: [sessionActionTable.id, mergeTargetTableId],
      });
      
      if (response.requiresManualResolution) {
        message.warning("Cần xử lý thủ công do phát hiện nhiều đơn hàng đang hoạt động.");
      } else {
        message.success("Gộp bàn ăn thành công");
      }
      setIsMergeModalOpen(false);
      setIsSessionModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error("Failed to merge tables:", err);
      message.error(extractApiErrorMessage(err, "Không thể gộp bàn ăn"));
    }
  };

  const handleOpenTransfer = () => {
    setTransferTargetTableId("");
    setIsTransferModalOpen(true);
  };

  const handleOpenMerge = () => {
    setMergeTargetTableId("");
    setIsMergeModalOpen(true);
  };

  // Search & Filter list logic
  const filteredTables = tables.filter((table) => {
    const isDeco = table.number.startsWith("DECO_");
    // List view hides decorations to keep lists simple and table-centric
    if (viewMode === "list" && isDeco) return false;

    const matchStatus = statusFilter === "all" || table.status === statusFilter;
    const matchFloor = floorFilter === "all" || table.floorId === floorFilter;
    const matchKeyword = !keyword.trim() || table.number.toLowerCase().includes(keyword.trim().toLowerCase());
    return matchStatus && matchFloor && matchKeyword;
  });

  const activeFloor = beFloors.find((f) => f.id === selectedFloorId);

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#090D16]">
        <div className="w-10 h-10 rounded-full border-4 animate-spin border-[#FF5A2C] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAF9F6] dark:bg-[#090D16] text-[#1A1A1A] dark:text-[#E2E8F0] transition-colors duration-200">
      <Spin fullscreen spinning={isUploadingPanorama} tip="Đang lưu ảnh panorama..." size="large" />
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
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5 border-gray-200 dark:border-gray-800">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sơ đồ bàn ăn &amp; Thiết kế</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quản lý mặt bằng khu vực, đặt bàn ăn, vẽ tường, cây cảnh, quầy lễ tân, và theo dõi trạng thái bàn trực quan.
                </p>
              </div>

              {/* View mode toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-inner">
                <button
                  onClick={() => setViewMode("view")}
                  className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    viewMode === "view"
                      ? "bg-orange-500 text-white shadow-md"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Vận hành
                </button>
                <button
                  onClick={() => setViewMode("edit")}
                  className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    viewMode === "edit"
                      ? "bg-orange-500 text-white shadow-md"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sơ đồ
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    viewMode === "list"
                      ? "bg-orange-500 text-white shadow-md"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Danh sách bàn
                </button>
              </div>
            </div>

            {/* Main Area */}
            {viewMode !== "list" ? (
              <div className="flex flex-col gap-6">
                
                {/* Floor select tabs & edit actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {beFloors.map((f) => (
                      <div
                        key={f.id}
                        className={`group relative flex items-center gap-2 px-4.5 py-3 rounded-xl border text-sm font-bold cursor-pointer transition-all shadow-sm ${
                          selectedFloorId === f.id
                            ? "bg-[#FF5A2C] border-[#FF5A2C] text-white"
                            : "bg-white dark:bg-[#1E293B] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                        }`}
                        onClick={() => setSelectedFloorId(f.id)}
                      >
                        <span>{f.name}</span>
                        {/* Floor edit actions (visible in edit mode) */}
                        {viewMode === "edit" && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 ml-2.5 bg-black/10 px-1.5 py-0.5 rounded">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditAreaModalOpen(true);
                              }}
                              title="Sửa tầng"
                              className="text-xs hover:scale-110"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoneToDelete(f.id);
                              }}
                              title="Xóa tầng"
                              className="text-xs hover:scale-110"
                              disabled={beFloors.length <= 1}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {viewMode === "edit" && (
                      <button
                        onClick={() => setAddAreaModalOpen(true)}
                        className="px-4.5 py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-[#FF5A2C] dark:hover:border-[#FF5A2C] text-gray-500 hover:text-[#FF5A2C] text-sm font-bold transition-all flex items-center gap-1.5 bg-transparent"
                      >
                        ➕ Thêm khu vực
                      </button>
                    )}
                  </div>

                  {/* Add design buttons for edit mode */}
                  {viewMode === "edit" && selectedFloorId && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="primary"
                        onClick={() => setAddModalOpen(true)}
                        className="font-bold h-11 px-6 rounded-xl"
                        style={{ background: "#22c55e", borderColor: "#22c55e" }}
                      >
                        ➕ Thiết kế Bàn / Vật phẩm
                      </Button>
                    </div>
                  )}
                </div>

                {/* Visual Panning Canvas */}
                {beFloors.length === 0 ? (
                  <div className="text-center py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-6 shadow-sm">
                    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chưa cấu hình khu vực tầng</h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1">
                      Nhấp vào nút "Thêm khu vực" phía trên để khởi tạo sơ đồ tầng đầu tiên của nhà hàng.
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-[calc(100vh-270px)] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg relative bg-white dark:bg-[#111827]">
                    {layout && (
                      <TableMap2D
                        layout={layout}
                        onLayoutChange={handleLayoutChange}
                        onTableClick={handleMap2DTableClick}
                        onTablePositionChange={handleMap2DTablePositionChange}
                        onTableResize={handleMap2DTableResize}
                        onBackgroundImageUpload={handleFloorImageUpload}
                        readOnly={viewMode !== "edit"}
                        selectedTableIds={selectedTable?.id ? [selectedTable.id] : []}
                        renderTableContent={(table) => {
                          const hasOrder = table.status === "OCCUPIED";
                          return hasOrder && (
                            <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full animate-ping" />
                          );
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Premium Table List View */
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm overflow-hidden flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Danh sách bàn ăn ({filteredTables.length})</h3>
                  
                  {/* Filters bar */}
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="Tìm kiếm mã bàn..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:border-[#FF5A2C] transition-all text-gray-800 dark:text-gray-200"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:border-[#FF5A2C] text-gray-800 dark:text-gray-200"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="available">Trống (Available)</option>
                      <option value="occupied">Đang sử dụng (Occupied)</option>
                    </select>
                    <select
                      value={floorFilter}
                      onChange={(e) => setFloorFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:border-[#FF5A2C] text-gray-800 dark:text-gray-200"
                    >
                      <option value="all">Tất cả tầng</option>
                      {beFloors.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <Button
                      type="primary"
                      onClick={() => setAddModalOpen(true)}
                      className="font-bold rounded-xl"
                      style={{ background: "#FF5A2C", borderColor: "#FF5A2C", height: "38px" }}
                    >
                      ➕ Thêm bàn
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Mã bàn ăn</th>
                        <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Khu vực tầng</th>
                        <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Sức chứa</th>
                        <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Hình dáng</th>
                        <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Menu QR Code</th>
                        <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredTables.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-gray-400 dark:text-gray-500">Không tìm thấy bàn ăn phù hợp.</td>
                        </tr>
                      ) : (
                        filteredTables.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="py-4 px-5 font-bold text-gray-900 dark:text-white">{t.number}</td>
                            <td className="py-4 px-5 text-sm text-gray-600 dark:text-gray-300">{t.area}</td>
                            <td className="py-4 px-5 text-sm text-gray-600 dark:text-gray-300">{t.capacity} người</td>
                            <td className="py-4 px-5 text-sm text-gray-600 dark:text-gray-300">{t.shape}</td>
                            <td className="py-4 px-5 text-sm">
                              <span className={`flex items-center gap-1.5 font-bold ${t.status === "occupied" ? "text-red-500" : "text-emerald-500"}`}>
                                <span className={`h-2 w-2 rounded-full ${t.status === "occupied" ? "bg-red-500" : "bg-emerald-500"}`} />
                                {t.status === "occupied" ? "Đang sử dụng" : "Trống"}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-sm">
                              {t.qrCodeUrl ? (
                                <div className="flex items-center gap-3">
                                  <Tooltip title="Tải xuống QR Code để in">
                                    <a
                                      href={getQrDownloadUrl(t.qrCodeUrl)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline text-xs font-bold flex items-center gap-1"
                                    >
                                      📥 Tải QR
                                    </a>
                                  </Tooltip>
                                  <a
                                    href={t.qrCodeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-500 hover:underline text-xs font-bold flex items-center gap-1"
                                  >
                                    🔗 Link Menu
                                  </a>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-sm">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    setSelectedTable(t);
                                    setDrawerOpen(true);
                                  }}
                                  className="text-blue-500 hover:text-blue-700 text-xs font-bold"
                                >
                                  ⚙️ Cấu hình
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTable(t);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                                >
                                  🗑️ Xóa
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

      {/* ─── ADD/EDIT TABLE MODAL ─── */}
      <AddTableModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddTable}
        floors={beFloors.map(f => ({ id: f.id, name: f.name }))}
        defaultFloorId={selectedFloorId}
      />

      {/* ─── TABLE CONFIG DETAILS DRAWER ─── */}
      <TableDetailsDrawer
        open={drawerOpen}
        table={selectedTable}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTable(null);
        }}
        onSave={handleUpdateTable}
        onSavePanorama={handleSavePanorama}
        onDelete={handleDeleteTable}
        floors={beFloors.map(f => ({ id: f.id, name: f.name }))}
        onView360={selectedTable?.cubeFrontImageUrl || selectedTable?.defaultViewUrl ? () => {
          const t = selectedTable;
          if (!t) return;
          
          const getFullUrl = (rawUrl?: string) => {
            if (!rawUrl) return '';
            if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
              return rawUrl;
            }
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const cleanBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
            const cleanUrl = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
            return `${cleanBase}${cleanUrl}`;
          };

          const rawUrl = t.cubeFrontImageUrl || t.defaultViewUrl;
          const imageUrl = getFullUrl(rawUrl);

          const hasCubemap = !!(
            t.cubeFrontImageUrl &&
            t.cubeBackImageUrl &&
            t.cubeLeftImageUrl &&
            t.cubeRightImageUrl &&
            t.cubeTopImageUrl &&
            t.cubeBottomImageUrl
          );

          const cubeUrls = hasCubemap ? [
            getFullUrl(t.cubeRightImageUrl),
            getFullUrl(t.cubeLeftImageUrl),
            getFullUrl(t.cubeTopImageUrl),
            getFullUrl(t.cubeBottomImageUrl),
            getFullUrl(t.cubeFrontImageUrl),
            getFullUrl(t.cubeBackImageUrl),
          ] : undefined;

          setPreview3DTable({
            id: t.id,
            name: t.number,
            seats: t.capacity,
            shape: t.shape,
            status: t.status === 'occupied' ? 'OCCUPIED' : 'AVAILABLE',
            imageUrl: imageUrl,
            cubeUrls: cubeUrls,
          });
          setPreview3DOpen(true);
        } : undefined}
      />

      {/* ─── 360° PANORAMA PREVIEW MODAL ─── */}
      <TablePreview3DModal
        open={preview3DOpen}
        table={preview3DTable ? {
          id: preview3DTable.id,
          tenantId: '',
          name: preview3DTable.name,
          seats: preview3DTable.seats,
          status: preview3DTable.status as any,
          area: '',
          position: { x: 0, y: 0 },
          shape: preview3DTable.shape as any,
          width: 80,
          height: 80,
          rotation: 0,
        } : null}
        tableImageUrl={preview3DTable?.imageUrl}
        cubeUrls={preview3DTable?.cubeUrls}
        onClose={() => setPreview3DOpen(false)}
        onBookNow={() => setPreview3DOpen(false)}
      />

      <AddAreaModal
        open={addAreaModalOpen}
        onClose={() => setAddAreaModalOpen(false)}
        onSubmit={handleAddArea}
        existingNames={beFloors.map((f) => f.name)}
      />

      {/* ─── FLOOR EDIT AREA MODAL ─── */}
      <AddAreaModal
        open={editAreaModalOpen}
        onClose={() => setEditAreaModalOpen(false)}
        onSubmit={handleEditArea}
        initialName={beFloors.find(f => f.id === selectedFloorId)?.name || ""}
        initialWidth={beFloors.find(f => f.id === selectedFloorId)?.width || 1200}
        initialHeight={beFloors.find(f => f.id === selectedFloorId)?.height || 800}
        existingNames={beFloors.map((f) => f.name)}
        showDimensions
        title="Chỉnh sửa thông số khu vực"
        submitText="Lưu lại"
      />

      {/* ─── TABLE DELETE CONFIRM MODAL ─── */}
      <DeleteConfirmModal
        open={deleteConfirmOpen}
        itemName={selectedTable?.number || ""}
        itemType="Table"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteTable}
      />

      {/* ─── FLOOR DELETE CONFIRM MODAL ─── */}
      <DeleteConfirmModal
        open={!!zoneToDelete}
        itemName={beFloors.find(f => f.id === zoneToDelete)?.name || ""}
        itemType="Floor"
        onClose={() => setZoneToDelete(null)}
        onConfirm={confirmDeleteFloor}
      />

      {/* ─── REALTIME TABLE SESSION OPERATIONS MODAL ─── */}
      <Modal
        title={sessionActionTable ? t("dashboard.tables.operational_modal.title", { number: sessionActionTable.number, defaultValue: `Quản lý Bàn: ${sessionActionTable.number}` }) : t("dashboard.tables.operational_modal.default_title", { defaultValue: "Quản lý Bàn" })}
        open={isSessionModalOpen}
        onCancel={() => setIsSessionModalOpen(false)}
        footer={null}
        width={420}
      >
        {sessionActionTable && (
          <div className="space-y-6 pt-3">
            
            {/* Current status info */}
            <div className="p-4 rounded-xl border flex items-center justify-between bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("dashboard.tables.operational_modal.current_status", { defaultValue: "Trạng thái hiện tại" })}</p>
                <h4 className={`font-extrabold text-lg mt-0.5 ${sessionActionTable.status === "occupied" ? "text-red-500" : "text-emerald-500"}`}>
                  {sessionActionTable.status === "occupied" 
                    ? t("dashboard.tables.operational_modal.status_occupied", { defaultValue: "Đang có khách" }) 
                    : t("dashboard.tables.operational_modal.status_available", { defaultValue: "Trống (Sẵn sàng)" })}
                </h4>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF5A2C]/10 text-[#FF5A2C]">
                {t("dashboard.tables.operational_modal.seats", { count: sessionActionTable.capacity, defaultValue: `${sessionActionTable.capacity} ghế` })}
              </span>
            </div>

            {/* Session details */}
            {sessionActionTable.status === "occupied" && sessionActionTable.currentOrder && (
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-gray-400 uppercase tracking-wider">{t("dashboard.tables.operational_modal.session_info", { defaultValue: "Thông tin phiên ăn" })}</h5>
                <div className="bg-gray-50 dark:bg-slate-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-900 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("dashboard.tables.operational_modal.order_code", { defaultValue: "Mã đơn hàng:" })}</span>
                    <span className="font-bold text-[#FF5A2C]">#{sessionActionTable.currentOrder}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              {sessionActionTable.status === "available" ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={startSession}
                  className="w-full flex items-center justify-center gap-2 h-12 font-bold"
                  style={{ background: "#22c55e", borderColor: "#22c55e" }}
                >
                  {t("dashboard.tables.operational_modal.btn_unlock", { defaultValue: "🟢 Mở khóa & Sử dụng bàn ăn" })}
                </Button>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      size="large"
                      onClick={handleOpenTransfer}
                      className="flex items-center justify-center gap-1.5 h-11 font-bold"
                    >
                      {t("dashboard.tables.operational_modal.btn_transfer", { defaultValue: "🔄 Chuyển bàn" })}
                    </Button>
                    <Button
                      size="large"
                      onClick={handleOpenMerge}
                      className="flex items-center justify-center gap-1.5 h-11 font-bold"
                    >
                      {t("dashboard.tables.operational_modal.btn_merge", { defaultValue: "🔗 Gộp bàn" })}
                    </Button>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    danger
                    onClick={closeSession}
                    className="w-full flex items-center justify-center gap-2 h-12 font-bold mt-1"
                  >
                    {t("dashboard.tables.operational_modal.btn_checkout", { defaultValue: "🔴 Thanh toán & Đóng bàn" })}
                  </Button>
                </>
              )}

              {/* QR and Menu links */}
              {sessionActionTable.qrCodeUrl && (
                <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                  <a
                    href={getQrDownloadUrl(sessionActionTable.qrCodeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline font-bold"
                  >
                    {t("dashboard.tables.operational_modal.download_qr", { defaultValue: "📥 Tải xuống hình ảnh QR Code của bàn này" })}
                  </a>
                  <a
                    href={sessionActionTable.qrCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#FF5A2C] hover:underline font-bold"
                  >
                    {t("dashboard.tables.operational_modal.go_to_menu", { defaultValue: "🔗 Đi tới trang gọi món (Menu) của bàn" })}
                  </a>
                </div>
              )}

              {/* Edit table configuration link */}
              <button
                onClick={() => {
                  setIsSessionModalOpen(false);
                  setSelectedTable(sessionActionTable);
                  setDrawerOpen(true);
                }}
                className="text-xs text-blue-500 hover:text-blue-700 hover:underline font-bold mt-3 self-center bg-transparent border-none cursor-pointer flex items-center gap-1"
              >
                {t("dashboard.tables.details.edit_table_config", { defaultValue: "⚙️ Chỉnh sửa cấu hình bàn ăn" })}
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* ─── TRANSFER SESSION MODAL ─── */}
      <Modal
        title={t("dashboard.tables.transfer_modal.title", { defaultValue: "Chuyển phiên sang bàn khác" })}
        open={isTransferModalOpen}
        onOk={executeTransfer}
        onCancel={() => setIsTransferModalOpen(false)}
        okText={t("dashboard.tables.transfer_modal.confirm", { defaultValue: "Xác nhận chuyển" })}
        cancelText={t("dashboard.tables.transfer_modal.cancel", { defaultValue: "Hủy bỏ" })}
      >
        <div className="space-y-4 pt-3">
          <p className="text-sm text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{
            __html: t("dashboard.tables.transfer_modal.description", {
              number: sessionActionTable?.number || "",
              defaultValue: `Chọn một bàn ăn đang trống để chuyển toàn bộ phiên sử dụng và đơn hàng (nếu có) từ bàn <strong>${sessionActionTable?.number || ""}</strong> sang.`
            })
          }} />
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">
              {t("dashboard.tables.transfer_modal.target_label", { defaultValue: "Chọn bàn trống đích *" })}
            </label>
            <select
              value={transferTargetTableId}
              onChange={(e) => setTransferTargetTableId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:border-[#FF5A2C] text-gray-800 dark:text-gray-200"
            >
              <option value="">{t("dashboard.tables.transfer_modal.select_placeholder", { defaultValue: "Chọn bàn trống" })}</option>
              {tables
                .filter((t) => t.status === "available" && t.id !== sessionActionTable?.id && !t.number.startsWith("DECO_"))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.number} ({t.capacity} chỗ) - {t.area}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* ─── MERGE SESSION MODAL ─── */}
      <Modal
        title={t("dashboard.tables.merge_modal.title", { defaultValue: "Gộp bàn ăn" })}
        open={isMergeModalOpen}
        onOk={executeMerge}
        onCancel={() => setIsMergeModalOpen(false)}
        okText={t("dashboard.tables.merge_modal.confirm", { defaultValue: "Xác nhận gộp" })}
        cancelText={t("dashboard.tables.merge_modal.cancel", { defaultValue: "Hủy bỏ" })}
      >
        <div className="space-y-4 pt-3">
          <p className="text-sm text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{
            __html: t("dashboard.tables.merge_modal.description", {
              number: sessionActionTable?.number || "",
              defaultValue: `Chọn một bàn ăn đang hoạt động (đang có khách) để gộp phiên của bàn <strong>${sessionActionTable?.number || ""}</strong> vào đó. Cả hai bàn sẽ cùng liên kết tới một đơn hàng chung.`
            })
          }} />
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">
              {t("dashboard.tables.merge_modal.target_label", { defaultValue: "Chọn bàn gộp đích *" })}
            </label>
            <select
              value={mergeTargetTableId}
              onChange={(e) => setMergeTargetTableId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:border-[#FF5A2C] text-gray-800 dark:text-gray-200"
            >
              <option value="">{t("dashboard.tables.merge_modal.select_placeholder", { defaultValue: "Chọn bàn bận" })}</option>
              {tables
                .filter((t) => t.status === "occupied" && t.id !== sessionActionTable?.id && !t.number.startsWith("DECO_"))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.number} (Đang bận) - {t.area}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Modal>

    </div>
  );
}
