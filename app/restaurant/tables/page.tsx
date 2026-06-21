"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Download,
  Link as LinkIcon,
  Settings,
  Trash2,
  Eye,
  Edit,
  List,
  Search,
  Undo2,
  Redo2,
  X,
  Save,
  ArrowLeftRight,
  XCircle,
  DollarSign,
  Play,
  Sprout,
  Fence,
  ConciergeBell,
  Beer,
  DoorOpen,
  AppWindow,
  Layers,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { App, Spin, Button, Tooltip, Modal } from "antd";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";
import DOMPurify from "dompurify";
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

const TEMPLATE_LAYOUTS: Record<string, Array<{
  code: string;
  seatingCapacity: number;
  shape: "Circle" | "Rectangle" | "Square" | "Oval";
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
}>> = {
  standard: [
    // Entrance & Reception
    { code: "DECO_DOOR_Cửa chính", seatingCapacity: 0, shape: "Rectangle", positionX: 40, positionY: 720, width: 60, height: 80, rotation: 0 },
    { code: "DECO_RECEPTION_Quầy lễ tân", seatingCapacity: 0, shape: "Rectangle", positionX: 120, positionY: 700, width: 120, height: 90, rotation: 0 },
    
    // Wall dividers
    { code: "DECO_WALL_Vách ngăn 1", seatingCapacity: 0, shape: "Rectangle", positionX: 400, positionY: 380, width: 300, height: 20, rotation: 0 },
    { code: "DECO_WALL_Vách ngăn 2", seatingCapacity: 0, shape: "Rectangle", positionX: 850, positionY: 200, width: 20, height: 300, rotation: 0 },

    // Potted Plants
    { code: "DECO_PLANT_Cây xanh 1", seatingCapacity: 0, shape: "Circle", positionX: 40, positionY: 40, width: 50, height: 50, rotation: 0 },
    { code: "DECO_PLANT_Cây xanh 2", seatingCapacity: 0, shape: "Circle", positionX: 1110, positionY: 40, width: 50, height: 50, rotation: 0 },
    { code: "DECO_PLANT_Cây xanh 3", seatingCapacity: 0, shape: "Circle", positionX: 1110, positionY: 710, width: 50, height: 50, rotation: 0 },

    // Tables
    { code: "101", seatingCapacity: 4, shape: "Square", positionX: 150, positionY: 150, width: 80, height: 80, rotation: 0 },
    { code: "102", seatingCapacity: 4, shape: "Square", positionX: 320, positionY: 150, width: 80, height: 80, rotation: 0 },
    { code: "103", seatingCapacity: 4, shape: "Square", positionX: 490, positionY: 150, width: 80, height: 80, rotation: 0 },
    { code: "104", seatingCapacity: 6, shape: "Rectangle", positionX: 150, positionY: 340, width: 120, height: 80, rotation: 0 },
    { code: "105", seatingCapacity: 6, shape: "Rectangle", positionX: 150, positionY: 480, width: 120, height: 80, rotation: 0 },
    
    { code: "106", seatingCapacity: 4, shape: "Circle", positionX: 950, positionY: 120, width: 90, height: 90, rotation: 0 },
    { code: "107", seatingCapacity: 4, shape: "Circle", positionX: 950, positionY: 320, width: 90, height: 90, rotation: 0 },
    { code: "108", seatingCapacity: 8, shape: "Circle", positionX: 940, positionY: 530, width: 110, height: 110, rotation: 0 },
  ],
  vip: [
    // Entrance & Reception
    { code: "DECO_DOOR_Cửa VIP", seatingCapacity: 0, shape: "Rectangle", positionX: 50, positionY: 720, width: 60, height: 80, rotation: 0 },
    { code: "DECO_RECEPTION_Đón tiếp VIP", seatingCapacity: 0, shape: "Rectangle", positionX: 130, positionY: 700, width: 120, height: 90, rotation: 0 },

    // Room 1 (Top Left VIP Booth)
    { code: "DECO_WALL_Vách ngăn VIP A1", seatingCapacity: 0, shape: "Rectangle", positionX: 350, positionY: 40, width: 20, height: 320, rotation: 0 },
    { code: "DECO_WALL_Vách ngăn VIP A2", seatingCapacity: 0, shape: "Rectangle", positionX: 40, positionY: 360, width: 330, height: 20, rotation: 0 },
    { code: "VIP 1", seatingCapacity: 8, shape: "Circle", positionX: 130, positionY: 120, width: 120, height: 120, rotation: 0 },
    { code: "DECO_PLANT_Cây VIP 1", seatingCapacity: 0, shape: "Circle", positionX: 300, positionY: 60, width: 45, height: 45, rotation: 0 },

    // Room 2 (Top Right VIP Booth)
    { code: "DECO_WALL_Vách ngăn VIP B1", seatingCapacity: 0, shape: "Rectangle", positionX: 830, positionY: 40, width: 20, height: 320, rotation: 0 },
    { code: "DECO_WALL_Vách ngăn VIP B2", seatingCapacity: 0, shape: "Rectangle", positionX: 830, positionY: 360, width: 330, height: 20, rotation: 0 },
    { code: "VIP 2", seatingCapacity: 8, shape: "Circle", positionX: 930, positionY: 120, width: 120, height: 120, rotation: 0 },
    { code: "DECO_PLANT_Cây VIP 2", seatingCapacity: 0, shape: "Circle", positionX: 870, positionY: 60, width: 45, height: 45, rotation: 0 },

    // Room 3 (Bottom Right VIP Booth)
    { code: "DECO_WALL_Vách ngăn VIP C1", seatingCapacity: 0, shape: "Rectangle", positionX: 830, positionY: 440, width: 20, height: 320, rotation: 0 },
    { code: "DECO_WALL_Vách ngăn VIP C2", seatingCapacity: 0, shape: "Rectangle", positionX: 830, positionY: 440, width: 330, height: 20, rotation: 0 },
    { code: "VIP 3", seatingCapacity: 10, shape: "Circle", positionX: 920, positionY: 520, width: 140, height: 140, rotation: 0 },
    { code: "DECO_PLANT_Cây VIP 3", seatingCapacity: 0, shape: "Circle", positionX: 870, positionY: 710, width: 45, height: 45, rotation: 0 },

    // Central Private Lounge
    { code: "VIP 4", seatingCapacity: 12, shape: "Oval", positionX: 470, positionY: 480, width: 200, height: 130, rotation: 0 },
    { code: "DECO_PLANT_Cây trung tâm", seatingCapacity: 0, shape: "Circle", positionX: 550, positionY: 380, width: 50, height: 50, rotation: 0 }
  ],
  cafe_bar: [
    // Entrance
    { code: "DECO_DOOR_Cửa quán", seatingCapacity: 0, shape: "Rectangle", positionX: 40, positionY: 720, width: 60, height: 80, rotation: 0 },
    { code: "DECO_PLANT_Cây xanh lối vào", seatingCapacity: 0, shape: "Circle", positionX: 110, positionY: 730, width: 45, height: 45, rotation: 0 },

    // Long Bar counter
    { code: "DECO_BAR_Quầy Bar Cafe", seatingCapacity: 0, shape: "Rectangle", positionX: 250, positionY: 80, width: 700, height: 140, rotation: 0 },

    // Couple round tables (Left side)
    { code: "Table 1", seatingCapacity: 2, shape: "Circle", positionX: 90, positionY: 150, width: 60, height: 60, rotation: 0 },
    { code: "Table 2", seatingCapacity: 2, shape: "Circle", positionX: 90, positionY: 300, width: 60, height: 60, rotation: 0 },
    { code: "Table 3", seatingCapacity: 2, shape: "Circle", positionX: 90, positionY: 450, width: 60, height: 60, rotation: 0 },

    // Cozy lounge corners with wooden dividers
    { code: "DECO_WALL_Vách ngăn Cafe A", seatingCapacity: 0, shape: "Rectangle", positionX: 250, positionY: 380, width: 20, height: 380, rotation: 0 },
    { code: "DECO_WALL_Vách ngăn Cafe B", seatingCapacity: 0, shape: "Rectangle", positionX: 650, positionY: 380, width: 20, height: 380, rotation: 0 },

    { code: "Table 4", seatingCapacity: 4, shape: "Square", positionX: 380, positionY: 440, width: 80, height: 80, rotation: 0 },
    { code: "Table 5", seatingCapacity: 4, shape: "Square", positionX: 380, positionY: 600, width: 80, height: 80, rotation: 0 },
    
    { code: "Table 6", seatingCapacity: 4, shape: "Square", positionX: 780, positionY: 440, width: 80, height: 80, rotation: 0 },
    { code: "Table 7", seatingCapacity: 4, shape: "Square", positionX: 980, positionY: 440, width: 80, height: 80, rotation: 0 },
    { code: "Table 8", seatingCapacity: 6, shape: "Rectangle", positionX: 860, positionY: 590, width: 130, height: 80, rotation: 0 }
  ]
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

const dragItems = [
  {
    category: 'Bàn ăn',
    items: [
      { type: 'table', shape: 'Square', capacity: 2, name: 'Bàn 2 chỗ', width: 70, height: 70, label: 'Bàn vuông 2 chỗ' },
      { type: 'table', shape: 'Square', capacity: 4, name: 'Bàn 4 chỗ', width: 85, height: 85, label: 'Bàn vuông 4 chỗ' },
      { type: 'table', shape: 'Rectangle', capacity: 6, name: 'Bàn 6 chỗ', width: 130, height: 80, label: 'Bàn dài 6 chỗ' },
      { type: 'table', shape: 'Circle', capacity: 4, name: 'Bàn tròn 4 chỗ', width: 90, height: 90, label: 'Bàn tròn 4 chỗ' },
      { type: 'table', shape: 'Circle', capacity: 8, name: 'Bàn tròn lớn', width: 130, height: 130, label: 'Bàn tròn 8 chỗ' },
    ]
  },
  {
    category: 'Vật phẩm trang trí',
    items: [
      { type: 'deco', decoType: 'PLANT', name: 'Cây cảnh', width: 60, height: 60, label: 'Chậu cây xanh' },
      { type: 'deco', decoType: 'WALL', name: 'Vách ngăn', width: 120, height: 20, label: 'Vách ngăn phòng' },
      { type: 'deco', decoType: 'RECEPTION', name: 'Quầy lễ tân', width: 100, height: 60, label: 'Quầy lễ tân' },
      { type: 'deco', decoType: 'BAR', name: 'Quầy bar', width: 160, height: 60, label: 'Quầy bar phục vụ' },
      { type: 'deco', decoType: 'DOOR', name: 'Cửa ra vào', width: 80, height: 20, label: 'Cửa ra vào' },
      { type: 'deco', decoType: 'WINDOW', name: 'Cửa sổ', width: 80, height: 15, label: 'Cửa sổ thông thoáng' },
      { type: 'deco', decoType: 'STAIRS', name: 'Cầu thang', width: 120, height: 80, label: 'Cầu thang lên tầng' },
    ]
  }
] as const;

export default function TablesManagementPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const { user, isAuthReady } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [beFloors, setBeFloors] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [tables, setTables] = useState<Table[]>([]);
  
  // Flash highlight state for newly added tables/items (3 glow pulses)
  const [flashTableId, setFlashTableId] = useState<string | null>(null);
  const flashItem = (id: string) => {
    setFlashTableId(id);
    setTimeout(() => setFlashTableId(null), 1800); // 3 pulses @ ~600ms each
  };
  
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

  // Quick Action Panel (view mode, OCCUPIED table click)
  const [quickActionTable, setQuickActionTable] = useState<Table | null>(null);

  // Undo/Redo for layout editing
  type PosSnapshot = { id: string; x: number; y: number; width: number; height: number };
  const [undoStack, setUndoStack] = useState<PosSnapshot[][]>([]);
  const [redoStack, setRedoStack] = useState<PosSnapshot[][]>([]);
  const MAX_UNDO = 20;

  // Deferred save — track which tableIds have unsaved layout changes
  const [pendingLayoutIds, setPendingLayoutIds] = useState<Set<string>>(new Set());
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const pushUndoSnapshot = (tableId: string) => {
    const t = tables.find(t => t.id === tableId);
    if (!t) return;
    setUndoStack(prev => [...prev.slice(-(MAX_UNDO - 1)), [{ id: tableId, x: t.positionX, y: t.positionY, width: t.width, height: t.height }]]);
    setRedoStack([]);
  };

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

  const isFloorSizeChanged = useMemo(() => {
    const activeFloorData = beFloors.find(f => f.id === selectedFloorId);
    const activeLayoutFloor = layout?.floors.find(f => f.id === selectedFloorId);
    if (!activeFloorData || !activeLayoutFloor) return false;
    return activeLayoutFloor.width !== activeFloorData.width || activeLayoutFloor.height !== activeFloorData.height;
  }, [beFloors, layout, selectedFloorId]);

  const hasUnsavedChanges = pendingLayoutIds.size > 0 || isFloorSizeChanged;

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
    if (newLayout.activeFloorId && newLayout.activeFloorId !== selectedFloorId) {
      setSelectedFloorId(newLayout.activeFloorId);
    }
  };

  // Local-only drag update — persisted to DB only when user clicks "Lưu bố cục"
  const handleMap2DTablePositionChange = (tableId: string, position: { x: number; y: number; zoneId?: string }) => {
    const tableToUpdate = tables.find(t => t.id === tableId);
    if (!tableToUpdate) return;
    pushUndoSnapshot(tableId);
    const effectiveFloorId = tableToUpdate.floorId || selectedFloorId;
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, positionX: position.x, positionY: position.y, floorId: effectiveFloorId } : t
    ));
    setPendingLayoutIds(prev => new Set([...prev, tableId]));
  };

  // Local-only resize update — same deferred save pattern
  const handleMap2DTableResize = (tableId: string, size: { width: number; height: number }) => {
    const tableToUpdate = tables.find(t => t.id === tableId);
    if (!tableToUpdate) return;
    pushUndoSnapshot(tableId);
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, width: size.width, height: size.height } : t
    ));
    setPendingLayoutIds(prev => new Set([...prev, tableId]));
  };

  // Batch-save all pending layout changes to the backend
  const handleSaveLayout = async () => {
    if (!hasUnsavedChanges) return;
    setIsSavingLayout(true);
    const failed: string[] = [];

    // Save floor size if changed
    const activeFloorData = beFloors.find(f => f.id === selectedFloorId);
    const activeLayoutFloor = layout?.floors.find(f => f.id === selectedFloorId);
    if (activeFloorData && activeLayoutFloor && (activeLayoutFloor.width !== activeFloorData.width || activeLayoutFloor.height !== activeFloorData.height)) {
      try {
        await floorService.updateFloor(selectedFloorId, {
          name: activeFloorData.name,
          width: activeLayoutFloor.width,
          height: activeLayoutFloor.height,
        });
      } catch (err) {
        console.error("Failed to update floor dimensions:", err);
        failed.push(`Kích thước khu vực (${activeFloorData.name})`);
      }
    }

    if (pendingLayoutIds.size > 0) {
      for (const tableId of pendingLayoutIds) {
        const t = tables.find(tt => tt.id === tableId);
        if (!t) continue;
        try {
          await tableService.updateTable(tableId, {
            code: t.number,
            seatingCapacity: t.capacity,
            type: t.area,
            floorId: t.floorId || selectedFloorId,
            shape: t.shape,
            positionX: t.positionX,
            positionY: t.positionY,
            width: t.width,
            height: t.height,
            rotation: t.rotation,
            isActive: t.isActive,
            tableStatusId: t.status === 'occupied' ? TableStatus.Occupied : TableStatus.Available,
          } as any);
        } catch {
          failed.push(t.number || tableId);
        }
      }
    }

    setIsSavingLayout(false);
    if (failed.length === 0) {
      message.success("Đã lưu sơ đồ khu vực & bàn ăn thành công!");
      setPendingLayoutIds(new Set());
      fetchTables();
    } else {
      message.error(`Lưu thất bại: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '...' : ''}`);
    }
  };

  // Undo/redo apply: update local state only, mark as pending (same as drag/resize)
  const applySnapshot = (snapshot: PosSnapshot[]) => {
    setTables(prev => prev.map(t => {
      const s = snapshot.find(s => s.id === t.id);
      return s ? { ...t, positionX: s.x, positionY: s.y, width: s.width, height: s.height } : t;
    }));
    setPendingLayoutIds(prev => new Set([...prev, ...snapshot.map(s => s.id)]));
  };

  const handleUndo = useCallback(() => {
    if (!undoStack.length) return;
    const snapshot = undoStack[undoStack.length - 1];
    const current: PosSnapshot[] = snapshot.map(s => {
      const t = tables.find(t => t.id === s.id);
      return t ? { id: t.id, x: t.positionX, y: t.positionY, width: t.width, height: t.height } : s;
    });
    setRedoStack(prev => [...prev, current]);
    setUndoStack(prev => prev.slice(0, -1));
    applySnapshot(snapshot);
  }, [undoStack, tables]);

  const handleRedo = useCallback(() => {
    if (!redoStack.length) return;
    const snapshot = redoStack[redoStack.length - 1];
    const current: PosSnapshot[] = snapshot.map(s => {
      const t = tables.find(t => t.id === s.id);
      return t ? { id: t.id, x: t.positionX, y: t.positionY, width: t.width, height: t.height } : s;
    });
    setUndoStack(prev => [...prev, current]);
    setRedoStack(prev => prev.slice(0, -1));
    applySnapshot(snapshot);
  }, [redoStack, tables]);

  // Ctrl+Z / Ctrl+Y keyboard shortcuts in edit mode
  useEffect(() => {
    if (viewMode !== "edit") return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [viewMode, handleUndo, handleRedo]);

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
      if (table.status === "occupied") {
        // Show quick action bar instead of full modal immediately
        setQuickActionTable(table);
      } else {
        setIsSessionModalOpen(true);
      }
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

    const tempId = `temp-add-${Date.now()}`;
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

      // 1. Optimistic UI update: Close modal immediately & insert temp table
      setAddModalOpen(false);

      const tempTable: Table = {
        id: tempId,
        number: code,
        capacity: isDeco ? 0 : seatingCapacity,
        area: floorName,
        floorId: selectedFloorId,
        shape: isDeco ? 'Rectangle' : 'Square',
        positionX: 50,
        positionY: 50,
        width: isDeco ? 60 : 80,
        height: isDeco ? 60 : 80,
        rotation: 0,
        isActive: true,
        status: 'available'
      };

      setTables(prev => [...prev, tempTable]);
      flashItem(tempId);

      // 2. Perform API call in background
      tableService.createTable(newTableData)
        .then((created) => {
          message.success("Tạo bàn ăn thành công");
          
          const mappedTable: Table = {
            id: created.id,
            number: created.code,
            capacity: created.seatingCapacity,
            area: created.type,
            floorId: created.floorId || selectedFloorId,
            shape: created.shape as Table["shape"],
            positionX: created.positionX,
            positionY: created.positionY,
            width: created.width,
            height: created.height,
            rotation: created.rotation,
            isActive: created.isActive,
            status: created.tableStatusId === TableStatus.Occupied ? 'occupied' : 'available'
          };

          // Update temp table to real table
          setTables(prev => prev.map(t => t.id === tempId ? mappedTable : t));
          setFlashTableId(prev => prev === tempId ? created.id : prev);
          fetchTables();
        })
        .catch((err) => {
          console.error("Failed to add table:", err);
          // Rollback optimistic update
          setTables(prev => prev.filter(t => t.id !== tempId));
          message.error(extractApiErrorMessage(err, "Không thể tạo bàn ăn"));
        });
    } catch (err) {
      console.error("Failed to initiate table addition:", err);
    }
  };

  const handleComponentDrop = async (item: any, position: { x: number; y: number }) => {
    const tempId = `temp-${Date.now()}`;
    try {
      const selectedFloor = beFloors.find(f => f.id === selectedFloorId);
      const floorName = selectedFloor?.name || 'Indoor';

      // Generate a default code/name based on category
      let code = "";
      if (item.type === 'table') {
        const numericTables = tables
          .filter(t => t.floorId === selectedFloorId && !t.number.startsWith("DECO_"))
          .map(t => parseInt(t.number.replace(/\D/g, '')))
          .filter(num => !isNaN(num));
        const maxNum = numericTables.length > 0 ? Math.max(...numericTables) : 0;
        code = String(maxNum + 1);
      } else {
        const existingDecos = tables
          .filter(t => t.floorId === selectedFloorId && t.number.startsWith(`DECO_${item.decoType}_`))
          .map(t => parseInt(t.number.replace(`DECO_${item.decoType}_`, '')))
          .filter(num => !isNaN(num));
        const maxNum = existingDecos.length > 0 ? Math.max(...existingDecos) : 0;
        code = `DECO_${item.decoType}_${maxNum + 1}`;
      }

      // 1. Optimistic UI update: Add temp object to state
      const tempTable: Table = {
        id: tempId,
        number: code,
        capacity: item.capacity || 0,
        area: floorName,
        floorId: selectedFloorId,
        shape: item.shape || 'Rectangle',
        positionX: position.x,
        positionY: position.y,
        width: item.width || 80,
        height: item.height || 80,
        rotation: 0,
        isActive: true,
        status: 'available'
      };

      setTables(prev => [...prev, tempTable]);
      flashItem(tempId);

      const newTableData = {
        code,
        seatingCapacity: item.capacity || 0,
        type: floorName,
        floorId: selectedFloorId,
        tableStatusId: TableStatus.Available,
        isActive: true,
        shape: item.shape || 'Rectangle',
        positionX: position.x,
        positionY: position.y,
        width: item.width || 80,
        height: item.height || 80,
        rotation: 0
      };

      const created = await tableService.createTable(newTableData);
      message.success(`Thêm ${item.type === 'table' ? 'bàn' : 'vật phẩm'} thành công`);
      
      const mappedTable: Table = {
        id: created.id,
        number: created.code,
        capacity: created.seatingCapacity,
        area: created.type,
        floorId: created.floorId || selectedFloorId,
        shape: created.shape as Table["shape"],
        positionX: created.positionX,
        positionY: created.positionY,
        width: created.width,
        height: created.height,
        rotation: created.rotation,
        isActive: created.isActive,
        status: created.tableStatusId === TableStatus.Occupied ? 'occupied' : 'available'
      };
      
      // Update from temp to real created table
      setTables(prev => prev.map(t => t.id === tempId ? mappedTable : t));
      
      // Keep flash active on the new real ID
      setFlashTableId(prev => prev === tempId ? created.id : prev);

      fetchTables();
    } catch (err) {
      console.error("Drop add failed", err);
      // Rollback optimistic update on error
      setTables(prev => prev.filter(t => t.id !== tempId));
      message.error(extractApiErrorMessage(err, "Không thể tạo vật phẩm"));
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

  const createTemplateItems = async (floorId: string, floorName: string, template: string) => {
    const items = TEMPLATE_LAYOUTS[template];
    if (!items) return;

    for (const item of items) {
      try {
        // Generate a unique code for each floor to avoid backend 409 conflict
        const uniqueCode = item.code.startsWith("DECO_")
          ? `${item.code}_${floorId}`
          : `${item.code} - ${floorName}`;

        await tableService.createTable({
          code: uniqueCode,
          seatingCapacity: item.seatingCapacity,
          type: floorName,
          floorId: floorId,
          tableStatusId: TableStatus.Available,
          isActive: true,
          shape: item.shape,
          positionX: item.positionX,
          positionY: item.positionY,
          width: item.width,
          height: item.height,
          rotation: item.rotation
        });
      } catch (err) {
        console.error(`Failed to create template item ${item.code}:`, err);
      }
    }
  };

  // Floor CRUD handlers
  const handleAddArea = async (values: { name: string; width: number; height: number; template?: string }) => {
    try {
      const newId = await floorService.createFloor({ name: values.name, width: values.width, height: values.height });
      
      if (values.template && values.template !== "empty") {
        await createTemplateItems(newId, values.name, values.template);
      }

      message.success("Thêm khu vực mới thành công");
      setSelectedFloorId(newId);
      setAddAreaModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error("Failed to add floor:", err);
      message.error(extractApiErrorMessage(err, "Không thể thêm khu vực mới"));
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

  // Stats per floor for badge and status bar
  const floorStats = useMemo(() => {
    const result: Record<string, { available: number; occupied: number; reserved: number; disabled: number; total: number }> = {};
    for (const f of beFloors) {
      const floorTables = tables.filter(t => t.floorId === f.id && t.isActive && !t.number.startsWith("DECO_"));
      result[f.id] = {
        available: floorTables.filter(t => t.status === "available").length,
        occupied: floorTables.filter(t => t.status === "occupied").length,
        reserved: 0,
        disabled: floorTables.filter(t => !t.isActive).length,
        total: floorTables.length,
      };
    }
    return result;
  }, [tables, beFloors]);

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#090D16]">
        <div className="w-10 h-10 rounded-full border-4 animate-spin border-[#FF5A2C] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAF9F6] dark:bg-[#090D16] text-[#1A1A1A] dark:text-[#E2E8F0] transition-colors duration-200">
      <Spin fullscreen spinning={isUploadingPanorama} description="Đang lưu ảnh panorama..." size="large" />
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
                  <Eye className="w-4 h-4" />
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
                  <Edit className="w-4 h-4" />
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
                  <List className="w-4 h-4" />
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
                    {beFloors.map((f) => {
                      const stats = floorStats[f.id] ?? { available: 0, total: 0 };
                      const ratio = stats.total > 0 ? stats.available / stats.total : 1;
                      const badgeColor = ratio >= 0.5 ? "#52c41a" : ratio >= 0.2 ? "#faad14" : "#ff4d4f";
                      const isActive = selectedFloorId === f.id;
                      return (
                        <Tooltip key={f.id} title={`${f.name} — ${stats.available} trống / ${stats.total} bàn`} placement="bottom">
                          <div
                            className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all shadow-sm ${
                              isActive
                                ? "bg-[#FF5A2C] border-[#FF5A2C] text-white"
                                : "bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-gray-400 dark:hover:border-gray-600"
                            }`}
                            onClick={() => setSelectedFloorId(f.id)}
                          >
                            <span>{f.name}</span>
                            {/* Available/total badge */}
                            {stats.total > 0 && (
                              <span style={{
                                padding: "1px 6px",
                                borderRadius: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                background: isActive ? "rgba(255,255,255,0.25)" : `${badgeColor}18`,
                                color: isActive ? "#fff" : badgeColor,
                                minWidth: 32,
                                textAlign: "center",
                              }}>
                                {stats.available}/{stats.total}
                              </span>
                            )}
                            {/* Floor edit actions (visible in edit mode) */}
                            {viewMode === "edit" && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 ml-1 bg-black/10 px-1.5 py-0.5 rounded">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditAreaModalOpen(true); }}
                                    title="Sửa tầng"
                                    className="text-xs hover:scale-110 flex items-center justify-center p-0.5"
                                  ><Edit className="w-3 h-3 text-white" /></button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setZoneToDelete(f.id); }}
                                    title="Xóa tầng"
                                    className="text-xs hover:scale-110 flex items-center justify-center p-0.5"
                                    disabled={beFloors.length <= 1}
                                  ><Trash2 className="w-3 h-3 text-white" /></button>
                                </div>
                              )}
                            </div>
                          </Tooltip>
                        );
                      })}
                      {viewMode === "edit" && (
                        <button
                          onClick={() => setAddAreaModalOpen(true)}
                          className="px-4.5 py-3 rounded-xl border border-dashed border-[var(--border)] hover:border-[#FF5A2C] text-[var(--text-muted)] hover:text-[#FF5A2C] text-sm font-bold transition-all flex items-center gap-1.5 bg-transparent"
                        >
                          <Plus className="w-4 h-4" /> Thêm khu vực
                        </button>
                      )}
                    </div>

                  {/* Edit mode toolbar: Add + Undo/Redo + Save */}
                  {viewMode === "edit" && selectedFloorId && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="primary"
                        onClick={() => setAddModalOpen(true)}
                        className="font-bold h-10 px-5 rounded-xl animate-fade-in flex items-center gap-1.5"
                        style={{ background: "#22c55e", borderColor: "#22c55e" }}
                      >
                        <Plus className="w-4 h-4" /> Thiết kế Bàn / Vật phẩm
                      </Button>
                      <Button
                        onClick={() => setEditAreaModalOpen(true)}
                        className="font-bold h-10 px-4 rounded-xl flex items-center gap-1.5 border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition-all hover:border-[#FF5A2C] hover:text-[#FF5A2C]"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <Settings className="w-4 h-4" /> Cấu hình khu vực
                      </Button>
                      <div style={{ width: 1, height: 28, background: "var(--border)", margin: "0 4px" }} />
                      <Tooltip title={undoStack.length ? `Hoàn tác (Ctrl+Z) — ${undoStack.length} bước` : "Không có thao tác để hoàn tác"}>
                        <button
                          onClick={handleUndo}
                          disabled={!undoStack.length}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-[#1677ff] hover:enabled:text-[#1677ff]"
                          style={{ background: "var(--card)" }}
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Hoàn tác
                        </button>
                      </Tooltip>
                      <Tooltip title={redoStack.length ? `Làm lại (Ctrl+Y)` : "Không có thao tác để làm lại"}>
                        <button
                          onClick={handleRedo}
                          disabled={!redoStack.length}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-[#1677ff] hover:enabled:text-[#1677ff]"
                          style={{ background: "var(--card)" }}
                        >
                          <Redo2 className="w-3.5 h-3.5" /> Làm lại
                        </button>
                      </Tooltip>
                      <div style={{ width: 1, height: 28, background: "var(--border)", margin: "0 4px" }} />
                      {hasUnsavedChanges && (
                        <Tooltip title="Huỷ thay đổi, khôi phục từ máy chủ">
                          <button
                            onClick={() => { setPendingLayoutIds(new Set()); fetchTables(); }}
                            disabled={isSavingLayout}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-red-400 hover:enabled:text-red-500 mr-2"
                            style={{ background: "var(--card)" }}
                          >
                            <X className="w-3.5 h-3.5" /> Huỷ
                          </button>
                        </Tooltip>
                      )}
                      <Button
                        type="primary"
                        loading={isSavingLayout}
                        onClick={handleSaveLayout}
                        disabled={!hasUnsavedChanges}
                        className="font-bold h-10 px-5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                        style={{
                          background: hasUnsavedChanges ? "#1677ff" : "var(--border)",
                          borderColor: hasUnsavedChanges ? "#1677ff" : "var(--border)",
                          color: hasUnsavedChanges ? "#fff" : "var(--text-muted)",
                        }}
                      >
                        <Save className="w-4 h-4" /> Lưu bố cục {pendingLayoutIds.size > 0 ? `(${pendingLayoutIds.size} bàn)` : ""}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Status Summary Bar — view mode only */}
                {viewMode === "view" && selectedFloorId && floorStats[selectedFloorId] && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 0,
                    background: "var(--card)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: "8px 16px", flexWrap: "wrap",
                  }}>
                    {[
                      { label: "Trống", count: floorStats[selectedFloorId].available, color: "#52c41a" },
                      { label: "Đang phục vụ", count: floorStats[selectedFloorId].occupied, color: "#ff4d4f" },
                      { label: "Đặt trước", count: floorStats[selectedFloorId].reserved, color: "#faad14" },
                      { label: "Tắt", count: floorStats[selectedFloorId].disabled, color: "#bfbfbf" },
                    ].map((s, i, arr) => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 14px", borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                        <span style={{ color: "var(--text-muted)" }}>{s.label}:</span>
                        <strong style={{ color: "var(--text)" }}>{s.count}</strong>
                      </div>
                    ))}
                    <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", paddingLeft: 14 }}>
                      {activeFloor?.name}
                    </div>
                  </div>
                )}

                {/* Quick Action Panel — slides in when an OCCUPIED table is clicked in view mode */}
                <div style={{
                  visibility: viewMode === "view" && quickActionTable ? "visible" : "hidden",
                  transform: viewMode === "view" && quickActionTable ? "translateY(0)" : "translateY(6px)",
                  opacity: viewMode === "view" && quickActionTable ? 1 : 0,
                  transition: "transform 0.2s ease, opacity 0.2s ease, visibility 0s",
                  display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                  background: "var(--card)", border: "2px solid var(--primary)",
                  borderRadius: 12, padding: "10px 16px",
                }}>
                  <div style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>
                      Bàn {quickActionTable?.number}
                    </span>
                    <span style={{ color: "#ff4d4f", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Đang phục vụ
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 6 }}>
                      · {quickActionTable?.capacity} chỗ
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => { setIsTransferModalOpen(true); }}
                      style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #1677ff", background: "rgba(22,119,255,0.08)", color: "#1677ff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Chuyển bàn
                    </button>
                    <button
                      onClick={() => { closeSession(); setQuickActionTable(null); }}
                      style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #ff4d4f", background: "rgba(255,77,79,0.08)", color: "#ff4d4f", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <X className="w-3.5 h-3.5" /> Đóng bàn
                    </button>
                    <button
                      onClick={() => { setIsSessionModalOpen(true); setQuickActionTable(null); }}
                      style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid var(--primary)", background: "var(--primary-soft, rgba(255,90,44,0.08))", color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setQuickActionTable(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, lineHeight: 1, padding: "2px 4px", marginLeft: "auto" }}
                  >
                    ×
                  </button>
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
                  <div className="flex w-full h-[calc(100vh-270px)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-lg relative bg-[var(--card)]">
                    {viewMode === "edit" && (
                      <div className="w-[260px] h-full border-r border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0 select-none overflow-y-auto">
                        <div className="p-4 border-b border-[var(--border)]">
                          <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Plan Builder</h3>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">Kéo thả vật phẩm vào sơ đồ để bố trí</p>
                        </div>
                        <div className="p-3 flex flex-col gap-5">
                          {dragItems.map((cat) => (
                            <div key={cat.category} className="flex flex-col gap-2">
                              <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
                                {cat.category}
                              </h4>
                              <div className="grid grid-cols-1 gap-2">
                                {cat.items.map((item) => (
                                  <div
                                    key={item.label}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("application/json", JSON.stringify(item));
                                      e.dataTransfer.effectAllowed = "move";
                                    }}
                                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] cursor-grab active:cursor-grabbing transition-all hover:shadow-sm"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-[var(--surface)] flex items-center justify-center border border-[var(--border)]/40 shrink-0">
                                      {item.type === 'table' ? (
                                        item.shape === 'Circle' ? (
                                          <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] flex items-center justify-center text-[9px] font-bold text-[var(--text-muted)]">
                                            {item.capacity}
                                          </div>
                                        ) : (
                                          <div className="border-2 border-[var(--border)] flex items-center justify-center text-[9px] font-bold text-[var(--text-muted)] rounded" style={{ width: item.shape === 'Rectangle' ? '26px' : '18px', height: '18px' }}>
                                            {item.capacity}
                                          </div>
                                        )
                                      ) : (
                                        <div className="text-[var(--text-muted)] flex items-center justify-center">
                                          {item.decoType === 'PLANT' ? <Sprout className="w-5 h-5" /> : 
                                           item.decoType === 'WALL' ? <Fence className="w-5 h-5" /> : 
                                           item.decoType === 'RECEPTION' ? <ConciergeBell className="w-5 h-5" /> : 
                                           item.decoType === 'BAR' ? <Beer className="w-5 h-5" /> : 
                                           item.decoType === 'DOOR' ? <DoorOpen className="w-5 h-5" /> : 
                                           item.decoType === 'WINDOW' ? <AppWindow className="w-5 h-5" /> : 
                                           <Layers className="w-5 h-5" />}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-semibold text-[var(--text)]">{item.label}</span>
                                      <span className="text-[10px] text-[var(--text-muted)]">
                                        {item.type === 'table' ? `${item.capacity} chỗ` : 'Trang trí'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex-1 h-full relative overflow-hidden flex flex-col">
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
                          onComponentDrop={handleComponentDrop}
                          renderTableContent={(table) => {
                            const hasOrder = table.status === "OCCUPIED";
                            return hasOrder && (
                              <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full animate-ping" />
                            );
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Premium Table List View */
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm overflow-hidden flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="font-bold text-[var(--text)] text-lg">Danh sách bàn ăn ({filteredTables.length})</h3>
                  
                  {/* Filters bar */}
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="Tìm kiếm mã bàn..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="px-4 py-2 border border-[var(--border)] bg-[var(--surface)] rounded-xl text-sm outline-none focus:border-[#FF5A2C] transition-all text-[var(--text)] placeholder-[var(--text-muted)]"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-4 py-2 border border-[var(--border)] bg-[var(--surface)] rounded-xl text-sm outline-none focus:border-[#FF5A2C] text-[var(--text)]"
                    >
                      <option value="all" className="bg-[var(--card)] text-[var(--text)]">Tất cả trạng thái</option>
                      <option value="available" className="bg-[var(--card)] text-[var(--text)]">Trống (Available)</option>
                      <option value="occupied" className="bg-[var(--card)] text-[var(--text)]">Đang sử dụng (Occupied)</option>
                    </select>
                    <select
                      value={floorFilter}
                      onChange={(e) => setFloorFilter(e.target.value)}
                      className="px-4 py-2 border border-[var(--border)] bg-[var(--surface)] rounded-xl text-sm outline-none focus:border-[#FF5A2C] text-[var(--text)]"
                    >
                      <option value="all" className="bg-[var(--card)] text-[var(--text)]">Tất cả tầng</option>
                      {beFloors.map(f => (
                        <option key={f.id} value={f.id} className="bg-[var(--card)] text-[var(--text)]">{f.name}</option>
                      ))}
                    </select>
                    <Button
                      type="primary"
                      onClick={() => setAddModalOpen(true)}
                      className="font-bold rounded-xl flex items-center gap-1.5"
                      style={{ background: "#FF5A2C", borderColor: "#FF5A2C", height: "38px" }}
                    >
                      <Plus className="w-4 h-4" /> Thêm bàn
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="py-4 px-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Mã bàn ăn</th>
                        <th className="py-4 px-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Khu vực tầng</th>
                        <th className="py-4 px-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Sức chứa</th>
                        <th className="py-4 px-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Hình dáng</th>
                        <th className="py-4 px-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Trạng thái</th>
                        <th className="py-4 px-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Menu QR Code</th>
                        <th className="py-4 px-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredTables.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-[var(--text-muted)]">Không tìm thấy bàn ăn phù hợp.</td>
                        </tr>
                      ) : (
                        filteredTables.map((t) => (
                          <tr key={t.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                            <td className="py-4 px-5 font-bold text-[var(--text)]">{t.number}</td>
                            <td className="py-4 px-5 text-sm text-[var(--text-muted)]">{t.area}</td>
                            <td className="py-4 px-5 text-sm text-[var(--text-muted)]">{t.capacity} người</td>
                            <td className="py-4 px-5 text-sm text-[var(--text-muted)]">{t.shape}</td>
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
                                      <Download className="w-3.5 h-3.5" /> Tải QR
                                    </a>
                                  </Tooltip>
                                  <a
                                    href={t.qrCodeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-500 hover:underline text-xs font-bold flex items-center gap-1"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5" /> Link Menu
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
                                  className="text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer"
                                >
                                  <Settings className="w-3.5 h-3.5" /> Cấu hình
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTable(t);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Xóa
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
        showDimensions
        initialWidth={1200}
        initialHeight={800}
        title="Thêm khu vực mới"
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
                  <Play className="w-4 h-4" /> {t("dashboard.tables.operational_modal.btn_unlock_text", { defaultValue: "Mở khóa & Sử dụng bàn ăn" })}
                </Button>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      size="large"
                      onClick={handleOpenTransfer}
                      className="flex items-center justify-center gap-1.5 h-11 font-bold"
                    >
                      <ArrowLeftRight className="w-4 h-4" /> {t("dashboard.tables.operational_modal.btn_transfer_text", { defaultValue: "Chuyển bàn" })}
                    </Button>
                    <Button
                      size="large"
                      onClick={handleOpenMerge}
                      className="flex items-center justify-center gap-1.5 h-11 font-bold"
                    >
                      <LinkIcon className="w-4 h-4" /> {t("dashboard.tables.operational_modal.btn_merge_text", { defaultValue: "Gộp bàn" })}
                    </Button>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    danger
                    onClick={closeSession}
                    className="w-full flex items-center justify-center gap-2 h-12 font-bold mt-1"
                  >
                    <DollarSign className="w-4 h-4" /> {t("dashboard.tables.operational_modal.btn_checkout_text", { defaultValue: "Thanh toán & Đóng bàn" })}
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
                    className="text-xs text-blue-500 hover:underline font-bold flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> {t("dashboard.tables.operational_modal.download_qr_text", { defaultValue: "Tải xuống hình ảnh QR Code của bàn này" })}
                  </a>
                  <a
                    href={sessionActionTable.qrCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#FF5A2C] hover:underline font-bold flex items-center justify-center gap-1"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> {t("dashboard.tables.operational_modal.go_to_menu_text", { defaultValue: "Đi tới trang gọi món (Menu) của bàn" })}
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
                <Settings className="w-3.5 h-3.5" /> {t("dashboard.tables.details.edit_table_config_text", { defaultValue: "Chỉnh sửa cấu hình bàn ăn" })}
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
            __html: DOMPurify.sanitize(t("dashboard.tables.transfer_modal.description", {
              number: sessionActionTable?.number || "",
              defaultValue: `Chọn một bàn ăn đang trống để chuyển toàn bộ phiên sử dụng và đơn hàng (nếu có) từ bàn <strong>${sessionActionTable?.number || ""}</strong> sang.`
            }))
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
            __html: DOMPurify.sanitize(t("dashboard.tables.merge_modal.description", {
              number: sessionActionTable?.number || "",
              defaultValue: `Chọn một bàn ăn đang hoạt động (đang có khách) để gộp phiên của bàn <strong>${sessionActionTable?.number || ""}</strong> vào đó. Cả hai bàn sẽ cùng liên kết tới một đơn hàng chung.`
            }))
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
