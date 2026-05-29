import axios from 'axios';

const getAdminBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        return process.env.INTERNAL_ADMIN_API_URL || 'http://localhost:4999/api';
    }

    const host = window.location.host;
    const hostWithoutPort = host.includes(':') ? host.split(':')[0] : host;
    const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website";

    const isLocalNetwork =
        hostWithoutPort === 'localhost' ||
        hostWithoutPort === '127.0.0.1' ||
        hostWithoutPort.endsWith('.localhost') ||
        /^192\.168\./.test(hostWithoutPort) ||
        /^10\./.test(hostWithoutPort) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostWithoutPort);

    if (isLocalNetwork) {
        return '/api/admin';
    }

    const parts = hostWithoutPort.split('.');
    // Only build dynamic admin subdomain for *.BASE_DOMAIN domains.
    // For custom domains (e.g. lebon.io.vn), always use the fixed admin backend.
    const isXFoodiDomain =
        parts.length >= 2 && parts.slice(-2).join('.') === BASE_DOMAIN;

    if (isXFoodiDomain) {
        // Always resolve to api.BASE_DOMAIN regardless of subdomain depth:
        // xfoodi.website        → api.xfoodi.website
        // www.xfoodi.website    → api.xfoodi.website
        // demo.xfoodi.website   → api.xfoodi.website
        return `${window.location.protocol}//api.${BASE_DOMAIN}/api`;
    } else {
        // Custom domain — always route to the fixed api backend
        return `https://api.${BASE_DOMAIN}/api`;
    }
};

const adminAxiosInstance = axios.create({
    baseURL: getAdminBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Recalculate baseURL on every request so it always reflects the current
// window.location (important for custom domains like lebon.io.vn that must
// always hit admin.xfoodi.com regardless of when the module was first loaded).
adminAxiosInstance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            config.baseURL = getAdminBaseUrl();

            // Add tenant domain header
            const host = window.location.host;
            const hostWithoutPort = host.includes(':') ? host.split(':')[0] : host;
            config.headers['X-Tenant-Domain'] = hostWithoutPort;
        }

        // Doc adminAccessToken tu ca hai storage (rememberMe=true -> localStorage, rememberMe=false -> sessionStorage)
        const token = localStorage.getItem('adminAccessToken') || sessionStorage.getItem('adminAccessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

adminAxiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Mute Expected 404s to avoid console clutter. 
            const isExpected404 =
                error.response.status === 404 &&
                (error.config?.url?.includes("/payment-settings"));

            if (!isExpected404) {
                console.error('[adminAxios] Error response:', {
                    status: error.response.status,
                    url: error.config?.url,
                    method: error.config?.method?.toUpperCase(),
                    data: error.response.data,
                    headers: error.response.headers,
                });
            }
        }
        return Promise.reject(error);
    }
);

export default adminAxiosInstance;
