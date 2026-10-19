/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/teacher',
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en/dashboard',
        permanent: false,
      },
      {
        source: '/:locale(en|es|de|fr|it|pt|ca|ja)',
        destination: '/:locale/dashboard',
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

