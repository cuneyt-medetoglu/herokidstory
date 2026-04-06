const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * iyzipay runtime'da __dirname + '/resources' ile lib/resources okur.
   * Paketlenirse __dirname .next/server/app/api/... altına kayar → ENOENT.
   */
  experimental: {
    serverComponentsExternalPackages: ['iyzipay'],
  },

  // Static HTML under locale prefix: /tr/story-ideas-helper.html → /story-ideas-helper.html
  async rewrites() {
    return [
      {
        source: '/:locale(en|tr)/story-ideas-helper.html',
        destination: '/story-ideas-helper.html',
      },
    ]
  },

  // Image optimization
  images: {
    remotePatterns: [
      // S3 – herokidstory bucket
      {
        protocol: 'https',
        hostname: 'herokidstory.s3.eu-central-1.amazonaws.com',
      },
      // DALL-E 3 images
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
      // OpenAI generated images (if needed)
      {
        protocol: 'https',
        hostname: '**.openai.com',
      },
      // Placeholder/dummy images (e.g. Examples hero from v0)
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    // Image optimization settings
    formats: []
    /*
        formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    */
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  },

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Enable SWC minification
    swcMinify: true,
    // Compress responses
    compress: true,
    // Optimize fonts
    optimizeFonts: true,
  }),

  // Development settings
  ...(process.env.NODE_ENV === 'development' && {
    // Enable React strict mode
    reactStrictMode: true,
  }),
}

module.exports = withNextIntl(nextConfig)

