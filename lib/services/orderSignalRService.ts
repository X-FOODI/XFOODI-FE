import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel
} from "@microsoft/signalr";

const getHubUrl = () => {
  if (typeof window === "undefined") return "/hubs/orders";

  const base = process.env.NEXT_PUBLIC_SIGNALR_URL;
  return base ? `${base}/hubs/orders` : "/hubs/orders";
};

const getStoredAccessToken = () => {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("adminAccessToken") ||
    sessionStorage.getItem("adminAccessToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
};

let connection: HubConnection | null = null;
const tenantGroupRefCounts = new Map<string, number>();
let lifecycleEventsBound = false;

const normalizeTenantId = (tenantId: string) => tenantId.trim().toLowerCase();

const syncTenantGroups = async (conn: HubConnection) => {
  const tenantIds = Array.from(tenantGroupRefCounts.keys());
  await Promise.all(
    tenantIds.map(async (tenantId) => {
      try {
        await conn.invoke("JoinTenantGroup", tenantId);
      } catch (error) {
        console.error("SignalR: Failed to rejoin tenant group", {
          tenantId,
          error,
        });
      }
    }),
  );
};

const bindLifecycleEvents = (conn: HubConnection) => {
  if (lifecycleEventsBound) return;
  lifecycleEventsBound = true;

  conn.onreconnected(async () => {
    await syncTenantGroups(conn);
  });
};

const invokeWhenConnected = async (methodName: string, ...args: any[]) => {
  const conn = getConnection();
  if (conn.state === HubConnectionState.Connected) {
    return await conn.invoke(methodName, ...args);
  }

  console.warn(
    `SignalR: Cannot invoke ${methodName} because state is ${conn.state}`,
  );
};

const joinTenantGroup = async (tenantId: string) => {
  const normalizedTenantId = normalizeTenantId(tenantId || "");
  if (!normalizedTenantId) return;

  const currentRefCount = tenantGroupRefCounts.get(normalizedTenantId) || 0;
  tenantGroupRefCounts.set(normalizedTenantId, currentRefCount + 1);

  if (currentRefCount === 0) {
    await invokeWhenConnected("JoinTenantGroup", normalizedTenantId);
  }
};

const leaveTenantGroup = async (tenantId: string) => {
  const normalizedTenantId = normalizeTenantId(tenantId || "");
  if (!normalizedTenantId) return;

  const currentRefCount = tenantGroupRefCounts.get(normalizedTenantId) || 0;
  if (currentRefCount <= 0) return;

  if (currentRefCount === 1) {
    tenantGroupRefCounts.delete(normalizedTenantId);
    await invokeWhenConnected("LeaveTenantGroup", normalizedTenantId);
    return;
  }

  tenantGroupRefCounts.set(normalizedTenantId, currentRefCount - 1);
};

const getConnection = () => {
  if (!connection) {
    const hubUrl = getHubUrl();
    
    connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () =>
          getStoredAccessToken(),
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.serverTimeoutInMilliseconds = 60000;
    connection.keepAliveIntervalInMilliseconds = 20000;
    bindLifecycleEvents(connection);
  }
  return connection;
};

const start = async () => {
  if (typeof window === "undefined") return;
  const conn = getConnection();
  if (conn.state === HubConnectionState.Disconnected) {
    await conn.start();
    await syncTenantGroups(conn);
  }
};

const stop = async () => {
  if (!connection) return;
  if (connection.state !== HubConnectionState.Disconnected) {
    await connection.stop();
  }
};

const invoke = async (methodName: string, ...args: any[]) => {
  if (methodName === "JoinTenantGroup") {
    const tenantId = String(args[0] || "");
    return await joinTenantGroup(tenantId);
  }

  if (methodName === "LeaveTenantGroup") {
    const tenantId = String(args[0] || "");
    return await leaveTenantGroup(tenantId);
  }

  return await invokeWhenConnected(methodName, ...args);
};

const on = <T>(eventName: string, handler: (payload: T) => void) => {
  const conn = getConnection();
  conn.on(eventName, handler);
};

const off = <T>(eventName: string, handler: (payload: T) => void) => {
  if (!connection) return;
  connection.off(eventName, handler);
};

const orderSignalRService = {
  start,
  stop,
  invoke,
  joinTenantGroup,
  leaveTenantGroup,
  on,
  off,
  getConnection,
};

export default orderSignalRService;
