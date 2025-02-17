/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // WARNING: This will allow builds even if there are TypeScript errors.
    ignoreBuildErrors: true,
  },
  experimental: {
    turbo: false,  // Disable Turbopack to avoid issues with node:fs in client bundles.
  },
  // Other Next.js configuration options can go here.
};

module.exports = nextConfig;
