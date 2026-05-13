import {
  ITenant,
  ITenantRequest,
  TenantConfiguration,
  TenantApiResponse,
  TenantCreateInput,
  TenantRequestInput,
  TenantUpdateInput,
  BusinessHour,
} from "../types/tenant";
import adminAxiosInstance from "./adminAxiosInstance";

export interface TenantConfig {
  id: string;
  prefix: string;
  name: string;

  // Branding & Assets
  logoUrl?: string;
  faviconUrl?: string;
  backgroundUrl?: string;

  // Theme Colors (synced with globals.css variables)
  primaryColor: string;
  lightBaseColor?: string;
  lightSurfaceColor?: string;
  lightCardColor?: string;
  darkBaseColor?: string;
  darkSurfaceColor?: string;
  darkCardColor?: string;

  // Legacy color fields (API compatibility)
  baseColor: string;
  secondaryColor: string;
  headerColor: string;
  footerColor: string;

  // Network & Config
  networkIp?: string;
  connectionString?: string;
  status: boolean;
  hostname: string;
  expiredAt: string;

  // Business Info
  businessName: string;
  aboutUs?: string;
  aboutUsType?: "text" | "html";
  overview?: string;
  businessAddressLine1?: string;
  businessAddressLine2?: string;
  businessAddressLine3?: string;
  businessAddressLine4?: string;
  businessCounty?: string;
  businessPostCode?: string;
  businessCountry?: string;
  businessPrimaryPhone?: string;
  businessSecondaryPhone?: string;
  businessEmailAddress?: string;
  businessCompanyNumber?: string;
  businessOpeningHours?: string;

  // Meta
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  modifiedBy: string;
  tenantSettings: any[];
  configuration?: TenantConfiguration;
}

// Helper function to convert API response to frontend ITenant format
const mapApiResponseToTenant = (apiTenant: TenantApiResponse): ITenant => {
  return {
    id: apiTenant.id,
    name: apiTenant.name,
    hostName: apiTenant.hostname,
    networkIp: apiTenant.networkIp || "",
    businessName: apiTenant.businessName,
    logoUrl: apiTenant.logoUrl,
    phoneNumber: apiTenant.businessPrimaryPhone || "",
    addressLine1: apiTenant.businessAddressLine1 || "",
    addressLine2: apiTenant.businessAddressLine2 || "",
    addressLine3: apiTenant.businessAddressLine3 || "",
    addressLine4: apiTenant.businessAddressLine4 || "",
    ownerEmail: "",
    mailRestaurant: apiTenant.businessEmailAddress || "",
    plan: "basic",
    status: apiTenant.status ? "active" : "inactive",
    lastActive:
      apiTenant.modifiedDate ||
      apiTenant.createdDate ||
      new Date().toISOString(),
  };
};

// Helper function to convert frontend create input to API format
const mapCreateInputToApi = (input: TenantCreateInput) => {
  const slug = input.hostName || "";
  const fullHostname = input.isCustomDomain
    ? slug
    : slug.endsWith(".restx.food")
      ? slug
      : `${slug}.restx.food`;

  return {
    name: input.name,
    hostname: fullHostname,
    networkIp: fullHostname,
    businessName: input.businessName,
    businessAddressLine1: input.addressLine1,
    businessAddressLine2: input.addressLine2,
    businessAddressLine3: input.addressLine3,
    businessAddressLine4: input.addressLine4,
    businessPrimaryPhone: input.phoneNumber,
    businessEmailAddress: input.mailRestaurant,
    status: true,
    primaryColor: "#FF380B",
    lightBaseColor: "#FFFFFF",
    lightSurfaceColor: "#F9FAFB",
    lightCardColor: "#FFFFFF",
    darkBaseColor: "#0A0E14",
    darkSurfaceColor: "#1A1F2E",
    darkCardColor: "#151A24",
  };
};

/** Convert camelCase to PascalCase for C# backend compatibility */
const toPascalCase = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

const COLOR_FIELD_KEYS = new Set([
  "primaryColor",
  "lightBaseColor",
  "lightSurfaceColor",
  "lightCardColor",
  "darkBaseColor",
  "darkSurfaceColor",
  "darkCardColor",
]);

const normalizeFieldValue = (key: string, value: unknown): string => {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    COLOR_FIELD_KEYS.has(key) &&
    typeof value === "object" &&
    value !== null &&
    "toHexString" in value &&
    typeof (value as { toHexString?: unknown }).toHexString === "function"
  ) {
    return (value as { toHexString: () => string }).toHexString();
  }

  return String(value);
};

const normalizeBusinessHourTime = (raw: unknown, fallback: string): string => {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return fallback;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? "0");

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    Number.isNaN(second) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return fallback;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
};

const normalizeBusinessHourRecord = (raw: unknown): BusinessHour | null => {
  if (!raw || typeof raw !== "object") return null;

  const source = raw as Record<string, unknown>;
  const dayCandidate =
    source.dayOfWeek ?? source.dayofWeek ?? source.DayOfWeek ?? source.day;
  const parsedDay = Number(dayCandidate);
  if (!Number.isInteger(parsedDay) || parsedDay < 0 || parsedDay > 6) {
    return null;
  }

  const isClosedRaw =
    source.isClosed ?? source.isclosed ?? source.IsClosed ?? false;
  const isClosed =
    typeof isClosedRaw === "boolean"
      ? isClosedRaw
      : String(isClosedRaw).toLowerCase() === "true";

  return {
    dayOfWeek: parsedDay,
    openTime: normalizeBusinessHourTime(source.openTime ?? source.OpenTime, "09:00:00"),
    closeTime: normalizeBusinessHourTime(source.closeTime ?? source.CloseTime, "22:00:00"),
    isClosed,
  };
};

const normalizeBusinessHourList = (raw: unknown): BusinessHour[] => {
  const payload = Array.isArray(raw)
    ? raw
    : ((raw as Record<string, unknown> | null)?.data as unknown);

  if (!Array.isArray(payload)) return [];

  const byDay = new Map<number, BusinessHour>();
  payload.forEach((item) => {
    const normalized = normalizeBusinessHourRecord(item);
    if (!normalized) return;
    byDay.set(normalized.dayOfWeek, normalized);
  });

  const ordered: BusinessHour[] = [];
  for (let day = 0; day <= 6; day += 1) {
    const existing = byDay.get(day);
    if (existing) {
      ordered.push(existing);
      continue;
    }

    ordered.push({
      dayOfWeek: day,
      openTime: "09:00:00",
      closeTime: "22:00:00",
      isClosed: false,
    });
  }

  return ordered;
};

const toFormData = (
  data: any,
  files?: {
    logo?: File | null;
    background?: File | null;
    favicon?: File | null;
  },
): FormData => {
  const formData = new FormData();

  // Fields that are non-nullable `string` in C# TenantItem → MUST always be present.
  // If missing from FormData, ASP.NET model binding fails → 500.
  const requiredFields: string[] = [
    "name",
    "hostname",
    "status",
    "primaryColor",
    "lightBaseColor",
    "lightSurfaceColor",
    "lightCardColor",
    "darkBaseColor",
    "darkSurfaceColor",
    "darkCardColor",
    "businessName",
    "businessAddressLine1",
    "businessAddressLine2",
    "businessAddressLine3",
    "businessAddressLine4",
    "businessPrimaryPhone",
    "businessEmailAddress",
  ];

  const optionalFields: string[] = [
    "id",
    "prefix",
    "logoUrl",
    "faviconUrl",
    "backgroundUrl",
    "networkIp",
    "connectionString",
    "businessCounty",
    "businessPostCode",
    "businessCountry",
    "businessSecondaryPhone",
    "businessCompanyNumber",
    "businessOpeningHours",
    "aboutUs",
  ];

  const appendedKeys: string[] = [];

  // Always send required fields (fallback to '' if missing)
  requiredFields.forEach((key) => {
    const value = data[key];
    const pascalKey = toPascalCase(key);
    formData.append(pascalKey, normalizeFieldValue(key, value));
    appendedKeys.push(pascalKey);
  });

  // Only send optional fields when they have a value
  optionalFields.forEach((key) => {
    const value = data[key];
    if (value !== null && value !== undefined && value !== "") {
      const pascalKey = toPascalCase(key);
      formData.append(pascalKey, normalizeFieldValue(key, value));
      appendedKeys.push(pascalKey);
    }
  });

  const rawConfiguration = data.configuration ?? data.Configuration;
  const sessionBufferMinutes =
    rawConfiguration?.sessionBufferMinutes ??
    rawConfiguration?.SessionBufferMinutes;
  if (sessionBufferMinutes !== null && sessionBufferMinutes !== undefined) {
    formData.append(
      "Configuration.SessionBufferMinutes",
      normalizeFieldValue("sessionBufferMinutes", sessionBufferMinutes),
    );
    appendedKeys.push("Configuration.SessionBufferMinutes");
  }

  // Append file uploads (already PascalCase)
  if (files) {
    if (files.logo) {
      formData.append("LogoFile", files.logo);
      appendedKeys.push("LogoFile");
    }
    if (files.background) {
      formData.append("BackgroundFile", files.background);
      appendedKeys.push("BackgroundFile");
    }
    if (files.favicon) {
      formData.append("FaviconFile", files.favicon);
      appendedKeys.push("FaviconFile");
    }
  }

  console.log("[toFormData] Sending fields:", appendedKeys);

  return formData;
};

export const tenantService = {
  /**
   * Get tenant config by domain/hostname
   * Backend endpoint: GET /api/tenants/{data}
   * where {data} can be tenant ID or hostname (e.g., "demo")
   */
  getTenantConfig: async (domain: string): Promise<TenantConfig | null> => {
    try {
      const response = await adminAxiosInstance.get(`/tenants/${domain}`);

      if (response.status === 204) {
        return null;
      }

      const data = response.data;

      if (data) {
        // Comprehensive PascalCase -> camelCase normalization
        // Backend returns PascalCase default, frontend uses camelCase
        const pascalToCamelMap: Record<string, string> = {
          Id: "id",
          Name: "name",
          Prefix: "prefix",
          Hostname: "hostname",
          HostName: "hostname",
          Status: "status",
          BusinessName: "businessName",
          LogoUrl: "logoUrl",
          FaviconUrl: "faviconUrl",
          BackgroundUrl: "backgroundUrl",
          BaseColor: "baseColor",
          PrimaryColor: "primaryColor",
          SecondaryColor: "secondaryColor",
          HeaderColor: "headerColor",
          FooterColor: "footerColor",
          LightBaseColor: "lightBaseColor",
          LightSurfaceColor: "lightSurfaceColor",
          LightCardColor: "lightCardColor",
          DarkBaseColor: "darkBaseColor",
          DarkSurfaceColor: "darkSurfaceColor",
          DarkCardColor: "darkCardColor",
          NetworkIp: "networkIp",
          ConnectionString: "connectionString",
          ExpiredAt: "expiredAt",
          AboutUs: "aboutUs",
          AboutUsType: "aboutUsType",
          Overview: "overview",
          BusinessAddressLine1: "businessAddressLine1",
          BusinessAddressLine2: "businessAddressLine2",
          BusinessAddressLine3: "businessAddressLine3",
          BusinessAddressLine4: "businessAddressLine4",
          BusinessCounty: "businessCounty",
          BusinessPostCode: "businessPostCode",
          BusinessCountry: "businessCountry",
          BusinessPrimaryPhone: "businessPrimaryPhone",
          BusinessSecondaryPhone: "businessSecondaryPhone",
          BusinessEmailAddress: "businessEmailAddress",
          BusinessCompanyNumber: "businessCompanyNumber",
          BusinessOpeningHours: "businessOpeningHours",
          Configuration: "configuration",
          CreatedDate: "createdDate",
          ModifiedDate: "modifiedDate",
          CreatedBy: "createdBy",
          ModifiedBy: "modifiedBy",
          TenantSettings: "tenantSettings",
        };

        for (const [pascalKey, camelKey] of Object.entries(pascalToCamelMap)) {
          if (data[pascalKey] !== undefined && !data[camelKey]) {
            data[camelKey] = data[pascalKey];
          }
        }

        // Backend's TenantOverview DTO does NOT include Id field.
        // If id is still missing, resolve it by fetching the full tenant list
        // (GET /api/tenants returns full Tenant entities which include Id)
        if (!data.id && data.hostname) {
          try {
            const listResponse = await adminAxiosInstance.get("/tenants");
            const allTenants = listResponse.data;
            const match = allTenants.find(
              (t: any) => (t.hostname || t.Hostname) === data.hostname,
            );
            if (match) {
              data.id = match.id || match.Id;
            } else {
              console.warn(
                "[getTenantConfig] Could not find matching tenant for hostname:",
                data.hostname,
              );
            }
          } catch (listError) {
            console.error(
              "[getTenantConfig] Failed to resolve tenant ID:",
              listError,
            );
          }
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all tenants for admin panel (mapped to ITenant format)
   * Backend endpoint: GET /api/tenants
   */
  getAllTenantsForAdmin: async (): Promise<ITenant[]> => {
    const response =
      await adminAxiosInstance.get<TenantApiResponse[]>("/tenants");
    return response.data.map(mapApiResponseToTenant);
  },

  /**
   * Get tenant by ID (mapped to ITenant format)
   * Backend endpoint: GET /api/tenants/{id}
   */
  getTenantById: async (id: string): Promise<ITenant> => {
    const response = await adminAxiosInstance.get<TenantApiResponse>(
      `/tenants/${id}`,
    );
    return mapApiResponseToTenant(response.data);
  },

  /**
   * Create tenant
   * Backend endpoint: POST /api/tenants
   */
  createTenant: async (
    input: TenantCreateInput,
  ): Promise<TenantApiResponse> => {
    const apiData = mapCreateInputToApi(input);
    const formData = toFormData(apiData);
    const response = await adminAxiosInstance.post("/tenants", formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  /**
   * Update tenant
   * Backend endpoint: PUT /api/tenants/{id}
   */
  updateTenant: async (
    id: string,
    input: TenantCreateInput,
  ): Promise<TenantApiResponse> => {
    const apiData = mapCreateInputToApi(input);

    // Merge ID into the payload as some backends require it in the body too
    const payload = {
      ...apiData,
      id,
    };

    console.log("[updateTenant] Tenant ID:", id);
    console.log("[updateTenant] Input data:", input);
    console.log("[updateTenant] API payload:", payload);

    const formData = toFormData(payload);
    const response = await adminAxiosInstance.put(`/tenants/${id}`, formData, {
      headers: { "Content-Type": undefined },
    });
    console.log("[updateTenant] Response:", response.data);
    return response.data;
  },

  /**
   * Create or update tenant
   * Backend endpoint: POST /api/tenants OR PUT /api/tenants/{id}
   */
  upsertTenant: async (
    tenant: TenantUpdateInput | TenantConfig,
    files?: {
      logo?: File | null;
      background?: File | null;
      favicon?: File | null;
    },
  ) => {
    const findId = (obj: any): string | undefined => {
      if (!obj) return undefined;

      // Try lowercase id first (TypeScript interface)
      if (obj.id) return obj.id;

      // Try uppercase Id (C# Entity - backend returns PascalCase by default)
      if (obj.Id) return obj.Id;

      // Check if there is a nested 'tenant' property
      if (obj.tenant) {
        if (obj.tenant.id) return obj.tenant.id;
        if (obj.tenant.Id) return obj.tenant.Id;
      }

      return undefined;
    };

    const tenantId = findId(tenant);

    console.log("[tenantService] upsertTenant called for:", {
      name: tenant.name || (tenant as any).Name,
      resolvedId: tenantId,
      topLevelKeys: Object.keys(tenant),
      hasLowercaseId: !!tenant.id,
      hasUppercaseId: !!(tenant as any).Id,
      fullObject: JSON.stringify(tenant).substring(0, 200) + "...",
    });

    // If tenant has an ID, use PUT to update
    if (tenantId) {
      const formData = toFormData(tenant, files);

      console.log(`[tenantService] PUT /tenants/${tenantId}`);

      try {
        const response = await adminAxiosInstance.put(
          `/tenants/${tenantId}`,
          formData,
          {
            headers: { "Content-Type": undefined },
          },
        );
        console.log(
          "[tenantService] PUT success:",
          response.status,
          response.data,
        );
        return response;
      } catch (err: any) {
        console.error(
          "[tenantService] PUT failed:",
          err.response?.status,
          err.response?.data,
        );
        throw err;
      }
    } else {
      // Create new
      console.log("[tenantService] POST /tenants (no ID found)");
      const formData = toFormData(tenant, files);
      try {
        const response = await adminAxiosInstance.post("/tenants", formData, {
          headers: { "Content-Type": undefined },
        });
        console.log(
          "[tenantService] POST success:",
          response.status,
          response.data,
        );
        return response;
      } catch (err: any) {
        console.error(
          "[tenantService] POST failed:",
          err.response?.status,
          err.response?.data,
        );
        throw err;
      }
    }
  },

  /**
   * Get all tenants (for admin panel)
   * Backend endpoint: GET /api/tenants
   */
  getAllTenants: async (): Promise<TenantConfig[]> => {
    const response = await adminAxiosInstance.get("/tenants");
    return response.data;
  },

  /**
   * Delete tenant
   * Backend endpoint: DELETE /api/tenants/{id}
   */
  deleteTenant: async (id: string): Promise<void> => {
    await adminAxiosInstance.delete(`/tenants/${id}`);
  },

  changeStatus: async (id: string, status: boolean): Promise<void> => {
    await adminAxiosInstance.put(`/tenants/${id}/Status`, status);
  },

  // ============ TENANT REQUESTS API ============

  /**
   * Get all tenant requests
   * Backend endpoint: GET /api/tenants/requests
   */
  getAllTenantRequests: async (): Promise<ITenantRequest[]> => {
    const response = await adminAxiosInstance.get<any[]>("/tenants/requests");

    // Normalize PascalCase to camelCase (backend returns PascalCase)
    const normalizedData = response.data.map((item: any) => {
      const normalized: any = {};

      // Map PascalCase to camelCase
      const fieldMap: Record<string, string> = {
        Id: "id",
        Name: "name",
        Hostname: "hostname",
        BusinessName: "businessName",
        BusinessPrimaryPhone: "businessPrimaryPhone",
        BusinessEmailAddress: "businessEmailAddress",
        BusinessAddressLine1: "businessAddressLine1",
        BusinessAddressLine2: "businessAddressLine2",
        BusinessAddressLine3: "businessAddressLine3",
        BusinessAddressLine4: "businessAddressLine4",
        BusinessCountry: "businessCountry",
        TenantRequestStatus: "tenantRequestStatus",
        tenantRequestStatus: "tenantRequestStatus",
      };

      // Copy all fields, normalizing case
      for (const [pascalKey, camelKey] of Object.entries(fieldMap)) {
        if (item[pascalKey] !== undefined) {
          normalized[camelKey] = item[pascalKey];
        }
      }

      // Also copy lowercase fields if they exist
      if (item.id !== undefined) normalized.id = item.id;
      if (item.name !== undefined) normalized.name = item.name;
      if (item.hostname !== undefined) normalized.hostname = item.hostname;
      if (item.businessName !== undefined)
        normalized.businessName = item.businessName;
      if (item.businessPrimaryPhone !== undefined)
        normalized.businessPrimaryPhone = item.businessPrimaryPhone;
      if (item.businessEmailAddress !== undefined)
        normalized.businessEmailAddress = item.businessEmailAddress;
      if (item.businessAddressLine1 !== undefined)
        normalized.businessAddressLine1 = item.businessAddressLine1;
      if (item.businessAddressLine2 !== undefined)
        normalized.businessAddressLine2 = item.businessAddressLine2;
      if (item.businessAddressLine3 !== undefined)
        normalized.businessAddressLine3 = item.businessAddressLine3;
      if (item.businessAddressLine4 !== undefined)
        normalized.businessAddressLine4 = item.businessAddressLine4;
      if (item.businessCountry !== undefined)
        normalized.businessCountry = item.businessCountry;
      if (item.tenantRequestStatus !== undefined)
        normalized.tenantRequestStatus = item.tenantRequestStatus;

      return normalized as ITenantRequest;
    });

    return normalizedData;
  },

  /**
   * Get tenant request by ID
   * Backend endpoint: GET /api/tenants/requests/{id}
   */
  getTenantRequestById: async (id: string): Promise<ITenantRequest> => {
    const response = await adminAxiosInstance.get<ITenantRequest>(
      `/tenants/requests/${id}`,
    );
    return response.data;
  },

  /**
   * Add new tenant request (public - no auth required)
   * Backend endpoint: POST /api/tenants/requests
   */
  addTenantRequest: async (request: TenantRequestInput): Promise<string> => {
    const response = await adminAxiosInstance.post<string>(
      "/tenants/requests",
      request,
    );

    return response.data; // Returns the created tenant request ID (Guid)
  },

  /**
   * Accept tenant request
   * Backend endpoint: POST /api/tenants/requests/{id}/accept
   */
  acceptTenantRequest: async (id: string): Promise<string> => {
    const response = await adminAxiosInstance.post<string>(
      `/tenants/requests/${id}/accept`,
    );
    return response.data; // Returns the created tenant ID (Guid)
  },

  /**
   * Decline tenant request
   * Backend endpoint: POST /api/tenants/requests/{id}/decline
   */
  declineTenantRequest: async (id: string): Promise<string> => {
    const response = await adminAxiosInstance.post<string>(
      `/tenants/requests/${id}/decline`,
    );
    return response.data; // Returns the tenant request ID (Guid)
  },

  /**
   * Delete tenant request
   * Backend endpoint: DELETE /api/tenants/requests/{id}
   */
  // ============ PAYMENT SETTINGS API ============

  getBusinessHours: async (tenantId: string): Promise<BusinessHour[]> => {
    const response = await adminAxiosInstance.get<unknown>(`/tenants/${tenantId}/business-hours`);
    return normalizeBusinessHourList(response.data);
  },

  updateBusinessHours: async (tenantId: string, hours: BusinessHour[]): Promise<void> => {
    const orderedHours = normalizeBusinessHourList(hours)
      .slice()
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((item) => ({
        dayOfWeek: item.dayOfWeek,
        openTime: normalizeBusinessHourTime(item.openTime, "09:00:00"),
        closeTime: normalizeBusinessHourTime(item.closeTime, "22:00:00"),
        isClosed: Boolean(item.isClosed),
      }));

    await adminAxiosInstance.put(`/tenants/${tenantId}/business-hours`, orderedHours);
  },

  /**
   * Get payment settings for a tenant
   * Backend endpoint: GET /api/tenants/{id}/payment-settings
   */
  getPaymentSettings: async (tenantId: string): Promise<any> => {
    try {
      const response = await adminAxiosInstance.get(
        `/tenants/${tenantId}/payment-settings`,
      );

      const data = response.data;
      if (!data) return null;

      return {
        clientId: data.clientId ?? data.ClientId ?? "",
        apiKey: data.apiKey ?? data.ApiKey ?? "",
        checksumKey: data.checksumKey ?? data.ChecksumKey ?? "",
        returnUrl: data.returnUrl ?? data.ReturnUrl ?? "",
        cancelUrl: data.cancelUrl ?? data.CancelUrl ?? "",
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null; // Not configured yet
      }
      throw error;
    }
  },

  /**
   * Create payment settings
   * Backend endpoint: POST /api/tenants/{id}/payment-settings
   */
  createPaymentSettings: async (
    tenantId: string,
    settings: any,
  ): Promise<void> => {
    await adminAxiosInstance.post(
      `/tenants/${tenantId}/payment-settings`,
      settings,
    );
  },

  /**
   * Update payment settings
   * Backend endpoint: PUT /api/tenants/{id}/payment-settings
   */
  updatePaymentSettings: async (
    tenantId: string,
    settings: any,
  ): Promise<void> => {
    await adminAxiosInstance.put(
      `/tenants/${tenantId}/payment-settings`,
      settings,
    );
  },

  /**
   * @deprecated Use createPaymentSettings() or updatePaymentSettings() instead
   */
  upsertPaymentSettings: async (
    tenantId: string,
    settings: any,
  ): Promise<void> => {
    await tenantService.updatePaymentSettings(tenantId, settings);
  },

  /**
   * @deprecated Use addTenantRequest() instead
   * Submit tenant request (public - no auth required)
   * Creates tenant with status = false (pending approval)
   * Backend endpoint: POST /api/tenants
   */
  submitTenantRequest: async (
    input: TenantCreateInput,
  ): Promise<TenantApiResponse> => {
    const apiData = mapCreateInputToApi(input);

    // Force status to false (pending)
    const requestData = {
      ...apiData,
      status: false,
    };

    const formData = toFormData(requestData);
    const response = await adminAxiosInstance.post("/tenants", formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  /**
   * @deprecated Use getAllTenantRequests() instead
   * Get all pending tenant requests (status = false)
   * Backend endpoint: GET /api/tenants
   * Filters for tenants with status = false
   */
  getPendingTenantRequests: async (): Promise<ITenant[]> => {
    const response =
      await adminAxiosInstance.get<TenantApiResponse[]>("/tenants");
    const allTenants = response.data.map(mapApiResponseToTenant);

    // Filter only pending requests (inactive status)
    return allTenants.filter((tenant) => tenant.status === "inactive");
  },

  /**
   * @deprecated Use acceptTenantRequest() instead
   * Approve tenant request (set status = true)
   * Backend endpoint: PUT /api/tenants/{id}
   */
  approveTenantRequest: async (id: string): Promise<TenantApiResponse> => {
    // Get current tenant data
    const tenant = await adminAxiosInstance.get<TenantApiResponse>(
      `/tenants/${id}`,
    );

    // Update with status = true
    const approvedData = {
      ...tenant.data,
      status: true,
    };

    const formData = toFormData(approvedData);
    const response = await adminAxiosInstance.put(`/tenants/${id}`, formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  /**
   * @deprecated Use declineTenantRequest() or deleteTenantRequest() instead
   * Reject tenant request (delete the tenant)
   * Backend endpoint: DELETE /api/tenants/{id}
   */
  rejectTenantRequest: async (id: string): Promise<void> => {
    await adminAxiosInstance.delete(`/tenants/${id}`);
  },
};
