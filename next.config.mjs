/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Use standalone output for better production builds
  output: 'standalone',
};

export default nextConfig;
