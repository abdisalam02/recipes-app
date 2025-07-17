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
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
      'images.unsplash.com',
      'images.pexels.com',
      'img.freepik.com',
      'cdn.pixabay.com',
      'images.spoonacular.com',
      'media.istockphoto.com',
      'pexels.com',
      'loremflickr.com',
      'picsum.photos',
      'example.com',
      'randomwordgenerator.com',
      'blogger.googleusercontent.com',
      'wp.com',
      'upload.wikimedia.org',
      'amazonaws.com',
      'i.imgur.com',
      'cloudinary.com',
      'res.cloudinary.com',
      'media-cdn.tripadvisor.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID,
    NUTRITIONIX_APP_ID: process.env.NUTRITIONIX_APP_ID,
    NUTRITIONIX_API_KEY: process.env.NUTRITIONIX_API_KEY,
    EDAMAM_APP_ID: process.env.EDAMAM_APP_ID,
    EDAMAM_API_KEY: process.env.EDAMAM_API_KEY,
    SPOONACULAR_API_KEY: process.env.SPOONACULAR_API_KEY,
    RAPID_API_KEY: process.env.RAPID_API_KEY
  },
  serverExternalPackages: ['sharp', 'kld-intersections'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
};

// Export the combined config
module.exports = withPWA(nextConfig);
