/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: false,
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
    'rc-resize-observer'
  ],
  // API rewrites for CORS bypass
  async rewrites() {
    const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'xfoodi.website';
    const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.INTERNAL_ADMIN_API_URL || `https://api.${BASE_DOMAIN}/api`;
    const tenantApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.INTERNAL_API_URL || `https://api.${BASE_DOMAIN}/api`;

    return [
      {
        source: '/api/admin/:path*',
        destination: `${adminApiUrl}/:path*`,
      },
      {
        source: '/hubs/:path*',
        destination: `${tenantApiUrl.replace(/\/api$/, '')}/hubs/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${tenantApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
