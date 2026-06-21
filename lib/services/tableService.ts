import axiosInstance from './axiosInstance';

export enum TableStatus {
    Available = 0,
    Occupied = 1
}

export interface TableItem {
    id: string;
    code: string;
    type: string;
    seatingCapacity: number;
    shape: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation: number;
    isActive: boolean;
    tableStatusId: TableStatus;
    floorId?: string;
    floorName?: string;
    // Backend optional fields
    has3DView?: boolean;
    viewDescription?: string;
    defaultViewUrl?: string;
    tableStatusName?: string;
    qrCodeUrl?: string;
    // Single panorama image URL (front face)
    cubeFrontImageUrl?: string;
    cubeBackImageUrl?: string;
    cubeLeftImageUrl?: string;
    cubeRightImageUrl?: string;
    cubeTopImageUrl?: string;
    cubeBottomImageUrl?: string;
}

/** Panorama image upload payload */
export interface PanoramaImage {
    front?: File | null;
}

/** Matches BE: TableSessionInfo DTO from GET /api/tables/sessions */
export interface TableSessionInfo {
    id: string;
    sessionId?: string;
    tableId: string;
    tableCode?: string;
    orderId?: string | null;
    reservationId?: string | null;
    startedAt: string;
    endedAt?: string | null;
    isActive: boolean;
    orderReference?: string | null;
    orderTotalAmount?: number | null;
    reservation?: TableSessionReservationInfo | null;
}

export interface TableSessionReservationStatusInfo {
    id?: number;
    code?: string;
    name?: string;
    colorCode?: string;
}

export interface TableSessionReservationContactInfo {
    name?: string;
    phone?: string;
    email?: string;
    customerId?: string;
    membershipLevel?: string;
    loyaltyPoints?: number;
}

export interface TableSessionReservationInfo {
    id: string;
    confirmationCode?: string;
    reservationDateTime?: string;
    numberOfGuests?: number;
    specialRequests?: string;
    contact?: TableSessionReservationContactInfo;
    status?: TableSessionReservationStatusInfo;
    checkedInAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface MergeTableRequest {
    tableIds: string[];
    reservationId?: string | null;
    customerId?: string | null;
}

export interface MoveTableRequest {
    sourceTableId: string;
    targetTableId: string;
}

export interface MergeTableResponse {
    orderId?: string | null;
    requiresManualResolution: boolean;
    message: string;
    existingOrderIds: string[];
    sessions: TableSessionInfo[];
}

const normalizeReservationStatus = (payload: unknown): TableSessionReservationStatusInfo | undefined => {
    if (!payload || typeof payload !== 'object') return undefined;

    const data = payload as Record<string, unknown>;
    const code = typeof data.code === 'string' ? data.code : undefined;
    const name = typeof data.name === 'string' ? data.name : undefined;
    const colorCode = typeof data.colorCode === 'string' ? data.colorCode : undefined;
    const id = typeof data.id === 'number' ? data.id : undefined;

    if (id == null && !code && !name && !colorCode) return undefined;

    return {
        id,
        code,
        name,
        colorCode,
    };
};

const normalizeReservationContact = (payload: unknown): TableSessionReservationContactInfo | undefined => {
    if (!payload || typeof payload !== 'object') return undefined;

    const data = payload as Record<string, unknown>;
    const name = typeof data.name === 'string' ? data.name : undefined;
    const phone = typeof data.phone === 'string' ? data.phone : undefined;
    const email = typeof data.email === 'string' ? data.email : undefined;
    const customerId = typeof data.customerId === 'string' ? data.customerId : undefined;
    const membershipLevel =
        typeof data.membershipLevel === 'string' ? data.membershipLevel : undefined;
    const loyaltyPoints =
        typeof data.loyaltyPoints === 'number' ? data.loyaltyPoints : undefined;

    if (!name && !phone && !email && !customerId && !membershipLevel && loyaltyPoints == null) {
        return undefined;
    }

    return {
        name,
        phone,
        email,
        customerId,
        membershipLevel,
        loyaltyPoints,
    };
};

const normalizeSessionReservation = (payload: unknown): TableSessionReservationInfo | null => {
    if (!payload || typeof payload !== 'object') return null;

    const data = payload as Record<string, unknown>;
    const id = typeof data.id === 'string' ? data.id.trim() : '';
    if (!id) return null;

    return {
        id,
        confirmationCode:
            typeof data.confirmationCode === 'string' ? data.confirmationCode : undefined,
        reservationDateTime:
            typeof data.reservationDateTime === 'string' ? data.reservationDateTime : undefined,
        numberOfGuests:
            typeof data.numberOfGuests === 'number' ? data.numberOfGuests : undefined,
        specialRequests:
            typeof data.specialRequests === 'string' ? data.specialRequests : undefined,
        contact: normalizeReservationContact(data.contact),
        status: normalizeReservationStatus(data.status),
        checkedInAt: typeof data.checkedInAt === 'string' ? data.checkedInAt : null,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    };
};

const normalizeSessionInfo = (payload: unknown): TableSessionInfo | null => {
    if (!payload || typeof payload !== 'object') return null;

    const data = payload as Record<string, unknown>;
    const id = String(data.id ?? data.sessionId ?? '').trim();
    const tableId = String(data.tableId ?? '').trim();
    const startedAt = String(data.startedAt ?? '').trim();

    if (!id || !tableId || !startedAt) return null;

    const normalizedReservation = normalizeSessionReservation(data.reservation);

    return {
        id,
        sessionId: String(data.sessionId ?? data.id ?? id),
        tableId,
        tableCode: typeof data.tableCode === 'string' ? data.tableCode : undefined,
        orderId: typeof data.orderId === 'string' ? data.orderId : null,
        reservationId: typeof data.reservationId === 'string' ? data.reservationId : null,
        startedAt,
        endedAt: typeof data.endedAt === 'string' ? data.endedAt : null,
        isActive: Boolean(data.isActive),
        orderReference: typeof data.orderReference === 'string' ? data.orderReference : null,
        orderTotalAmount: typeof data.orderTotalAmount === 'number' ? data.orderTotalAmount : null,
        reservation: normalizedReservation,
    };
};

const normalizeSessionList = (payload: unknown): TableSessionInfo[] => {
    if (Array.isArray(payload)) {
        return payload.map(normalizeSessionInfo).filter((item): item is TableSessionInfo => Boolean(item));
    }

    const envelope = payload as Record<string, unknown> | null;
    const nested = envelope?.data;
    if (Array.isArray(nested)) {
        return nested.map(normalizeSessionInfo).filter((item): item is TableSessionInfo => Boolean(item));
    }

    const single = normalizeSessionInfo(payload);
    return single ? [single] : [];
};

/**
 * Build a FormData from a Partial<TableItem>.
 * Required because BE uses [FromForm] for PUT /api/tables/{id}.
 */
function buildTableFormData(id: string, table: Partial<TableItem>): FormData {
    const fd = new FormData();
    fd.append('Id', id);
    if (table.code !== undefined) fd.append('Code', table.code);
    if (table.seatingCapacity !== undefined) fd.append('SeatingCapacity', String(table.seatingCapacity));
    if (table.type !== undefined) fd.append('Type', table.type);
    if (table.floorId !== undefined) fd.append('FloorId', table.floorId);
    if (table.shape !== undefined) fd.append('Shape', table.shape);
    if (table.positionX !== undefined) fd.append('PositionX', String(table.positionX));
    if (table.positionY !== undefined) fd.append('PositionY', String(table.positionY));
    if (table.width !== undefined) fd.append('Width', String(table.width));
    if (table.height !== undefined) fd.append('Height', String(table.height));
    if (table.rotation !== undefined) fd.append('Rotation', String(table.rotation));
    if (table.isActive !== undefined) fd.append('IsActive', String(table.isActive));
    if (table.tableStatusId !== undefined) fd.append('TableStatusId', String(table.tableStatusId));
    if (table.tableStatusName !== undefined) fd.append('TableStatusName', table.tableStatusName ?? '');
    if (table.floorName !== undefined) fd.append('FloorName', table.floorName ?? '');
    if (table.has3DView !== undefined) fd.append('Has3DView', String(table.has3DView));
    if (table.viewDescription !== undefined) fd.append('ViewDescription', table.viewDescription ?? '');
    if (table.defaultViewUrl !== undefined) fd.append('DefaultViewUrl', table.defaultViewUrl ?? '');
    if (table.qrCodeUrl !== undefined) fd.append('QRCodeUrl', table.qrCodeUrl ?? '');
    // Pass-through panorama URL so BE does not clear it
    fd.append('CubeFrontImageUrl', table.cubeFrontImageUrl ?? '');
    fd.append('CubeBackImageUrl', table.cubeBackImageUrl ?? '');
    fd.append('CubeLeftImageUrl', table.cubeLeftImageUrl ?? '');
    fd.append('CubeRightImageUrl', table.cubeRightImageUrl ?? '');
    fd.append('CubeTopImageUrl', table.cubeTopImageUrl ?? '');
    fd.append('CubeBottomImageUrl', table.cubeBottomImageUrl ?? '');
    fd.append('ClearCubemap', 'false');
    return fd;
}

const extractTables = (payload: unknown): TableItem[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload as TableItem[];

    const data = payload as Record<string, unknown>;
    const candidates = [
        data.data,
        data.Data,
        data.items,
        data.Items,
        data.tables,
        data.Tables,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate as TableItem[];
    }

    return [];
};

export const tableService = {
    /** GET /api/tables — AllowAnonymous */
    getAllTables: async (): Promise<TableItem[]> => {
        const response = await axiosInstance.get('/tables');
        return extractTables(response.data);
    },

    /** GET /api/tables/{id} — AllowAnonymous */
    getTableById: async (id: string): Promise<TableItem> => {
        const response = await axiosInstance.get(`/tables/${id}`);
        const direct = response.data as TableItem;
        if (direct && typeof direct === 'object' && 'id' in direct) return direct;

        const data = response.data as Record<string, unknown>;
        const nested = (data?.data || data?.Data) as TableItem | undefined;
        if (nested) return nested;

        throw new Error('Invalid table payload');
    },

    /** POST /api/tables — Requires Admin role */
    createTable: async (table: Partial<TableItem>): Promise<TableItem> => {
        const response = await axiosInstance.post<TableItem>('/tables', table);
        return response.data;
    },

    /**
     * PUT /api/tables/{id} — Requires Admin role
     * BE uses [FromForm] so we MUST send multipart/form-data (not JSON).
     */
    updateTable: async (id: string, table: Partial<TableItem>): Promise<TableItem> => {
        const fd = buildTableFormData(id, table);
        const response = await axiosInstance.put<TableItem>(`/tables/${id}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * PUT /api/tables/{id} — multipart/form-data with single panorama image.
     */
    updateTableWithPanorama: async (
        id: string,
        table: Partial<TableItem>,
        panorama: PanoramaImage,
        clearPanorama = false,
    ): Promise<TableItem> => {
        const fd = buildTableFormData(id, table);

        // Keep BE contract key name
        fd.set('ClearCubemap', String(clearPanorama));

        // Single panorama image mapped to front face
        if (panorama.front) fd.append('CubeFrontImage', panorama.front);

        const response = await axiosInstance.put<TableItem>(`/tables/${id}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },


    /** DELETE /api/tables/{id} — Requires Admin role */
    deleteTable: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/tables/${id}`);
    },

    /** PUT /api/tables/{id}/status — Requires Auth */
    updateStatus: async (id: string, status: TableStatus): Promise<TableItem> => {
        const response = await axiosInstance.put<TableItem>(
            `/tables/${id}/status`,
            status,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    /** GET /api/tables/sessions — Requires Auth (Admin/Staff) */
    getTableSessions: async (at?: string): Promise<TableSessionInfo[]> => {
        const params = at ? { at } : {};
        const response = await axiosInstance.get<unknown>('/tables/sessions', { params });
        return normalizeSessionList(response.data);
    },

    /** POST /api/tables/{tableId}/sessions — Create a new table session */
    createTableSession: async (tableId: string, customerId?: string, reservationId?: string): Promise<TableSessionInfo> => {
        const params: Record<string, string> = {};
        if (customerId) params.customerId = customerId;
        if (reservationId) params.reservationId = reservationId;
        const response = await axiosInstance.post<unknown>(`/tables/${tableId}/sessions`, null, { params });
        const normalized = normalizeSessionInfo(response.data);
        if (!normalized) throw new Error('Invalid table session payload');
        return normalized;
    },

    /** PUT /api/tables/sessions/close — Close active sessions by table id */
    closeTableSession: async (tableIds: string[]): Promise<void> => {
        await axiosInstance.put('/tables/sessions/close', tableIds, {
            headers: { 'Content-Type': 'application/json' },
        });
    },

    /** POST /api/tables/merge — Merge multiple tables */
    mergeTables: async (request: MergeTableRequest): Promise<MergeTableResponse> => {
        try {
            const response = await axiosInstance.post<MergeTableResponse>('/tables/merge', request);
            return response.data;
        } catch (error: unknown) {
            const conflictResponse = (error as {
                response?: {
                    status?: number;
                    data?: MergeTableResponse;
                };
            }).response;

            // BE returns 409 when multiple existing orders require manual resolution.
            if (conflictResponse?.status === 409 && conflictResponse.data?.requiresManualResolution) {
                return conflictResponse.data;
            }

            throw error;
        }
    },

    /** POST /api/tables/move — Move the active session (and its order) to another table */
    moveTable: async (request: MoveTableRequest): Promise<TableSessionInfo> => {
        const response = await axiosInstance.post<unknown>('/tables/move', request);
        const normalized = normalizeSessionInfo(response.data);

        if (!normalized) {
            throw new Error('Invalid table session payload');
        }

        return normalized;
    },
};

/** Summary DTO returned by GET /api/floors */
export interface FloorSummary {
    id: string;
    name: string;
    width: number;
    height: number;
    imageUrl?: string;
    tableCount?: number;
    isActive?: boolean;
}

/**
 * Full layout DTO returned by GET /api/floors/{id}/layout
 * Matches BE: FloorLayoutResponse
 */
export interface FloorLayoutResponse {
    floor: {
        id: string;
        name: string;
        width: number;
        height: number;
        backgroundImageUrl?: string;
    };
    tables: FloorLayoutTableItem[];
}

/** Matches BE: TableLayoutItem */
export interface FloorLayoutTableItem {
    id: string;
    code: string;
    seatingCapacity: number;
    /** Numeric enum as string: "0"=Available, "1"=Occupied */
    status: string;
    layout: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        shape: string;
    };
}

/** Matches BE: SaveLayoutRequest */
export interface SaveLayoutRequest {
    tables: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>;
}

export const floorService = {
    /**
     * GET /api/floors — AllowAnonymous
     * Returns list of all active floors with table count.
     * Response: { success: true, data: FloorSummary[] }
     */
    getAllFloors: async (): Promise<FloorSummary[]> => {
        const response = await axiosInstance.get<{ success: boolean; data: FloorSummary[] }>('/floors');
        return response.data?.data ?? [];
    },

    /**
     * GET /api/floors/{id} — AllowAnonymous
     * Response: { success: true, data: FloorSummary }
     */
    getFloorById: async (id: string): Promise<FloorSummary | null> => {
        const response = await axiosInstance.get<{ success: boolean; data: FloorSummary }>(`/floors/${id}`);
        return response.data?.data ?? null;
    },

    /**
     * GET /api/floors/{floorId}/layout — AllowAnonymous
     * Returns full layout with table positions.
     * Response: { success: true, data: FloorLayoutResponse }
     */
    getFloorLayout: async (floorId: string, at?: string): Promise<FloorLayoutResponse | null> => {
        const url = at ? `/floors/${floorId}/layout?at=${encodeURIComponent(at)}` : `/floors/${floorId}/layout`;
        const response = await axiosInstance.get<{ success: boolean; data: FloorLayoutResponse }>(url);
        return response.data?.data ?? null;
    },

    /**
     * PUT /api/floors/{floorId}/layout — Requires Admin role
     * Saves table positions for a floor.
     */
    saveFloorLayout: async (floorId: string, request: SaveLayoutRequest): Promise<void> => {
        await axiosInstance.put(`/floors/${floorId}/layout`, request);
    },

    /**
     * POST /api/floors — Requires Admin role
     * Creates a new floor, optionally with a background image (uploaded to Cloudinary).
     * BE expects [FromForm] Floor DTO.
     */
    createFloor: async (data: { name: string; width?: number; height?: number; image?: File }): Promise<string> => {
        const formData = new FormData();
        formData.append('Name', data.name);
        formData.append('Width', String(data.width ?? 1400));
        formData.append('Height', String(data.height ?? 900));
        formData.append('IsActive', 'true');
        if (data.image) formData.append('Image', data.image);

        const response = await axiosInstance.post<{ success: boolean; data: { id: string } }>('/floors', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data?.data?.id ?? '';
    },

    /**
     * PUT /api/floors/{id} — Requires Admin role
     * Updates floor metadata and/or background image.
     * BE expects [FromForm] Floor DTO with optional IFormFile Image.
     */
    updateFloor: async (id: string, data: { name?: string; width?: number; height?: number; image?: File; isActive?: boolean }): Promise<void> => {
        const formData = new FormData();
        if (data.name !== undefined) formData.append('Name', data.name);
        if (data.width !== undefined) formData.append('Width', String(data.width));
        if (data.height !== undefined) formData.append('Height', String(data.height));
        if (data.isActive !== undefined) formData.append('IsActive', String(data.isActive));
        if (data.image) formData.append('Image', data.image);

        await axiosInstance.put(`/floors/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    /**
     * DELETE /api/floors/{id} — Requires Admin role
     */
    deleteFloor: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/floors/${id}`);
    },
};

export default tableService;
