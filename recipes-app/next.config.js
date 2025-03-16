// next.config.js
// @ts-check
const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} = require("next/constants");

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'www.allrecipes.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'source.unsplash.com',
      'res.cloudinary.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      },
    ],
  },
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID,
    NUTRITIONIX_APP_ID: process.env.NUTRITIONIX_APP_ID,
    NUTRITIONIX_API_KEY: process.env.NUTRITIONIX_API_KEY,
    RAPID_API_KEY: process.env.RAPID_API_KEY,
  },
};

// Export the combined config
module.exports = withPWA(nextConfig);
