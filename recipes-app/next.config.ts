/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // WARNING: This will allow builds even if there are TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Other Next.js configuration options can go here.
};

module.exports = nextConfig;
