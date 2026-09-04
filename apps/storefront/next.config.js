/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
  },
  images: {
    // Product photos are loaded from images.unsplash.com at runtime. The
    // storefront uses next/image to resize them, so the host must be on the
    // remotePatterns allowlist.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;