/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "standalone", // Bỏ comment khi deploy lên Linux/Docker — Windows không hỗ trợ symlink
  reactStrictMode: false,
  experimental: {
    middlewareClientMaxBodySize: 100 * 1024 * 1024, // 100MB
  },
  transpilePackages: [
    'antd',
    '@ant-design',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-notification',
    'rc-tooltip',
    'rc-tree',
    'rc-table',
    '@rc-component/form',
    '@rc-component/portal',
    '@rc-component/trigger',
    '@rc-component/tour',
    '@rc-component/mini-decimal',
    'rc-drawer',
    'rc-dialog',
    'rc-resize-observer',
    'mapbox-gl',
  ],
  // API rewrites for CORS bypass
  // IMPORTANT: rewrites run server-side, so we MUST use the internal/private URL
  // (e.g. http://backend:5000) to avoid a 508 infinite-loop where the public URL
  // (api.xfoodi.website) resolves back to the same Next.js container.
  // INTERNAL_API_URL and INTERNAL_ADMIN_API_URL must be set in the deployment
  // environment (Docker, k8s, etc.) to the backend's internal address.
  async rewrites() {
    const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'xfoodi.website';

    // Server-side rewrite destinations — prefer internal URL to avoid proxy loops
    const adminApiUrl =
      process.env.INTERNAL_ADMIN_API_URL ||
      process.env.NEXT_PUBLIC_ADMIN_API_URL ||
      `https://api.${BASE_DOMAIN}/api`;
    const tenantApiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      `https://api.${BASE_DOMAIN}/api`;

    // Strip trailing /api to avoid double /api/api
    const tenantBase = tenantApiUrl.replace(/\/api$/, '');
    const adminBase = adminApiUrl.replace(/\/api$/, '');

    console.log('[next.config] Rewrite destinations:');
    console.log('  /api/admin/* ->', `${adminBase}/api/:path*`);
    console.log('  /api/*       ->', `${tenantBase}/api/:path*`);
    console.log('  /hubs/*      ->', `${tenantBase}/hubs/:path*`);

    return [
      {
        source: '/api/admin/:path*',
        destination: `${adminBase}/api/:path*`,
      },
      {
        source: '/hubs/:path*',
        destination: `${tenantBase}/hubs/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${tenantBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
