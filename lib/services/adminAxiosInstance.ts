import axios from 'axios';

const getAdminBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        return process.env.INTERNAL_ADMIN_API_URL || 'http://localhost:4999/api';
    }

    const host = window.location.host;
    const hostWithoutPort = host.includes(':') ? host.split(':')[0] : host;

    if (hostWithoutPort === 'localhost' ||
        hostWithoutPort === '127.0.0.1' ||
        hostWithoutPort.endsWith('.localhost')) {
        return '/api/admin';
    }

    const parts = hostWithoutPort.split('.');
    // Only build dynamic admin subdomain for *.restx.food domains.
    // For custom domains (e.g. lebon.io.vn), always use the fixed admin backend.
    const isRestxDomain =
        parts.length >= 2 && parts.slice(-2).join('.') === 'restx.food';

    if (isRestxDomain) {
        // Always resolve to admin.restx.food regardless of subdomain depth:
        // restx.food        → admin.restx.food
        // www.restx.food    → admin.restx.food
        // demo.restx.food   → admin.restx.food
        return `${window.location.protocol}//admin.restx.food/api`;
    } else {
        // Custom domain — always route to the fixed admin backend
        return 'https://admin.restx.food/api';
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
// always hit admin.restx.food regardless of when the module was first loaded).
adminAxiosInstance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            config.baseURL = getAdminBaseUrl();
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
