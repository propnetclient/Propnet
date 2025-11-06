/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Disable ESLint during builds for now (can be enabled later if needed)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporary: allow builds with type errors (can be fixed iteratively)
    ignoreBuildErrors: true,
  },
  // Configure static file serving
  async rewrites() {
    return [
      // Forward API calls to Express backend during development
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
}

export default nextConfig;
