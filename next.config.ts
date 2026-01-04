import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  //swcMinify: true,
  images: {
    domains: ['bubblyxyz.com'], // Add your image domains here
  },
  typescript: {
    ignoreBuildErrors: false, // Validate TypeScript during build
  },
  eslint: {
    ignoreDuringBuilds: false, // Run ESLint during build
  },
  output: 'standalone', // Use standalone output for better performance in production
  
};

export default nextConfig;
